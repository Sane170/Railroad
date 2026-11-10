
const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("reward")
    .setDescription("Manage automatic level role rewards.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)

    .addSubcommand(subcommand =>
      subcommand
        .setName("add")
        .setDescription("Add a role reward for a level.")
        .addIntegerOption(option =>
          option.setName("level")
            .setDescription("Level required for this reward.")
            .setMinValue(1)
            .setMaxValue(1000)
            .setRequired(true))
        .addRoleOption(option =>
          option.setName("role")
            .setDescription("Role awarded at this level.")
            .setRequired(true)))

    .addSubcommand(subcommand =>
      subcommand
        .setName("remove")
        .setDescription("Remove a level role reward.")
        .addIntegerOption(option =>
          option.setName("level")
            .setDescription("Reward level.")
            .setMinValue(1)
            .setMaxValue(1000)
            .setRequired(true))
        .addRoleOption(option =>
          option.setName("role")
            .setDescription("Role to remove from this reward.")
            .setRequired(true)))

    .addSubcommand(subcommand =>
      subcommand
        .setName("list")
        .setDescription("View all configured level rewards."))

    .addSubcommand(subcommand =>
      subcommand
        .setName("test")
        .setDescription("Check rewards a member qualifies for.")
        .addUserOption(option =>
          option.setName("user")
            .setDescription("Member to check.")
            .setRequired(false))),

  async execute(interaction) {
    const db = interaction.client.db;
    const guildId = interaction.guildId;
    const action = interaction.options.getSubcommand();

    if (!interaction.memberPermissions.has(PermissionFlagsBits.ManageGuild)) {
      return interaction.reply({
        content: "You need Manage Server permission to use this command.",
        ephemeral: true
      });
    }

    if (action === "add") {
      const level = interaction.options.getInteger("level");
      const role = interaction.options.getRole("role");

      if (role.managed || role.id === interaction.guild.id) {
        return interaction.reply({
          content: "That role cannot be used as a level reward.",
          ephemeral: true
        });
      }

      if (role.position >= interaction.guild.members.me.roles.highest.position) {
        return interaction.reply({
          content: "My highest role must be above the reward role.",
          ephemeral: true
        });
      }

      try {
        db.prepare(`
          INSERT INTO level_rewards (guild_id, level, role_id)
          VALUES (?, ?, ?)
        `).run(guildId, level, role.id);
      } catch {
        return interaction.reply({
          content: "That role is already configured for this level.",
          ephemeral: true
        });
      }

      return interaction.reply({
        content: `Successfully added ${role} as a reward for **Level ${level}**.`
      });
    }

    if (action === "remove") {
      const level = interaction.options.getInteger("level");
      const role = interaction.options.getRole("role");

      const result = db.prepare(`
        DELETE FROM level_rewards
        WHERE guild_id = ? AND level = ? AND role_id = ?
      `).run(guildId, level, role.id);

      return interaction.reply({
        content: result.changes
          ? `Removed ${role} from the Level ${level} rewards.`
          : "That reward wasn't found."
      });
    }

    if (action === "list") {
      const rewards = db.prepare(`
        SELECT level, role_id
        FROM level_rewards
        WHERE guild_id = ?
        ORDER BY level ASC
      `).all(guildId);

      if (!rewards.length) {
        return interaction.reply({
          content: "No level rewards have been configured yet.",
          ephemeral: true
        });
      }

      const description = rewards.map(reward =>
        `**Level ${reward.level}:** <@&${reward.role_id}>`
      ).join("\n");

      const embed = new EmbedBuilder()
        .setColor(0x3498DB)
        .setTitle("Level Rewards")
        .setDescription(description)
        .setFooter({ text: `${rewards.length} configured rewards` });

      return interaction.reply({ embeds: [embed] });
    }

    if (action === "test") {
      const target =
        interaction.options.getMember("user") || interaction.member;

      const user = db.prepare(`
        SELECT level FROM users
        WHERE guild_id = ? AND user_id = ?
      `).get(guildId, target.id);

      if (!user) {
        return interaction.reply({
          content: "That member hasn't earned any XP yet.",
          ephemeral: true
        });
      }

      const rewards = db.prepare(`
        SELECT level, role_id
        FROM level_rewards
        WHERE guild_id = ? AND level <= ?
        ORDER BY level ASC
      `).all(guildId, user.level);

      if (!rewards.length) {
        return interaction.reply({
          content: `${target.user.username} has no configured rewards for their current level.`,
          ephemeral: true
        });
      }

      const description = rewards.map(reward =>
        `**Level ${reward.level}:** <@&${reward.role_id}>`
      ).join("\n");

      const embed = new EmbedBuilder()
        .setColor(0x3498DB)
        .setTitle(`${target.user.username}'s Eligible Rewards`)
        .setDescription(description)
        .setFooter({ text: `Current level: ${user.level}` });

      return interaction.reply({
        embeds: [embed],
        ephemeral: true
      });
    }
  }
};
