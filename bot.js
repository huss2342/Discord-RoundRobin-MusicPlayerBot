const {Client, GatewayIntentBits, REST, Routes} = require("discord.js");
const {token, clientId, guildId} = require("./config.json");

// -- my imports --
const MusicBot = require("./MusicBot");

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
});

const musicBot = new MusicBot();

const {
    cleanupSongsUtil,
    stringifyQueueWithIndex,
    splitMessage,
} = require("./utils");

client.once("ready", () => {
    console.log("------------------------------");
    console.log("Ready!");
    cleanupSongsUtil(guildId);
});

// --------------- FSM TO HANDLE COMMANDS ----------------
client.on("interactionCreate", async (interaction) => {
    if (!interaction.isCommand()) return;

    const {commandName} = interaction;

    switch (commandName) {
        case "ping":
            await pong(interaction);
            break;

        case "say":
            await say(interaction);
            break;

        case "play":
            await musicBot.play(interaction);
            break;

        case "current_song":
            const currentSong = await musicBot.getCurrentSong();
            if (currentSong) {
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
            await musicBot.skipSong(interaction);
            break;

        case "queue_show":
            await interaction.deferReply();
            const queueString = stringifyQueueWithIndex(musicBot.queue);
            const messageParts = splitMessage(queueString, 1900);
            for (const part of messageParts) {
                await interaction.followUp(`Current Queue (Part ${messageParts.indexOf(part) + 1}):\n${part}`);
            }
            break;

        case "queue_clear":
            musicBot.clearQueue();
            await interaction.reply("Cleared the queue.");
            break;

        case "jump":
            const indexToJump = interaction.options.getInteger("index");
            musicBot.queue.jumpToIndex(indexToJump);
            await interaction.reply(`Attempted to jump to ${indexToJump}.`);
            break;
        // works till here so far---------------

        case "remove_index":
            const removeInput = interaction.options.getInteger("index");
            musicBot.queue.removeQueueElement(removeInput);
            await interaction.reply("Removed songs as requested.");
            break;

        case "play_next":
            const insertSongUrl = interaction.options.getString("url_or_name");
            await musicBot.insertSongAtIndex(insertSongUrl, interaction);
            break;

        case "reset":
            await musicBot.reset();
            await interaction.reply('Bot has been reset!');
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
