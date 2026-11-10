
const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("settings")
    .setDescription("Configure Railroad for this server.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)

    .addSubcommand(subcommand =>
      subcommand
        .setName("xp")
        .setDescription("Configure message XP and cooldown.")
        .addIntegerOption(option =>
          option.setName("minimum")
            .setDescription("Minimum XP per message.")
            .setMinValue(1)
            .setMaxValue(1000)
            .setRequired(true))
        .addIntegerOption(option =>
          option.setName("maximum")
            .setDescription("Maximum XP per message.")
            .setMinValue(1)
            .setMaxValue(1000)
            .setRequired(true))
        .addIntegerOption(option =>
          option.setName("cooldown")
            .setDescription("Cooldown in seconds.")
            .setMinValue(1)
            .setMaxValue(3600)
            .setRequired(true)))

    .addSubcommand(subcommand =>
      subcommand
        .setName("channel")
        .setDescription("Set the level-up announcement channel.")
        .addChannelOption(option =>
          option.setName("channel")
            .setDescription("Channel for level-up announcements.")
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)))

    .addSubcommand(subcommand =>
      subcommand
        .setName("toggle")
        .setDescription("Enable or disable leveling.")
        .addBooleanOption(option =>
          option.setName("enabled")
            .setDescription("Should leveling be enabled?")
            .setRequired(true)))

    .addSubcommand(subcommand =>
      subcommand
        .setName("announcements")
        .setDescription("Enable or disable level-up announcements.")
        .addBooleanOption(option =>
          option.setName("enabled")
            .setDescription("Should announcements be enabled?")
            .setRequired(true))),

  async execute(interaction) {
    if (!interaction.memberPermissions.has(PermissionFlagsBits.ManageGuild)) {
      return interaction.reply({
        content: "You need Manage Server permission to change these settings.",
        ephemeral: true
      });
    }

    const db = interaction.client.db;
    const guildId = interaction.guildId;
    const action = interaction.options.getSubcommand();

    db.prepare(`
      INSERT OR IGNORE INTO guild_settings (guild_id)
      VALUES (?)
    `).run(guildId);

    if (action === "xp") {
      const minimum = interaction.options.getInteger("minimum");
      const maximum = interaction.options.getInteger("maximum");
      const cooldown = interaction.options.getInteger("cooldown");

      if (minimum > maximum) {
        return interaction.reply({
          content: "Minimum XP cannot be greater than maximum XP.",
          ephemeral: true
        });
      }

      db.prepare(`
        UPDATE guild_settings
        SET min_xp = ?, max_xp = ?, cooldown = ?
        WHERE guild_id = ?
      `).run(minimum, maximum, cooldown, guildId);

      return interaction.reply({
        content:
          `**XP settings updated!**\n` +
          `Minimum XP: **${minimum}**\n` +
          `Maximum XP: **${maximum}**\n` +
          `Cooldown: **${cooldown} seconds**`
      });
    }

    if (action === "channel") {
      const channel = interaction.options.getChannel("channel");

      db.prepare(`
        UPDATE guild_settings
        SET announcement_channel = ?
        WHERE guild_id = ?
      `).run(channel.id, guildId);

      return interaction.reply({
        content: `Level-up announcements will now be sent to ${channel}.`
      });
    }

    if (action === "toggle") {
      const enabled = interaction.options.getBoolean("enabled");

      db.prepare(`
        UPDATE guild_settings
        SET enabled = ?
        WHERE guild_id = ?
      `).run(enabled ? 1 : 0, guildId);

      return interaction.reply({
        content: `Leveling has been **${enabled ? "enabled" : "disabled"}** for this server.`
      });
    }

    if (action === "announcements") {
      const enabled = interaction.options.getBoolean("enabled");

      db.prepare(`
        UPDATE guild_settings
        SET announcement_enabled = ?
        WHERE guild_id = ?
      `).run(enabled ? 1 : 0, guildId);

      return interaction.reply({
        content: `Level-up announcements have been **${enabled ? "enabled" : "disabled"}**.`
      });
    }
  }
};
