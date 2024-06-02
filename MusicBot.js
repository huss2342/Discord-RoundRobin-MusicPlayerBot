const {
    joinVoiceChannel,
    createAudioPlayer,
    createAudioResource,
    StreamType,
    AudioPlayerStatus,
} = require("@discordjs/voice");
const fs = require("fs");
const ytsr = require("ytsr");
const ytdl = require('ytdl-core');
const ytpl = require('ytpl');
const {
    cleanupSongsUtil,
    createTempFileForGuildUtil,
    downloadSongUtil,
    deleteSongFileUtil,
    invalidSongURL,
} = require("./utils");


const Queue = require("./Queue");
class MusicBot {
    constructor() {
        this.queue = new Queue();
        this.isPlaying = false; // more like 'isQueueNotEmpty'
        this.currentSong = null;
        this.previousSongPath = null;
        this.voiceChannel = null;
        this.connection = null;
        this.paused = false;
        this.player = createAudioPlayer();

        this.player.on(AudioPlayerStatus.Idle, async () => this.handleIdle());
    }

    async getCurrentSong() {
        return this.currentSong;
    }

    async play(interaction) {
        this.voiceChannel = interaction.member.voice.channel;
        if (!this.voiceChannel) {
            await interaction.reply("You need to be in a voice channel!");
            return;
        }

        await interaction.deferReply();

        let songUrl = interaction.options.getString("url_or_name");
        let songName = ""

        if (this.invalidURL(songUrl)) {
            // If the provided input is not a valid URL, perform a search
            const searchResults = await ytsr(songUrl, { limit: 1 });
            if (searchResults.items.length > 0) {
                songUrl = searchResults.items[0].url;
                songName = searchResults.items[0].title;
            } else {
                await interaction.reply("No matching song found.");
                return;
            }
        }

        let replyMessage = "Okay!";
        const isPlaylist = songUrl.includes('list=');
        if (isPlaylist) {
            // Handle playlist
            const playlistId = songUrl.split('list=')[1];
            const playlistInfo = await ytpl(playlistId);

            playlistInfo.items.forEach((item) => {
                const song = {
                    url: item.shortUrl,
                    path: this.createTempFileForGuild(interaction.guildId),
                    name: item.title,
                    textChannel: interaction.channel,
                    addedBy: interaction.member.user.username,
                };
                this.queue.push(song, song.addedBy);
            });

            replyMessage = `Added ${playlistInfo.items.length} songs from the playlist to the queue.`;

        } else {
            // Handle single song
            const videoInfo = await ytdl.getInfo(songUrl);
            songName = videoInfo.videoDetails.title;

            const songPath = this.createTempFileForGuild(interaction.guildId);
            const song = {
                url: songUrl,
                path: songPath,
                name: songName,
                textChannel: interaction.channel,
                addedBy: interaction.member.user.username,
            };

            this.queue.push(song, song.addedBy);
            console.log(`${song.addedBy} added ${song.url} to the queue.`);
            replyMessage = `Song added to the queue.`;
        }

        if (!this.isPlaying) {
            await this.playNextSong(); // Start playing only if nothing is currently playing
            await interaction.followUp("got it");
        } else {
            console.log("Queued song.");
            await interaction.followUp(replyMessage);
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
        // console.log("Playing next song:", this.currentSong);

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

    async insertSongAtIndex(songUrl, interaction) {
        if (!songUrl) {
            console.error("Invalid input");
            return;
        }
        // check if the queue is empty
        if (this.queue.isEmpty()) {
            console.error("Queue is empty, use play");
            return;
        }

        console.log("songURL: ", songUrl);

        let replyMessage = "Okay!";

        // Defer the reply to acknowledge the interaction
        await interaction.deferReply();

        if (this.invalidURL(songUrl)) {
            // If the provided input is not a valid URL, perform a search
            const searchResults = await ytsr(songUrl, { limit: 1 });
            if (searchResults.items.length > 0) {
                songUrl = searchResults.items[0].url;
            } else {
                await interaction.followUp("No matching song found.");
                return;
            }
        }

        const isPlaylist = songUrl.includes('list=');

        if (isPlaylist) {
            // Handle playlist
            const playlistId = songUrl.split('list=')[1];
            const playlistInfo = await ytpl(playlistId);

            const playlistSongs = playlistInfo.items.map((item) => ({
                url: item.shortUrl,
                path: this.createTempFileForGuild(interaction.guildId),
                name: item.title,
                textChannel: interaction.channel,
                addedBy: interaction.member.user.username,
            }));

            playlistSongs.forEach((song) => {
                this.queue.unshift(song, interaction.member.user.username);
            });

            replyMessage = `Added ${playlistSongs.length} songs from the playlist to the top of the queue.`;
        } else {
            // Handle single song
            const videoInfo = await ytdl.getInfo(songUrl);
            const songName = videoInfo.videoDetails.title;
            const songPath = this.createTempFileForGuild(interaction.guildId);

            const song = {
                url: songUrl,
                path: songPath,
                name: songName,
                textChannel: interaction.channel,
                addedBy: interaction.member.user.username,
            };

            this.queue.unshift(song, interaction.member.user.username);
            console.log(`${song.addedBy} added ${song.url} to the top of the queue.`);
            replyMessage = `Queued ${songName} to the top of the queue.`;
        }

        await interaction.followUp(replyMessage);
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
            // console.log("Deleting current song");
            // console.log(this.currentSong);
            deleteSongFileUtil(this.currentSong.path);
        }
        await this.playNextSong();
    }

    async skipSong(interaction) {
        if (!this.queue.isEmpty()) {
            this.previousSongPath = this.currentSong.path;
            this.playNextSong();
            await interaction.reply("Skipped the current song.");

            deleteSongFileUtil(this.previousSongPath);
        } else {
            await interaction.reply("No next songs in the queue.");
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
