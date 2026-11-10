
const {
  SlashCommandBuilder,
  EmbedBuilder
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("View Railroad's commands and features."),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle("🚂 Railroad | Help Center")
      .setDescription(
        "Welcome to Railroad! Here's a guide to the available commands."
      )
      .addFields(
        {
          name: "📊 Leveling",
          value:
            "`/rank` — View your rank or another member's rank.\n" +
            "`/profile` — View a leveling profile.\n" +
            "`/level view` — View a member's level.\n" +
            "`/level requirements` — Check XP needed for a level.\n" +
            "`/leaderboard` — View the server leaderboard."
        },
        {
          name: "⭐ XP Management",
          value:
            "`/xp add` — Add XP to a member.\n" +
            "`/xp remove` — Remove XP from a member.\n" +
            "`/xp set` — Set a member's XP.\n" +
            "`/xp reset` — Reset a member's XP.\n" +
            "`/xp history` — View XP history."
        },
        {
          name: "🎁 Level Rewards",
          value:
            "`/reward add` — Create a level reward.\n" +
            "`/reward remove` — Remove a level reward.\n" +
            "`/reward list` — View configured rewards.\n" +
            "`/reward test` — Preview rewards for a member."
        },
        {
          name: "⚙️ Server Configuration",
          value:
            "`/settings` — Configure leveling settings.\n" +
            "`/exclusions` — Manage excluded channels and roles."
        },
        {
          name: "❓ Need Help?",
          value:
            "Use `/help` whenever you need a reminder of Railroad's commands."
        }
      )
      .setFooter({
        text: "Railroad • Advanced Public Leveling Bot"
      })
      .setTimestamp();

    await interaction.reply({
      embeds: [embed]
    });
  }
};
