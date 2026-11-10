
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

  // Create default server settings if needed
  db.prepare(`
    INSERT OR IGNORE INTO guild_settings (guild_id)
    VALUES (?)
  `).run(guildId);

  const settings = db.prepare(`
    SELECT * FROM guild_settings WHERE guild_id = ?
  `).get(guildId);

  if (!settings || !settings.enabled) return;

  // Get or create the member's leveling record
  db.prepare(`
    INSERT OR IGNORE INTO users (guild_id, user_id)
    VALUES (?, ?)
  `).run(guildId, userId);

  const user = db.prepare(`
    SELECT * FROM users
    WHERE guild_id = ? AND user_id = ?
  `).get(guildId, userId);

  // Apply the message cooldown
  if (now - user.last_message < settings.cooldown * 1000) {
    return;
  }

  const minXP = Math.max(1, settings.min_xp);
  const maxXP = Math.max(minXP, settings.max_xp);

  const earnedXP =
    Math.floor(Math.random() * (maxXP - minXP + 1)) + minXP;

  const newXP = user.xp + earnedXP;
  const newLevel = getLevelFromXP(newXP);

  // Save XP and level
  db.prepare(`
    UPDATE users
    SET xp = ?, total_xp = ?, level = ?, last_message = ?
    WHERE guild_id = ? AND user_id = ?
  `).run(newXP, user.total_xp + earnedXP, newLevel, now, guildId, userId);

  // Record XP history
  db.prepare(`
    INSERT INTO xp_history (guild_id, user_id, amount, reason)
    VALUES (?, ?, ?, ?)
  `).run(guildId, userId, earnedXP, "Message");

  // Announce level-ups
  if (newLevel > user.level && settings.announcement_enabled) {
    const channel = settings.announcement_channel
      ? message.guild.channels.cache.get(settings.announcement_channel)
      : message.channel;

    if (channel && channel.isTextBased()) {
      channel.send({
        content: `🎉 Congratulations ${message.author}! You reached **Level ${newLevel}**!`
      }).catch(() => {});
    }
  }
}

module.exports = {
  handleMessage,
  xpForLevel,
  getLevelFromXP
};
