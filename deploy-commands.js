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
    name: "move",
    description: "Moves a song to a different position in the queue",
    options: [
      {
        name: "positions",
        type: 3,
        description: "Enter the current and new positions separated by a colon (e.g., '2:5')",
        required: true,
      },
    ],
  },
  {
    name: "swap",
    description: "Swaps two songs in the queue",
    options: [
      {
        name: "indexes",
        type: 3,
        description: "Enter the two indexes to swap separated by a colon (e.g., '3:5')",
        required: true,
      },
    ],
  },
  {
    name: "remove_index",
    description: "Removes a song from the queue",
    options: [
      {
        name: "name",
        type: 3,
        description: "Name of the song to remove \n seperated by a comma, use a '-' to remove a range of songs",
        required: true,
      },
    ],
  },


  {
    name: "createplaylist",
    description: "Creates a new playlist",
    options: [
      {
        name: "name",
        type: 3,
        description: "Name of the playlist",
        required: true,
      },
    ],
  },
  {
    name: "addtoplaylist",
    description: "Adds a song to a playlist",
    options: [
      {
        name: "playlist",
        type: 3,
        description: "Name of the playlist",
        required: true,
      },
      {
        name: "song",
        type: 3,
        description: "Song to add",
        required: true,
      },
    ],
  },
  {
    name: "viewplaylist",
    description: "Views the songs in a playlist",
    options: [
      {
        name: "name",
        type: 3,
        description: "Name of the playlist",
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
