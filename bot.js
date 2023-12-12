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
let queue = [];
let isPlaying = false;
let isDisconnected = false;
let hasHandledDisconnect = false;
// --------------- COMMANDS ----------------

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
  });

  // Download the song and then play if necessary
  await downloadSong(songUrl, songPath);

  if (!isPlaying) {
    console.log("playing next song");
    await playNextSong(voiceChannel, interaction.channel); // Pass only voiceChannel
    await interaction.reply(`Starting...`);
  } else {
    await interaction.reply(`Song added to the queue.`);
  }
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

async function playNextSong(voiceChannel, textChannel) {
  if (queue.length === 0) {
    isPlaying = false;
    return;
  }

  isPlaying = true;
  const song = queue.shift();

  try {
    const resource = createAudioResource(song.path, {
      inputType: StreamType.Arbitrary,
    });

    const player = createAudioPlayer();
    player.play(resource);

    const connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: voiceChannel.guild.id,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator,
    });
    connection.subscribe(player);

    // Send a message to the channel about the song being played
    console.log(`textChannel: ${textChannel}`);
    console.log(`textChannel.type: ${textChannel.type}`);
    if (textChannel && textChannel.type === 0) {
      textChannel.send(`Now playing: ${song.url}`);
    }
    console.log(`Now playing: ${song.url}`);

    // When connection state changes
    connection.on('stateChange', (oldState, newState) => {
        if (newState.status === 'disconnected' && !hasHandledDisconnect) {
            console.log('Bot has been disconnected from the voice channel.');
            hasHandledDisconnect = true;
    
            if (player) {
                player.stop();
                player.removeAllListeners(AudioPlayerStatus.Idle);
            }
    
            cleanupSongs(voiceChannel.guild.id);
            isPlaying = false;
            isDisconnected = true; // Set the disconnection flag
        }
    });

    // When the player becomes idle
    player.on(AudioPlayerStatus.Idle, () => {
      if (isDisconnected) {
        // If disconnected, reset the flag and don't proceed further
        isDisconnected = false;
        return;
      }

      fs.unlink(song.path, (err) => {
        if (err) console.error("Error deleting song file:", err);
      });
      playNextSong(voiceChannel, textChannel);
    });
  } catch (error) {
    console.error("Error playing song:", error);
    if (fs.existsSync(song.path)) {
      fs.unlink(song.path, (err) => {
        if (err) console.error("Error deleting song file:", err);
      });
    }
  }
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
