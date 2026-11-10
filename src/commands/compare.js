
const {
  SlashCommandBuilder,
  EmbedBuilder
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("compare")
    .setDescription("Compare leveling progress with another member.")
    .addUserOption(option =>
      option
        .setName("member")
        .setDescription("The member to compare yourself with.")
        .setRequired(true)
    ),

  async execute(interaction) {
    const db = interaction.client.db;
    const guildId = interaction.guildId;
    const otherUser = interaction.options.getUser("member");

    if (otherUser.bot) {
      return interaction.reply({
        content: "You can't compare leveling progress with a bot.",
        ephemeral: true
      });
    }

    if (otherUser.id === interaction.user.id) {
      return interaction.reply({
        content: "You can't compare yourself with yourself!",
        ephemeral: true
      });
    }

    const getUser = db.prepare(`
      SELECT xp, level, total_xp
      FROM users
      WHERE guild_id = ? AND user_id = ?
    `);

    const first = getUser.get(guildId, interaction.user.id);
    const second = getUser.get(guildId, otherUser.id);

    const firstStats = first || { xp: 0, level: 0, total_xp: 0 };
    const secondStats = second || { xp: 0, level: 0, total_xp: 0 };

    let winner;

    if (firstStats.level > secondStats.level) {
      winner = `${interaction.user} is ahead by level!`;
    } else if (secondStats.level > firstStats.level) {
      winner = `${otherUser} is ahead by level!`;
    } else if (firstStats.xp > secondStats.xp) {
      winner = `${interaction.user} is ahead on XP!`;
    } else if (secondStats.xp > firstStats.xp) {
      winner = `${otherUser} is ahead on XP!`;
    } else {
      winner = "It's a tie!";
    }

    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle("🚂 Level Comparison")
      .addFields(
        {
          name: interaction.user.username,
          value:
            `**Level:** ${firstStats.level}\n` +
            `**Current XP:** ${firstStats.xp.toLocaleString()}\n` +
            `**Lifetime XP:** ${firstStats.total_xp.toLocaleString()}`,
          inline: true
        },
        {
          name: otherUser.username,
          value:
            `**Level:** ${secondStats.level}\n` +
            `**Current XP:** ${secondStats.xp.toLocaleString()}\n` +
            `**Lifetime XP:** ${secondStats.total_xp.toLocaleString()}`,
          inline: true
        },
        {
          name: "🏆 Comparison Result",
          value: winner
        }
      )
      .setFooter({
        text: "Railroad • Level Comparison"
      })
      .setTimestamp();

    await interaction.reply({
      embeds: [embed]
    });
  }
};
