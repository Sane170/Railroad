
function xpForLevel(level) {
  return 5 * level * level + 50 * level;
}

function getLevelFromXP(xp) {
  let level = 0;

  while (xp >= xpForLevel(level + 1)) {
    level++;
  }

  return level;
}

async function handleMessage(message, db) {
  if (!message.guild || message.author.bot) return;

  const guildId = message.guild.id;
  const userId = message.author.id;
  const now = Date.now();

  db.prepare(`
    INSERT OR IGNORE INTO guild_settings (guild_id)
    VALUES (?)
  `).run(guildId);

  const settings = db.prepare(`
    SELECT * FROM guild_settings WHERE guild_id = ?
  `).get(guildId);

  if (!settings || !settings.enabled) return;

  db.prepare(`
    INSERT OR IGNORE INTO users (guild_id, user_id)
    VALUES (?, ?)
  `).run(guildId, userId);

  const user = db.prepare(`
    SELECT * FROM users
    WHERE guild_id = ? AND user_id = ?
  `).get(guildId, userId);

  if (now - user.last_message < settings.cooldown * 1000) {
    return;
  }

  const minXP = Math.max(1, settings.min_xp);
  const maxXP = Math.max(minXP, settings.max_xp);

  const earnedXP =
    Math.floor(Math.random() * (maxXP - minXP + 1)) + minXP;

  const newXP = user.xp + earnedXP;
  const newLevel = getLevelFromXP(newXP);

  db.prepare(`
    UPDATE users
    SET xp = ?, total_xp = ?, level = ?, last_message = ?
    WHERE guild_id = ? AND user_id = ?
  `).run(
    newXP,
    user.total_xp + earnedXP,
    newLevel,
    now,
    guildId,
    userId
  );

  db.prepare(`
    INSERT INTO xp_history (guild_id, user_id, amount, reason)
    VALUES (?, ?, ?, ?)
  `).run(guildId, userId, earnedXP, "Message");

  // Handle level rewards
  if (newLevel > user.level) {
    try {
      const member = await message.guild.members.fetch(userId);

      const rewards = db.prepare(`
        SELECT role_id
        FROM level_rewards
        WHERE guild_id = ?
        AND level > ?
        AND level <= ?
      `).all(guildId, user.level, newLevel);

      const rolesToAdd = rewards
        .map(reward => message.guild.roles.cache.get(reward.role_id))
        .filter(role =>
          role &&
          !role.managed &&
          role.position < message.guild.members.me.roles.highest.position &&
          !member.roles.cache.has(role.id)
        );

      if (rolesToAdd.length > 0) {
        await member.roles.add(
          rolesToAdd,
          `Railroad level reward: reached level ${newLevel}`
        );
      }
    } catch (error) {
      console.error("Level reward assignment error:", error);
    }

    // Announce level-up
    if (settings.announcement_enabled) {
      const channel = settings.announcement_channel
        ? message.guild.channels.cache.get(settings.announcement_channel)
        : message.channel;

      if (channel && channel.isTextBased()) {
        await channel.send({
          content: `🎉 Congratulations ${message.author}! You reached **Level ${newLevel}**!`
        }).catch(error => {
          console.error("Level-up announcement error:", error);
        });
      }
    }
  }
}

module.exports = {
  handleMessage,
  xpForLevel,
  getLevelFromXP
};
