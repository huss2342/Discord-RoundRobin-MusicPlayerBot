const path = require('path');
const fs = require('fs');
const ytdl = require("ytdl-core");


function cleanupSongsUtil(guildId) {
    console.log(`Cleaning up songs for guild ID ${guildId}`);
    const guildDirectory = path.join(__dirname, `temp_${guildId}`);

    if (fs.existsSync(guildDirectory)) {
        fs.readdir(guildDirectory, (err, files) => {
            if (err) {
                console.error(`Error reading directory for cleanup: ${guildDirectory}`, err);
                return;
            }

            files.forEach(file => {
                const filePath = path.join(guildDirectory, file);
                if (fs.existsSync(filePath)) {
                    fs.unlink(filePath, err => {
                        if (err) {
                            console.error(`Error deleting file ${filePath}:`, err);
                        } else {
                            console.log(`Deleted song file: ${filePath}`);
                        }
                    });
                }
            });

            // Remove the directory as well
            fs.rm(guildDirectory, { recursive: true }, err => {
                if (err) {
                    console.error(`Error deleting directory ${guildDirectory}:`, err);
                } else {
                    console.log(`Deleted directory: ${guildDirectory}`);
                }
            });
        });
    } else {
        console.log(`No directory found for guild ID ${guildId}, no cleanup necessary.`);
    }
}

function createTempFileForGuildUtil(guildId) {
    const guildDirectory = path.join(__dirname, `temp_${guildId}`);
    if (!fs.existsSync(guildDirectory)) {
        fs.mkdirSync(guildDirectory, { recursive: true });
    }

    // Create a unique file name
    const fileName = `song_${Date.now()}.mp3`;
    const filePath = path.join(guildDirectory, fileName);

    return filePath;
}

function downloadSongUtil(url, path) {
    console.log("Downloading song:", url, "to path:", path);
    const stream = ytdl(url, { filter: "audioonly" });
    const writer = fs.createWriteStream(path);
    stream.pipe(writer);
    
    return new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
    });
}

function deleteSongFileUtil(filePath) {
    setTimeout(() => {
        fs.unlink(filePath, (err) => {
            if (err) {
                console.error("Error deleting song file:", err);
            } else {
                console.log(`Deleted song file: ${filePath}`);
            }
        });
    }, 10000); // Delay of 10 seconds
}

function invalidSongURL(songUrl){
    return (!songUrl || !ytdl.validateURL(songUrl));
}

module.exports = {
    cleanupSongsUtil,
    createTempFileForGuildUtil,
    downloadSongUtil,
    deleteSongFileUtil,
    invalidSongURL
};