const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const { clientId, guildId, token } = require("./config.json");

const commands = [
  {
    name: "ping",
    description: "Replies with Pong!",
  },
  {
    name: "say",
    description: "Says something",
    options: [
      {
        name: "message",
        type: 3, 
        description: "The message to say",
        required: true,
      },
    ],
  },
  {
    name: "play",
    description: "Plays a song from YouTube",
    options: [
      {
        name: "url",
        type: 3, 
        description: "The URL of the song to play",
        required: true,
      },
    ],
  }
  
];

const rest = new REST({ version: "9" }).setToken(token);

(async () => {
  try {
    console.log("Started refreshing application (/) commands for guild.");

    await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
      body: commands,
    });

    console.log("Successfully reloaded application (/) commands for guild.");
  } catch (error) {
    console.error(error);
  }
})();
