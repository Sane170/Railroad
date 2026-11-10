
const {
  SlashCommandBuilder,
  EmbedBuilder
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("levelstats")
    .setDescription("View this server's leveling statistics."),

  async execute(interaction) {
    const db = interaction.client.db;
    const guildId = interaction.guildId;

    const stats = db.prepare(`
      SELECT
        COUNT(*) AS tracked_members,
        COALESCE(SUM(total_xp), 0) AS total_xp_earned,
        COALESCE(MAX(level), 0) AS highest_level,
        COALESCE(AVG(level), 0) AS average_level,
        COALESCE(SUM(CASE WHEN total_xp > 0 THEN 1 ELSE 0 END), 0)
          AS active_members
      FROM users
      WHERE guild_id = ?
    `).get(guildId);

    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle("🚂 Server Leveling Statistics")
      .setDescription(
        `Here's an overview of leveling activity in **${interaction.guild.name}**.`
      )
      .addFields(
        {
          name: "👥 Tracked Members",
          value: stats.tracked_members.toLocaleString(),
          inline: true
        },
        {
          name: "⭐ Active Members",
          value: stats.active_members.toLocaleString(),
          inline: true
        },
        {
          name: "🏆 Highest Level",
          value: stats.highest_level.toLocaleString(),
          inline: true
        },
        {
          name: "✨ Total XP Earned",
          value: stats.total_xp_earned.toLocaleString(),
          inline: true
        },
        {
          name: "📊 Average Level",
          value: stats.average_level.toFixed(2),
          inline: true
        }
      )
      .setFooter({
        text: "Railroad • Server Statistics"
      })
      .setTimestamp();

    await interaction.reply({
      embeds: [embed]
    });
  }
};
