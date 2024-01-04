function parseIndexes(inputString, separator) {
  return inputString.split(separator).map((index) => parseInt(index.trim()));
}

function handleMultipleOperations(queue, inputString, operation, separator) {
  const operations = inputString.split(",");
  operations.forEach((operationString) => {
    const [index1, index2] = parseIndexes(operationString, separator);
    operation(queue, index1, index2);
  });
}

function moveOperation(queue, index, newIndex) {
  queue.moveQueueElement(index, newIndex);
}

function swapOperation(queue, index1, index2) {
  queue.swapQueueElements(index1, index2);
}

function removeOperation(queue, index) {
  queue.removeQueueElement(index);
}
function stringifyQueueWithIndex(queue) {
  let queueString = "";
  queue.getQueue().forEach((item, index) => {
    queueString += `${index + 1}: ${item.song.url} (Added by ${
      item.addedBy
    })\n`;
  });
  return queueString;
}

module.exports = {
  handleMultipleOperations,
  moveOperation,
  swapOperation,
  removeOperation,
  stringifyQueueWithIndex,
};
