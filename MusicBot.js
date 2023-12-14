const {
    joinVoiceChannel,
    createAudioPlayer,
    createAudioResource,
    StreamType,
    AudioPlayerStatus,
} = require("@discordjs/voice");
const ytdl = require("ytdl-core");
const fs = require("fs");

// -- my imports --
const { cleanupSongsUtil, createTempFileForGuildUtil } = require("./utils");

class MusicBot {
    constructor() {
        this.queue = [];
        this.isPlaying = false;
        this.currentSong = null;
        this.voiceChannel = null;
        this.connection = null;
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
        if (!songUrl || !ytdl.validateURL(songUrl)) {
            await interaction.reply("Please provide a valid YouTube URL.");
            return;
        }

        const songPath = this.createTempFileForGuild(interaction.guildId);
        this.queue.push({
            url: songUrl,
            path: songPath,
            textChannel: interaction.channel,
        });
        
        if (!this.isPlaying) {
            await this.downloadSong(songUrl, songPath);
            await this.playNextSong();
        } else {
            await interaction.reply(`Song added to the queue.`);
            await this.downloadSong(songUrl, songPath);
        }
    }

    async playNextSong() {
        if (this.queue.length === 0) {
            console.log("queue is empty");
            this.isPlaying = false;
            return;
        }

        this.isPlaying = true;
        this.currentSong = this.queue.shift();

        const resource = createAudioResource(this.currentSong.path, {
            inputType: StreamType.Arbitrary,
        });

        this.player.play(resource);
        this.ensureConnection();

        if (this.currentSong.textChannel && this.currentSong.textChannel.type === 0) {
            await this.currentSong.textChannel.send(`Now playing: ${this.currentSong.url}`);
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
        console.log("Player is idle. ");
        if (this.connection) {
            console.log("there is connection");
            if (this.currentSong) {
                console.log("deleting current song");
                fs.unlink(this.currentSong.path, (err) => {
                    if (err) console.error("Error deleting song file:", err);
                });
            }
        }
        await this.playNextSong();
    }

    
    async downloadSong(url, path) {
        const stream = ytdl(url, { filter: "audioonly" });
        const writer = fs.createWriteStream(path);
        stream.pipe(writer);
        
        return new Promise((resolve, reject) => {
            writer.on("finish", resolve);
            writer.on("error", reject);
        });
    }
    
    createTempFileForGuild(guildId) {
        return createTempFileForGuildUtil(guildId);
    }

    cleanupSongs(guildId) {
        cleanupSongsUtil(guildId);
    }
}

module.exports = MusicBot;