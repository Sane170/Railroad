
const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

const PAGE_SIZE = 10;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("View the top members in your server's leveling leaderboard."),

  async execute(interaction) {
    const guildId = interaction.guildId;
    const db = interaction.client.db;

    const users = db.prepare(`
      SELECT user_id, xp, level, total_xp
      FROM users
      WHERE guild_id = ?
      ORDER BY xp DESC, level DESC
    `).all(guildId);

    if (users.length === 0) {
      return interaction.reply({
        content: "Nobody has earned XP in this server yet!",
        ephemeral: true
      });
    }

    let page = 0;
    const totalPages = Math.ceil(users.length / PAGE_SIZE);

    function createEmbed(currentPage) {
      const start = currentPage * PAGE_SIZE;
      const pageUsers = users.slice(start, start + PAGE_SIZE);

      const description = pageUsers.map((user, index) => {
        const position = start + index + 1;
        return `**${position}.** <@${user.user_id}> — Level **${user.level}** · **${user.xp.toLocaleString()} XP**`;
      }).join("\n");

      return new EmbedBuilder()
        .setColor(0x3498DB)
        .setTitle(`${interaction.guild.name} — Level Leaderboard`)
        .setDescription(description)
        .setFooter({
          text: `Page ${currentPage + 1} of ${totalPages} • ${users.length} members`
        })
        .setTimestamp();
    }

    function createButtons(currentPage) {
      return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("leaderboard_previous")
          .setLabel("Previous")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(currentPage === 0),

        new ButtonBuilder()
          .setCustomId("leaderboard_next")
          .setLabel("Next")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(currentPage >= totalPages - 1)
      );
    }

    await interaction.reply({
      embeds: [createEmbed(page)],
      components: [createButtons(page)]
    });

    const response = await interaction.fetchReply();

    if (totalPages <= 1) return;

    const collector = response.createMessageComponentCollector({
      time: 120000
    });

    collector.on("collect", async buttonInteraction => {
      if (buttonInteraction.user.id !== interaction.user.id) {
        return buttonInteraction.reply({
          content: "Only the person who opened this leaderboard can use these buttons.",
          ephemeral: true
        });
      }

      if (buttonInteraction.customId === "leaderboard_previous") {
        page--;
      } else if (buttonInteraction.customId === "leaderboard_next") {
        page++;
      }

      await buttonInteraction.update({
        embeds: [createEmbed(page)],
        components: [createButtons(page)]
      });
    });

    collector.on("end", async () => {
      await interaction.editReply({
        components: []
      }).catch(() => {});
    });
  }
};
