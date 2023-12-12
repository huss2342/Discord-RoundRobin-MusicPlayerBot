const { Client, GatewayIntentBits, REST, Routes } = require('discord.js');
const { token, clientId, guildId } = require('./config.json');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, StreamType, AudioPlayerStatus } = require('@discordjs/voice');
const ytdl = require('ytdl-core');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates] });

client.once('ready', () => {
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

    // Assuming you have a 'url' option in your slash command for the song URL
    const songUrl = interaction.options.getString('url');
    if (!songUrl || !ytdl.validateURL(songUrl)) {
        await interaction.reply('Please provide a valid YouTube URL.');
        return;
    }

    // Play the song
    try {
        const stream = ytdl(songUrl, { filter: 'audioonly' });
        const resource = createAudioResource(stream, { inputType: StreamType.Arbitrary });

        const player = createAudioPlayer();
        player.play(resource);

        const connection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: interaction.guildId,
            adapterCreator: voiceChannel.guild.voiceAdapterCreator,
        });

        connection.subscribe(player);

        player.on(AudioPlayerStatus.Idle, () => connection.destroy());

        await interaction.reply(`Now playing: ${songUrl}`);
    } catch (error) {
        console.error(error);
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
