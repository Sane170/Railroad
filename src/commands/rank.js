
const {
  SlashCommandBuilder,
  EmbedBuilder
} = require("discord.js");

const { xpForLevel } = require("../leveling");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("rank")
    .setDescription("View your leveling rank or another member's rank.")
    .addUserOption(option =>
      option
        .setName("user")
        .setDescription("The member whose rank you want to view.")
        .setRequired(false)
    ),

  async execute(interaction) {
    const target = interaction.options.getUser("user") || interaction.user;
    const guildId = interaction.guildId;

    const user = interaction.client.db.prepare(`
      SELECT * FROM users
      WHERE guild_id = ? AND user_id = ?
    `).get(guildId, target.id);

    if (!user) {
      return interaction.reply({
        content: `${target.username} hasn't earned any XP yet!`,
        ephemeral: true
      });
    }

    const currentLevelXP = xpForLevel(user.level);
    const nextLevelXP = xpForLevel(user.level + 1);
    const progressXP = user.xp - currentLevelXP;
    const neededXP = nextLevelXP - currentLevelXP;

    const percentage = Math.min(
      100,
      Math.floor((progressXP / neededXP) * 100)
    );

    const progressBar =
      "🟦".repeat(Math.floor(percentage / 10)) +
      "⬜".repeat(10 - Math.floor(percentage / 10));

    const embed = new EmbedBuilder()
      .setColor(0x3498DB)
      .setAuthor({
        name: `${target.username}'s Rank`,
        iconURL: target.displayAvatarURL()
      })
      .setThumbnail(target.displayAvatarURL())
      .addFields(
        { name: "Level", value: `${user.level}`, inline: true },
        { name: "Total XP", value: `${user.total_xp}`, inline: true },
        { name: "Current XP", value: `${user.xp}`, inline: true },
        {
          name: "Progress to Next Level",
          value: `${progressBar}\n${progressXP} / ${neededXP} XP (${percentage}%)`
        }
      )
      .setFooter({ text: "Railroad Leveling System" });

    await interaction.reply({ embeds: [embed] });
  }
};
