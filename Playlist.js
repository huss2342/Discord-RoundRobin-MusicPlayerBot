class Playlist {
    constructor(name) {
        this.name = name;
        this.songs = [];
        this.dateCreated = new Date();
    }

    addSong(song, addedBy) {
        this.songs.push({ song, addedBy, dateAdded: new Date() });
    }

    deleteSong(songTitle) {
        this.songs = this.songs.filter(song => song.song !== songTitle);
    }

    viewAllSongs() {
        return this.songs.map((song, index) => `${index + 1}: ${song.song} (Added by ${song.addedBy})`).join('\n');
    }

    sortPlaylist(parameter, order = 'ascending') {
        this.songs.sort((a, b) => {
            let comparison = 0;

            if (a[parameter] < b[parameter]) {
                comparison = -1;
            } else if (a[parameter] > b[parameter]) {
                comparison = 1;
            }

            return (order === 'ascending' ? comparison : comparison * -1);
        });
    }

    insertSongAtIndex(song, addedBy, index) {
        this.songs.splice(index, 0, { song, addedBy, dateAdded: new Date() });
    }

    swapSongs(index1, index2) {
        [this.songs[index1], this.songs[index2]] = [this.songs[index2], this.songs[index1]];
    }

    savePlaylist() {
        console.log('Playlist saved:', this.name);
        // Implement saving mechanism here
    }
}

module.exports = Playlist;
