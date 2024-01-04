const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  StreamType,
  AudioPlayerStatus,
} = require("@discordjs/voice");
const fs = require("fs");

// -- my imports --
const {
  cleanupSongsUtil,
  createTempFileForGuildUtil,
  downloadSongUtil,
  deleteSongFileUtil,
  invalidSongURL,
} = require("./utils");

const Queue = require("./Queue");
const Playlist = require("./Playlist");
const PlaylistManager = require("./PlaylistManager");

class MusicBot {
  constructor() {
    this.queue = new Queue();
    this.playlistManager = new PlaylistManager();
    this.isPlaying = false; // more like 'isQueueNotEmpty'
    this.currentSong = null;
    this.voiceChannel = null;
    this.connection = null;
    this.paused = false;
    this.player = createAudioPlayer();

    this.player.on(AudioPlayerStatus.Idle, async () => this.handleIdle());
  }

  async play(interaction) {
    this.voiceChannel = interaction.member.voice.channel;
    if (!this.voiceChannel) {
      await interaction.reply("You need to be in a voice channel!");
      return;
    }

    const songUrl = interaction.options.getString("url");
    if (this.invalidURL(songUrl)) {
      await interaction.reply("Please provide a valid YouTube URL.");
      return;
    }

    const songPath = this.createTempFileForGuild(interaction.guildId);
    const song = {
      url: songUrl,
      path: songPath,
      textChannel: interaction.channel,
      addedBy: interaction.member.user.username,
    };

    this.queue.push(song, song.addedBy);
    console.log(`${song.addedBy} added ${song.url} to the queue.`);

    if (!this.isPlaying) {
      await this.playNextSong(); // Start playing only if nothing is currently playing
    } else {
      console.log("Queued song.");
      await interaction.reply(`Song added to the queue.`);
      // No need to call playNextSong here as it will be triggered by AudioPlayerStatus.Idle when the current song ends
    }
  }

  async playNextSong() {
    if (this.queue.isEmpty()) {
      console.log("Queue is empty");
      this.isPlaying = false;
      return;
    }

    this.isPlaying = true;
    this.currentSong = this.queue.shift().song;
    console.log("Playing next song:", this.currentSong);

    try {
      const songUrl = this.currentSong.url;
      const songPath = this.currentSong.path;
      await this.downloadSongUtil(songUrl, songPath);
      const resource = createAudioResource(songPath, {
        inputType: StreamType.Arbitrary,
      });

      this.player.play(resource);
      this.ensureConnection();

      if (
        this.currentSong.textChannel &&
        this.currentSong.textChannel.type === 0
      ) {
        await this.currentSong.textChannel.send(`Now playing: ${songUrl}`);
      }
    } catch (error) {
      console.error("Error playing the song:", error);
    }
  }

  createPlaylist(name) {
    this.playlistManager.createPlaylist(name);
  }

  addSongToPlaylist(name, song, addedBy) {
    const playlist = this.playlistManager.getPlaylist(name);
    if (playlist) {
      playlist.addSong(song, addedBy);
    } else {
      console.log("Playlist not found.");
    }
  }

  viewPlaylist(name) {
    const playlist = this.playlistManager.getPlaylist(name);
    return playlist ? playlist.viewAllSongs() : "Playlist not found.";
  }

  playSongFromPlaylist(playlistName, index) {
    const songUrl = this.playlistManager.playSongFromPlaylist(
      playlistName,
      index
    );
    if (songUrl) {
      // Logic to play song from URL
      console.log(`Playing ${songUrl} from playlist ${playlistName}`);
    }
  }

  ensureConnection() {
    if (!this.connection || this.connection.state.status !== "ready") {
      this.connection = joinVoiceChannel({
        channelId: this.voiceChannel.id,
        guildId: this.voiceChannel.guild.id,
        adapterCreator: this.voiceChannel.guild.voiceAdapterCreator,
      });

      this.connection.on("stateChange", (oldState, newState) => {
        if (newState.status === "disconnected") {
          this.handleDisconnection();
        }
      });

      this.connection.subscribe(this.player);
    }
  }

  handleDisconnection() {
    console.log("Bot has been disconnected from the voice channel.");
    this.player.stop();
    this.isPlaying = false;
    this.queue = [];
    if (this.connection) {
      this.connection.destroy();
      this.connection = null;
    }
    this.cleanupSongs(this.voiceChannel.guild.id);
  }

  async handleIdle() {
    console.log("Player is idle.");
    if (this.connection && this.currentSong) {
      console.log("Deleting current song");
      console.log(this.currentSong);
      deleteSongFileUtil(this.currentSong.path);
    }
    await this.playNextSong();
  }

  skipSong() {
    if (!this.queue.isEmpty()) {
      this.playNextSong();
    }
  }

  pauseSong() {
    if (this.player && this.isPlaying && !this.paused) {
      this.player.pause();
      this.paused = true;
      console.log("Paused the current song.");
    } else {
      console.log("No song is currently playing.");
    }
  }

  resumeSong() {
    if (this.player && this.paused) {
      this.player.unpause();
      this.paused = false;
      console.log("Resumed the current song.");
    } else {
      console.log("No song is currently paused.");
    }
  }

  clearQueue() {
    this.queue.clear();
    console.log("Queue cleared");
  }

  createTempFileForGuild(guildId) {
    return createTempFileForGuildUtil(guildId);
  }

  cleanupSongs(guildId) {
    cleanupSongsUtil(guildId);
  }

  downloadSongUtil(url, path) {
    return downloadSongUtil(url, path);
  }

  invalidURL(songUrl) {
    return invalidSongURL(songUrl);
  }
}

module.exports = MusicBot;
