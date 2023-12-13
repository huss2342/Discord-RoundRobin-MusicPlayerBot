const { Client, GatewayIntentBits, REST, Routes } = require("discord.js");
const { token, clientId, guildId } = require("./config.json");


// -- my imports --
const MusicBot = require('./MusicBot'); 

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
});

const musicBot = new MusicBot();

client.once("ready", () => {
  console.log("--------------------------------------------------------");
  console.log("Ready!");
});

// --------------- FSM TO HANDLE COMMANDS ----------------
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;

  switch (commandName) {
    case "ping":
      pong(interaction);
      break;

    case "say":
      say(interaction);
      break;

    case "play":
      musicBot.play(interaction);
      break;
  }
});

// --------------- Pong! ----------------
async function pong(interaction) {
  await interaction.reply("Pong!");
}

// --------------- Say something ----------------
async function say(interaction) {
  const message = interaction.options.getString("message");
  await interaction.reply(message);
}

client.login(token);
