class Queue {
  constructor() {
    this.queue = [];
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

  getQueueLength() {
    return this.queue.length;
  }

  getQueueElement(index) {
    if (index < 0 || index >= this.queue.length) {
      console.error("Index out of bounds");
      return;
    }
    return this.queue[index];
  }

  skipMultiple(index) {
    if (index < 0 || index > this.queue.length) {
      console.error("Index out of bounds");
      return;
    }
    this.queue.splice(0, index);
  }

  jumpToIndex(index) {
    if (index < 0 || index >= this.queue.length) {
      console.error("Index out of bounds");
      return;
    }
    let element = this.queue.splice(index, 1)[0];
    this.queue.unshift(element);
  }

  stringifyQueueWithIndex() {
    let queueString = "";
    for (let i = 0; i < this.queue.length; i++) {
      queueString += `${i}: Added by ${this.queue[i].addedBy} - Song: ${
        this.queue[i].song
      } - Date Added: ${this.queue[i].dateAdded.toISOString()}\n`;
    }
    return queueString;
  }

  removeQueueElement(index) {
    if (index < 0 || index >= this.queue.length) {
      console.error("Index out of bounds");
      return;
    }
    this.queue.splice(index, 1);
  }

  swapQueueElements(index1, index2) {
    if (
      index1 < 0 ||
      index1 >= this.queue.length ||
      index2 < 0 ||
      index2 >= this.queue.length
    ) {
      console.error("Index out of bounds");
      return;
    }
    let temp = this.queue[index1];
    this.queue[index1] = this.queue[index2];
    this.queue[index2] = temp;
  }

  moveQueueElement(index, newIndex) {
    if (
      index < 0 ||
      index >= this.queue.length ||
      newIndex < 0 ||
      newIndex >= this.queue.length
    ) {
      console.error("Index out of bounds");
      return;
    }
    let element = this.queue.splice(index, 1)[0];
    this.queue.splice(newIndex, 0, element);
  }
}

module.exports = Queue;
