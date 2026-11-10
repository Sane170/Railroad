
const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  EmbedBuilder
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("exclusions")
    .setDescription("Manage channels and roles excluded from earning XP.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)

    .addSubcommand(subcommand =>
      subcommand
        .setName("add-channel")
        .setDescription("Prevent XP from being earned in a channel.")
        .addChannelOption(option =>
          option
            .setName("channel")
            .setDescription("The channel to exclude.")
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
    )

    .addSubcommand(subcommand =>
      subcommand
        .setName("remove-channel")
        .setDescription("Allow XP to be earned in a channel again.")
        .addChannelOption(option =>
          option
            .setName("channel")
            .setDescription("The channel to remove.")
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
    )

    .addSubcommand(subcommand =>
      subcommand
        .setName("add-role")
        .setDescription("Prevent members with a role from earning XP.")
        .addRoleOption(option =>
          option
            .setName("role")
            .setDescription("The role to exclude.")
            .setRequired(true)
        )
    )

    .addSubcommand(subcommand =>
      subcommand
        .setName("remove-role")
        .setDescription("Allow members with a role to earn XP again.")
        .addRoleOption(option =>
          option
            .setName("role")
            .setDescription("The role to remove.")
            .setRequired(true)
        )
    )

    .addSubcommand(subcommand =>
      subcommand
        .setName("list")
        .setDescription("View all excluded channels and roles.")
    ),

  async execute(interaction) {
    const db = interaction.client.db;
    const guildId = interaction.guildId;
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "add-channel") {
      const channel = interaction.options.getChannel("channel");

      db.prepare(`
        INSERT OR IGNORE INTO leveling_exclusions
        (guild_id, target_id, target_type)
        VALUES (?, ?, 'channel')
      `).run(guildId, channel.id);

      return interaction.reply({
        content: `XP is now disabled in ${channel}.`,
        ephemeral: true
      });
    }

    if (subcommand === "remove-channel") {
      const channel = interaction.options.getChannel("channel");

      const result = db.prepare(`
        DELETE FROM leveling_exclusions
        WHERE guild_id = ?
        AND target_id = ?
        AND target_type = 'channel'
      `).run(guildId, channel.id);

      return interaction.reply({
        content: result.changes
          ? `XP is now allowed in ${channel}.`
          : `${channel} was not excluded.`,
        ephemeral: true
      });
    }

    if (subcommand === "add-role") {
      const role = interaction.options.getRole("role");

      db.prepare(`
        INSERT OR IGNORE INTO leveling_exclusions
        (guild_id, target_id, target_type)
        VALUES (?, ?, 'role')
      `).run(guildId, role.id);

      return interaction.reply({
        content: `Members with ${role} will no longer earn XP.`,
        ephemeral: true
      });
    }

    if (subcommand === "remove-role") {
      const role = interaction.options.getRole("role");

      const result = db.prepare(`
        DELETE FROM leveling_exclusions
        WHERE guild_id = ?
        AND target_id = ?
        AND target_type = 'role'
      `).run(guildId, role.id);

      return interaction.reply({
        content: result.changes
          ? `Members with ${role} can earn XP again.`
          : `${role.name} was not excluded.`,
        ephemeral: true
      });
    }

    if (subcommand === "list") {
      const exclusions = db.prepare(`
        SELECT target_id, target_type
        FROM leveling_exclusions
        WHERE guild_id = ?
        ORDER BY target_type, target_id
      `).all(guildId);

      const channels = exclusions
        .filter(item => item.target_type === "channel")
        .map(item => `<#${item.target_id}>`);

      const roles = exclusions
        .filter(item => item.target_type === "role")
        .map(item => `<@&${item.target_id}>`);

      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle("Railroad | XP Exclusions")
        .addFields(
          {
            name: `Excluded Channels (${channels.length})`,
            value: channels.length ? channels.join("\n") : "None"
          },
          {
            name: `Excluded Roles (${roles.length})`,
            value: roles.length ? roles.join("\n") : "None"
          }
        )
        .setFooter({ text: "Only affects this server." });

      return interaction.reply({
        embeds: [embed],
        ephemeral: true
      });
    }
  }
};
