const { Client, GatewayIntentBits, REST, Routes } = require("discord.js");
const { token, clientId, guildId } = require("./config.json");

// -- my imports --
const MusicBot = require("./MusicBot");

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
});

const musicBot = new MusicBot();

const {
  handleMultipleOperations,
  moveOperation,
  swapOperation,
  removeOperation,
  stringifyQueueWithIndex,
} = require("./utilsQueueOperations");
const {cleanupSongsUtil} = require("./utils");

client.once("ready", () => {
  console.log("------------------------------");
  console.log("Ready!");
  cleanupSongsUtil(guildId);
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

    case "current_song":
      const currentSong = await musicBot.getCurrentSong();
      if (currentSong ) {
        await interaction.reply(`Currently playing: ${currentSong.url}`);
      } else {
        await interaction.reply("Nothing is currently playing.");
      }
      break;

    case "pause":
      musicBot.pauseSong();
      await interaction.reply("Paused the current song.");
      break;

    case "resume":
      musicBot.resumeSong();
      await interaction.reply("Resumed the current song.");
      break;

    /* ----------------------- queue managment ----------------------- */
    case "skip":
      musicBot.skipSong(interaction);
      break;

    case "queue_show":
      const queueString = stringifyQueueWithIndex(musicBot.queue);
      await interaction.reply(`Current Queue:\n${queueString}`);
      break;

    case "queue_clear":
      musicBot.queue.clear();
      await interaction.reply("Cleared the queue.");
      break;
      // works till here so far----------------

    case "jump":
      const indexToJump = interaction.options.getInteger("index");
      musicBot.queue.jumpToIndex(indexToJump);
      await interaction.reply(`Jumped to song at index ${indexToJump}.`);
      break;

    case "move":
      const moveInput = interaction.options.getString("positions");
      handleMultipleOperations(musicBot.queue, moveInput, moveOperation, ":");
      await interaction.reply("Moved songs as requested.");
      break;

    case "swap":
      const swapInput = interaction.options.getString("indexes");
      handleMultipleOperations(musicBot.queue, swapInput, swapOperation, ":");
      await interaction.reply("Swapped songs as requested.");
      break;

    case "remove_index":
      const removeInput = interaction.options.getString("index");
      handleMultipleOperations(
        musicBot.queue,
        removeInput,
        removeOperation,
        ","
      );
      await interaction.reply("Removed songs as requested.");
      break;

    case "insert_at_index":
      const insertIndex = interaction.options.getInteger("index");
      const insertSongURL = interaction.options.getString("song");
      musicBot.queue.insertSongAtIndex(insertIndex, insertSongURL);
      await interaction.reply(
        `Inserted ${insertSong} at index ${insertIndex}.`
      );
      break;

    case "insert_next":
      const insertSong = interaction.options.getString("song");
      musicBot.queue.insertSongAtIndex(1, insertSong);
      await interaction.reply(`Inserted ${insertSong} at index 1.`);
      break;

    /* ----------------------- playlist managment -----------------------*/
    case "createplaylist":
      // Add logic to handle playlist creation
      break;

    case "addtoplaylist":
      const playlistName = interaction.options.getString("playlist");
      const songToAdd = interaction.options.getString("song");
      // Add logic to add song to specified playlist
      break;

    case "viewplaylist":
      const playlistToView = interaction.options.getString("name");
      // Add logic to display songs in the specified playlist
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
