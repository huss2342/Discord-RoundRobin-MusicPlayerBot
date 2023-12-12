const { Client, GatewayIntentBits, REST, Routes } = require('discord.js');
const { token, clientId, guildId } = require('./config.json');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, StreamType, AudioPlayerStatus } = require('@discordjs/voice');
const ytdl = require('ytdl-core');
const fs = require('fs');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates] });

client.once('ready', () => {
  console.log('------------------------------');
  console.log('Ready!');
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;
  
    const { commandName } = interaction;
  
    switch (commandName) {
        case 'ping':
            pong(interaction);
            break;

        case 'say':
            say(interaction);
            break;
        
        case 'play':
            play(interaction);
            break;
    }
  });
  


  async function play(interaction) {
    // Check if the user is in a voice channel
    const voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel) {
        await interaction.reply('You need to be in a voice channel!');
        return;
    }

    // Get the song URL from the interaction
    const songUrl = interaction.options.getString('url');
    if (!songUrl || !ytdl.validateURL(songUrl)) {
        await interaction.reply('Please provide a valid YouTube URL.');
        return;
    }

    // Define a temporary file path for the song
    const songPath = `./temp_song_${Date.now()}.mp3`;

    try {
        // Download the song from YouTube
        const stream = ytdl(songUrl, { filter: 'audioonly' });
        const writer = fs.createWriteStream(songPath);
        stream.pipe(writer);

        await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });

        // Create an audio resource from the downloaded file
        const resource = createAudioResource(songPath, { inputType: StreamType.Arbitrary });

        // Create an audio player and play the resource
        const player = createAudioPlayer();
        player.play(resource);

        // Join the voice channel and subscribe the player to the connection
        const connection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: interaction.guildId,
            adapterCreator: voiceChannel.guild.voiceAdapterCreator,
        });
        connection.subscribe(player);

        // Reply to the user
        await interaction.reply(`Now playing: ${songUrl}`);

        // Listen for the audio player to become idle and then clean up
        player.on(AudioPlayerStatus.Idle, () => {
            connection.destroy();
            fs.unlink(songPath, (err) => {
                if (err) console.error('Error deleting song file:', err);
            });
        });
    } catch (error) {
        console.error('Error playing song:', error);
        if (fs.existsSync(songPath)) {
            fs.unlink(songPath, (err) => {
                if (err) console.error('Error deleting song file:', err);
            });
        }
        await interaction.reply('There was an error trying to play that song!');
    }
}


async function pong(interaction) {
    await interaction.reply('Pong!');
}

async function say(interaction) {
    const message = interaction.options.getString('message');
    await interaction.reply(message);
}

client.login(token);
