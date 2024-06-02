# Discord Music Bot

A Discord bot that allows users to play music from YouTube in a voice channel. The bot provides various features for managing the music queue and controlling playback.

## Features

- Play songs from YouTube by providing a URL or searching for a song by name
- Support for playing YouTube playlists
- Display the currently playing song
- Pause and resume playback
- Skip the current song
- Show the current queue
- Clear the queue
- Jump to a specific song in the queue
- Remove a song from the queue
- Insert a song to the top of the queue
- Fair queueing system to ensure equal distribution of songs among users

## Installation

1. Clone the repository:
    ```bash
    git clone https://github.com/your-username/discord-music-bot.git
    ```
2. Install the dependencies:
    ```bash
    cd discord-music-bot
    npm install
    ```
3. Create a `config.json` file in the project root directory with the following structure:
    ```json
    {
      "token": "YOUR_DISCORD_BOT_TOKEN",
      "clientId": "YOUR_DISCORD_BOT_CLIENT_ID",
      "guildId": "YOUR_DISCORD_SERVER_GUILD_ID"
    }
    ```
    Replace `YOUR_DISCORD_BOT_TOKEN`, `YOUR_DISCORD_BOT_CLIENT_ID`, and `YOUR_DISCORD_SERVER_GUILD_ID` with your actual Discord bot token, client ID, and server guild ID, respectively.

4. Deploy the slash commands:
    ```bash
    node deploy-commands.js
    ```
5. Start the bot:
    ```bash
    node bot.js
    ```

## Usage

Invite the bot to your Discord server using the OAuth2 URL generated in the Discord Developer Portal.
Use the following slash commands to interact with the bot:

- `/play [url_or_name]`: Plays a song from YouTube by providing a URL or searching for a song by name.
- `/current_song`: Shows the currently playing song.
- `/pause`: Pauses the current song.
- `/resume`: Resumes the current song.
- `/skip`: Skips the current song.
- `/queue_show`: Shows the current queue.
- `/queue_clear`: Clears the current queue.
- `/jump [index]`: Jumps to a specific song in the queue.
- `/remove_index [index]`: Removes a song from the queue.
- `/play_next [url_or_name]`: Inserts a song to the top of the queue.

## Fair Queueing System

(can be removed by removing the calls to `queue.update()` in `queue.js`)

The bot implements a fair queueing system to ensure equal distribution of songs among users. When songs are added to the queue, the bot reorganizes the queue based on the `addedBy` field, which indicates the user who added each song.

The fair queueing algorithm works as follows:

1. If the queue is empty or all songs are added by the same user, no reorganization is necessary.
2. Otherwise, everytime the queue changes, the bot creates a new queue called `fairQueue`.
3. The bot iterates over the unique users who added songs to the queue in a round-robin fashion.
4. For each user, the bot finds the first song added by that user in the original queue and adds it to the `fairQueue`.
5. The bot removes the added song from the original queue.
6. Steps 3-5 are repeated until the original queue is empty.
7. The `fairQueue` becomes the new queue order.

This ensures that songs from different users are played in a fair and balanced manner, preventing any single user from dominating the queue.

## Dependencies

- `discord.js` - A powerful JavaScript library for interacting with the Discord API.
- `@discordjs/voice` - A library for interacting with the Discord voice API.
- `ytdl-core` - A library for downloading YouTube videos as audio.
- `ytsr` - A library for searching YouTube videos.
- `ytpl` - A library for retrieving YouTube playlist information.

## License

This project is licensed under the MIT License. Feel free to customize and enhance the bot according to your needs. If you have any questions or suggestions, please open an issue or submit a pull request.
