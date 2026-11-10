
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
      .setTitle("Railroad | Help Center")
      .setDescription(
        "Welcome to Railroad! Here is your guide to the available commands."
      )
      .addFields(
        {
          name: "📊 Leveling",
          value:
            "`/rank` — View a member's rank.\n" +
            "`/profile` — View a leveling profile.\n" +
            "`/level view` — View a member's level.\n" +
            "`/level requirements` — Check XP requirements.\n" +
            "`/leaderboard` — View the server leaderboard."
        },
        {
          name: "🏆 Statistics & Activity",
          value:
            "`/levelstats` — View server leveling statistics.\n" +
            "`/activity` — View the last 7 days of XP activity.\n" +
            "`/compare` — Compare your progress with another member."
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
            "`/reward add` — Add a level reward.\n" +
            "`/reward remove` — Remove a level reward.\n" +
            "`/reward list` — View configured rewards.\n" +
            "`/reward test` — Preview rewards for a member."
        },
        {
          name: "⚙️ Server Configuration",
          value:
            "`/settings` — Configure leveling settings.\n" +
            "`/exclusions` — Manage excluded channels and roles."
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
