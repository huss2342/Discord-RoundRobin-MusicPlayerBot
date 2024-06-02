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
        name: "url_or_name",
        type: 3,
        description: "The URL of the song to play",
        required: true,
      },
    ],
  },
  {
    name : "current_song",
    description : "Shows the current song",
  },
  {
    name: "pause",
    description: "Pauses the current song",
  },
  {
    name: "resume",
    description: "Resumes the current song",
  },


  {
    name: "skip",
    description: "Skips the current song",
  },
  {
    name: "queue_show",
    description: "Shows the current queue",
  },
  {
    name: "queue_clear",
    description: "Clears the current queue",
  },
  {
    name: "jump",
    description: "Jumps to a song in the queue",
    options: [
      {
        name: "index",
        type: 4,
        description: "The index of the song to jump to",
        required: true,
      },
    ],
  },
  {
    name: "remove_index",
    description: "Removes a song from the queue",
    options: [
      {
        name: "index",
        type: 4,
        description: "The index of the song to remove",
        required: true,
      },
    ],
  },
  {
    name: "play_next",
    description: "Inserts a song into the queue",
    options: [
      {
        name: "url_or_name",
        type: 3,
        description: "The URL of the song to insert",
        required: true,
      },
    ],
  },
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
