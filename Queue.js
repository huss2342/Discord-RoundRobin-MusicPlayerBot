class Queue {

    constructor() {
        this.queue = [];
    }


    update() {
        if (this.isEmpty()) {
            return;
        }

        const uniqueUsers = [...new Set(this.queue.map((item) => item.addedBy))];

        if (uniqueUsers.length === 1) {
            // If all songs are added by the same person, no need to reorganize
            return;
        }

        const fairQueue = [];
        let currentIndex = 0;

        while (this.queue.length > 0) {
            const currentUser = uniqueUsers[currentIndex];
            const userSong = this.queue.find((item) => item.addedBy === currentUser);

            if (userSong) {
                fairQueue.push(userSong);
                this.queue = this.queue.filter((item) => item !== userSong);
            }

            currentIndex = (currentIndex + 1) % uniqueUsers.length;
        }

        this.queue = fairQueue;
    }

    shift() {
        if (this.isEmpty()) {
            console.error("Queue is empty");
            return;
        }
        return this.queue.shift();
    }

    push(element, person) {
        if (!element || !person) {
            console.error("Invalid input");
            return;
        }
        const queueElement = {
            addedBy: person,
            song: element,
            dateAdded: new Date(),
        };
        this.queue.push(queueElement);
        this.update();
    }

    // push element to the front of the queue
    unshift(element, person) {
        if (!element || !person) {
            console.error("Invalid input");
            return;
        }
        const queueElement = {
            addedBy: person,
            song: element,
            dateAdded: new Date(),
        };
        this.queue.unshift(queueElement);
        this.update();
    }

    isEmpty() {
        return this.queue.length === 0;
    }

    clear() {
        this.queue = [];
    }

    getQueue() {
        return this.queue;
    }

    jumpToIndex(index) {
        if (index < 0 || index >= this.queue.length) {
            console.error("Index out of bounds");
            return;
        }
        this.queue.splice(0, index);
    }

    removeQueueElement(index) {
        if (index < 0 || index >= this.queue.length) {
            console.error("Index out of bounds");
            return;
        }
        this.queue.splice(index, 1);
        this.update();
    }

}

module.exports = Queue;
