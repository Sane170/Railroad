
require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  Partials
} = require("discord.js");

const initializeDatabase = require("./database");
const { handleMessage } = require("./leveling");

const db = initializeDatabase();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel]
});

client.once("ready", () => {
  console.log(`Railroad is online as ${client.user.tag}`);
  console.log(`Connected to ${client.guilds.cache.size} servers.`);
});

client.on("messageCreate", async (message) => {
  try {
    await handleMessage(message, db);
  } catch (error) {
    console.error("Leveling system error:", error);
  }
});

client.login(process.env.DISCORD_TOKEN);
