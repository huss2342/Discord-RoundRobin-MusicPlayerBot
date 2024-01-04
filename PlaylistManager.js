const Playlist = require('./Playlist');

class PlaylistManager {
    constructor() {
        this.playlists = {};
    }

    createPlaylist(name, owner) {
        if (this.playlists[name]) {
            console.log('Playlist already exists.');
            return;
        }
        this.playlists[name] = { playlist: new Playlist(name), owner };
    }

    deletePlaylist(name, requester) {
        if (this.playlists[name] && this.playlists[name].owner === requester) {
            delete this.playlists[name];
            console.log(`Playlist ${name} deleted.`);
        } else {
            console.log("Playlist not found or requester is not the owner.");
        }
    }

    viewAllPlaylists() {
        return Object.keys(this.playlists).map(name => `${name} (Owner: ${this.playlists[name].owner})`).join('\n');
    }

    getPlaylist(name) {
        return this.playlists[name] ? this.playlists[name].playlist : null;
    }
}

module.exports = PlaylistManager;
