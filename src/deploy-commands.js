
require("dotenv").config();

const {
  REST,
  Routes
} = require("discord.js");

const fs = require("node:fs");
const path = require("node:path");

const commands = [];
const commandsPath = path.join(__dirname, "commands");

const commandFiles = fs
  .readdirSync(commandsPath)
  .filter(file => file.endsWith(".js"));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);

  if (command.data) {
    commands.push(command.data.toJSON());
    console.log(`Prepared: ${command.data.name}`);
  }
}

const rest = new REST({ version: "10" })
  .setToken(process.env.DISCORD_TOKEN);

async function deployCommands() {
  try {
    console.log("Registering Railroad slash commands...");

    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );

    console.log(`Successfully registered ${commands.length} commands!`);
  } catch (error) {
    console.error("Command deployment failed:", error);
  }
}

if (!process.env.DISCORD_TOKEN || !process.env.CLIENT_ID) {
  console.error("Missing DISCORD_TOKEN or CLIENT_ID environment variable.");
  process.exit(1);
}

deployCommands();
