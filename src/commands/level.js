
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
    .setName("level")
    .setDescription("View level information.")

    .addSubcommand(subcommand =>
      subcommand
        .setName("view")
        .setDescription("View a member's level.")
        .addUserOption(option =>
          option
            .setName("user")
            .setDescription("Member to look up.")
            .setRequired(false)
        )
    )

    .addSubcommand(subcommand =>
      subcommand
        .setName("requirements")
        .setDescription("Check the XP needed for a level.")
        .addIntegerOption(option =>
          option
            .setName("level")
            .setDescription("The level you want to check.")
            .setMinValue(1)
            .setMaxValue(1000)
            .setRequired(true)
        )
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const db = interaction.client.db;

    if (subcommand === "requirements") {
      const level = interaction.options.getInteger("level");
      const requiredXP = xpForLevel(level);

      const embed = new EmbedBuilder()
        .setColor(0x3498DB)
        .setTitle(`Level ${level} Requirements`)
        .setDescription(
          `You need **${requiredXP.toLocaleString()} XP** to reach level ${level}.`
        )
        .setFooter({ text: "Railroad Leveling System" });

      return interaction.reply({ embeds: [embed] });
    }

    if (subcommand === "view") {
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

      const currentLevel = getLevelFromXP(user.xp);
      const currentRequirement = xpForLevel(currentLevel);
      const nextRequirement = xpForLevel(currentLevel + 1);
      const progress = user.xp - currentRequirement;
      const needed = nextRequirement - currentRequirement;

      const percentage = Math.floor((progress / needed) * 100);

      const embed = new EmbedBuilder()
        .setColor(0x3498DB)
        .setTitle(`${target.username}'s Level Information`)
        .setThumbnail(target.displayAvatarURL())
        .addFields(
          {
            name: "Current Level",
            value: `${currentLevel}`,
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
            value: `${currentLevel + 1}`,
            inline: true
          },
          {
            name: "XP Remaining",
            value: `${Math.max(0, nextRequirement - user.xp).toLocaleString()}`,
            inline: true
          },
          {
            name: "Progress",
            value: `${percentage}%`,
            inline: true
          }
        )
        .setFooter({ text: "Railroad Leveling System" });

      return interaction.reply({ embeds: [embed] });
    }
  }
};
