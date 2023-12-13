const { Client, GatewayIntentBits, REST, Routes } = require("discord.js");
const { token, clientId, guildId } = require("./config.json");
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  StreamType,
  AudioPlayerStatus,
} = require("@discordjs/voice");
const ytdl = require("ytdl-core");
const fs = require("fs");
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
});
const { cleanupSongs, createTempFileForGuild } = require("./utils");

client.once("ready", () => {
  console.log("------------------------------");
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
      play(interaction);
      break;
  }
});

// ------------- Global Structures ----------------
// Global player and connection instances
const player = createAudioPlayer();
let connection;
let queue = [];
let isPlaying = false;

// Set up the player's Idle event listener
player.on(AudioPlayerStatus.Idle, async () => {
  console.log("Player is idle.");
  if (queue.length > 0) {
    console.log(`Queue length: ${queue.length}`);
    await playNextSong(); // Play next song if available
  } else {
    isPlaying = false;
  }
});

// --------------- Playing a song ----------------
async function play(interaction) {
  const voiceChannel = interaction.member.voice.channel;
  if (!voiceChannel) {
    await interaction.reply("You need to be in a voice channel!");
    return;
  }

  const songUrl = interaction.options.getString("url");
  if (!songUrl || !ytdl.validateURL(songUrl)) {
    await interaction.reply("Please provide a valid YouTube URL.");
    return;
  }

  // Add to queue
  const songPath = createTempFileForGuild(interaction.guildId);
  queue.push({
    url: songUrl,
    path: songPath,
    textChannel: interaction.channel,
  });

  // Download the song and then play if necessary
  await downloadSong(songUrl, songPath);

  if (!isPlaying) {
    console.log("playing next song");
    await playNextSong(voiceChannel);
    await interaction.reply(`Starting...`);
  } else {
    await interaction.reply(`Song added to the queue.`);
    console.log(`Song added to the queue: ${songUrl}`);
  }
}

async function playNextSong(voiceChannel) {
  if (queue.length === 0) {
    console.log("queue is empty");
    isPlaying = false;
    return;
  }

  isPlaying = true;
  const song = queue.shift();

  const resource = createAudioResource(song.path, {
    inputType: StreamType.Arbitrary,
  });

  player.play(resource);

  // Establish connection if not already connected
  if (!connection) {
    // Assumed that voiceChannel is available globally or passed from play()
    connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: voiceChannel.guild.id,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator,
    });
    connection.subscribe(player);
  }

  // Send a message to the channel about the song being played
  if (song.textChannel && song.textChannel.type === 0) {
    song.textChannel.send(`Now playing: ${song.url}`);
  }

  // When connection state changes
  connection.on("stateChange", (oldState, newState) => {
    if (newState.status === "disconnected") {
      console.log("Bot has been disconnected from the voice channel.");
      console.log("playerStats before stop:", player.state.status);
      player.stop(true); // true forces it to stop
      isPlaying = false;
      queue = [];
      connection = null;
      console.log("playerStats after stop:", player.state.status);
      // Clean up and other necessary actions
      cleanupSongs(voiceChannel.guild.id);
    }
  });
}

async function downloadSong(url, path) {
  const stream = ytdl(url, { filter: "audioonly" });
  const writer = fs.createWriteStream(path);
  stream.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on("finish", resolve);
    writer.on("error", reject);
  });
}

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
