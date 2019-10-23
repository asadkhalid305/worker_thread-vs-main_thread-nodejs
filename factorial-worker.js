const { parentPort, workerData } = require("worker_threads");

//get the array numbers
const numbers = workerData;
const calFactorial = data => data.reduce((acc, val) => acc * val, 1n);

const result = calFactorial(numbers);

parentPort.postMessage(result);
