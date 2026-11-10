
const {
  SlashCommandBuilder,
  EmbedBuilder
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("activity")
    .setDescription("View the server's XP activity over the last 7 days."),

  async execute(interaction) {
    const db = interaction.client.db;
    const guildId = interaction.guildId;

    const stats = db.prepare(`
      SELECT
        COALESCE(SUM(amount), 0) AS xp_earned,
        COUNT(*) AS messages,
        COUNT(DISTINCT user_id) AS active_members
      FROM xp_history
      WHERE guild_id = ?
      AND created_at >= datetime('now', '-7 days')
    `).get(guildId);

    const topMember = db.prepare(`
      SELECT user_id, SUM(amount) AS xp_earned
      FROM xp_history
      WHERE guild_id = ?
      AND created_at >= datetime('now', '-7 days')
      GROUP BY user_id
      ORDER BY xp_earned DESC
      LIMIT 1
    `).get(guildId);

    const topText = topMember
      ? `<@${topMember.user_id}> — ${topMember.xp_earned.toLocaleString()} XP`
      : "No XP activity recorded yet.";

    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle("🚂 Weekly Leveling Activity")
      .setDescription(
        `Leveling activity in **${interaction.guild.name}** over the last 7 days.`
      )
      .addFields(
        {
          name: "✨ XP Earned",
          value: stats.xp_earned.toLocaleString(),
          inline: true
        },
        {
          name: "💬 XP-earning Messages",
          value: stats.messages.toLocaleString(),
          inline: true
        },
        {
          name: "👥 Active Members",
          value: stats.active_members.toLocaleString(),
          inline: true
        },
        {
          name: "🏆 Top XP Earner",
          value: topText
        }
      )
      .setFooter({
        text: "Railroad • Weekly Activity Report"
      })
      .setTimestamp();

    await interaction.reply({
      embeds: [embed]
    });
  }
};
