
const {
  SlashCommandBuilder,
  EmbedBuilder
} = require("discord.js");

const {
  xpForLevel,
  getLevelFromXP
} = require("../leveling");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("profile")
    .setDescription("View a member's leveling profile.")
    .addUserOption(option =>
      option
        .setName("user")
        .setDescription("Member whose profile you want to view.")
        .setRequired(false)
    ),

  async execute(interaction) {
    const db = interaction.client.db;
    const target =
      interaction.options.getUser("user") || interaction.user;

    const user = db.prepare(`
      SELECT xp, level, total_xp
      FROM users
      WHERE guild_id = ? AND user_id = ?
    `).get(interaction.guildId, target.id);

    if (!user) {
      return interaction.reply({
        content: `${target.username} hasn't earned any XP yet.`,
        ephemeral: true
      });
    }

    const level = getLevelFromXP(user.xp);
    const currentLevelXP = xpForLevel(level);
    const nextLevelXP = xpForLevel(level + 1);

    const progress = user.xp - currentLevelXP;
    const required = nextLevelXP - currentLevelXP;

    const percentage = Math.floor((progress / required) * 100);

    const position = db.prepare(`
      SELECT COUNT(*) + 1 AS rank
      FROM users
      WHERE guild_id = ? AND xp > ?
    `).get(interaction.guildId, user.xp).rank;

    const embed = new EmbedBuilder()
      .setColor(0x3498DB)
      .setAuthor({
        name: `${target.username}'s Profile`,
        iconURL: target.displayAvatarURL()
      })
      .setThumbnail(target.displayAvatarURL())
      .addFields(
        {
          name: "Server Rank",
          value: `#${position}`,
          inline: true
        },
        {
          name: "Level",
          value: `${level}`,
          inline: true
        },
        {
          name: "Current XP",
          value: user.xp.toLocaleString(),
          inline: true
        },
        {
          name: "Lifetime XP",
          value: user.total_xp.toLocaleString(),
          inline: true
        },
        {
          name: "Next Level",
          value: `${level + 1}`,
          inline: true
        },
        {
          name: "Progress",
          value: `${percentage}%`,
          inline: true
        },
        {
          name: "XP Progress",
          value: `${progress.toLocaleString()} / ${required.toLocaleString()} XP`
        }
      )
      .setFooter({
        text: `Railroad • ${interaction.guild.name}`
      })
      .setTimestamp();

    await interaction.reply({
      embeds: [embed]
    });
  }
};
