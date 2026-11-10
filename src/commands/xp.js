
const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits
} = require("discord.js");

const { getLevelFromXP } = require("../leveling");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("xp")
    .setDescription("Manage member XP.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)

    .addSubcommand(subcommand =>
      subcommand
        .setName("add")
        .setDescription("Give a member XP.")
        .addUserOption(option =>
          option.setName("user")
            .setDescription("Member to give XP to.")
            .setRequired(true))
        .addIntegerOption(option =>
          option.setName("amount")
            .setDescription("Amount of XP to give.")
            .setMinValue(1)
            .setMaxValue(1000000)
            .setRequired(true)))

    .addSubcommand(subcommand =>
      subcommand
        .setName("remove")
        .setDescription("Remove a member's XP.")
        .addUserOption(option =>
          option.setName("user")
            .setDescription("Member to remove XP from.")
            .setRequired(true))
        .addIntegerOption(option =>
          option.setName("amount")
            .setDescription("Amount of XP to remove.")
            .setMinValue(1)
            .setMaxValue(1000000)
            .setRequired(true)))

    .addSubcommand(subcommand =>
      subcommand
        .setName("set")
        .setDescription("Set a member's XP.")
        .addUserOption(option =>
          option.setName("user")
            .setDescription("Member whose XP to set.")
            .setRequired(true))
        .addIntegerOption(option =>
          option.setName("amount")
            .setDescription("New XP amount.")
            .setMinValue(0)
            .setMaxValue(100000000)
            .setRequired(true)))

    .addSubcommand(subcommand =>
      subcommand
        .setName("reset")
        .setDescription("Reset a member's XP.")
        .addUserOption(option =>
          option.setName("user")
            .setDescription("Member whose XP to reset.")
            .setRequired(true)))

    .addSubcommand(subcommand =>
      subcommand
        .setName("history")
        .setDescription("View a member's recent XP history.")
        .addUserOption(option =>
          option.setName("user")
            .setDescription("Member whose history to view.")
            .setRequired(true))),

  async execute(interaction) {
    if (!interaction.memberPermissions.has(PermissionFlagsBits.ManageGuild)) {
      return interaction.reply({
        content: "You need Manage Server permission to use this command.",
        ephemeral: true
      });
    }

    const db = interaction.client.db;
    const guildId = interaction.guildId;
    const subcommand = interaction.options.getSubcommand();
    const target = interaction.options.getUser("user");

    db.prepare(`
      INSERT OR IGNORE INTO users (guild_id, user_id)
      VALUES (?, ?)
    `).run(guildId, target.id);

    const user = db.prepare(`
      SELECT * FROM users
      WHERE guild_id = ? AND user_id = ?
    `).get(guildId, target.id);

    if (subcommand === "history") {
      const history = db.prepare(`
        SELECT amount, reason, created_at
        FROM xp_history
        WHERE guild_id = ? AND user_id = ?
        ORDER BY id DESC
        LIMIT 10
      `).all(guildId, target.id);

      if (history.length === 0) {
        return interaction.reply({
          content: `${target.username} has no recorded XP history.`,
          ephemeral: true
        });
      }

      const description = history.map(entry => {
        const sign = entry.amount >= 0 ? "+" : "";
        return `**${sign}${entry.amount} XP** — ${entry.reason || "Unknown"}\n<t:${Math.floor(new Date(entry.created_at + " UTC").getTime() / 1000)}:R>`;
      }).join("\n\n");

      const embed = new EmbedBuilder()
        .setColor(0x3498DB)
        .setTitle(`${target.username}'s XP History`)
        .setDescription(description);

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    let newXP = user.xp;
    let historyAmount = 0;
    let reason = "";

    if (subcommand === "add") {
      historyAmount = interaction.options.getInteger("amount");
      newXP += historyAmount;
      reason = "Admin XP addition";
    }

    if (subcommand === "remove") {
      historyAmount = -Math.min(
        user.xp,
        interaction.options.getInteger("amount")
      );
      newXP += historyAmount;
      reason = "Admin XP removal";
    }

    if (subcommand === "set") {
      newXP = interaction.options.getInteger("amount");
      historyAmount = newXP - user.xp;
      reason = "Admin XP adjustment";
    }

    if (subcommand === "reset") {
      newXP = 0;
      historyAmount = -user.xp;
      reason = "Admin XP reset";
    }

    const newLevel = getLevelFromXP(newXP);

    db.prepare(`
      UPDATE users
      SET xp = ?, level = ?
      WHERE guild_id = ? AND user_id = ?
    `).run(newXP, newLevel, guildId, target.id);

    if (historyAmount !== 0) {
      db.prepare(`
        INSERT INTO xp_history (guild_id, user_id, amount, reason)
        VALUES (?, ?, ?, ?)
      `).run(guildId, target.id, historyAmount, reason);
    }

    await interaction.reply({
      content: `Updated **${target.username}**'s XP.\nXP: **${user.xp.toLocaleString()}** → **${newXP.toLocaleString()}**\nLevel: **${user.level}** → **${newLevel}**`
    });
  }
};
