
require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  Partials
} = require("discord.js");

const initializeDatabase = require("./database");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel]
});

initializeDatabase();

client.once("ready", () => {
  console.log(`Railroad is online as ${client.user.tag}`);
  console.log(`Connected to ${client.guilds.cache.size} servers.`);
});

client.on("messageCreate", async (message) => {
  if (!message.guild || message.author.bot) return;

  // XP earning will be added in the next development steps.
});

client.login(process.env.DISCORD_TOKEN);
