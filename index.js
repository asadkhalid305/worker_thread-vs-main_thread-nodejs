const worker = require("worker_threads");
const os = require("os");
const path = require("path");
const inquirer = require("inquirer");
const ora = require("ora");
const { Worker, isMainThread, workerData } = require("worker_threads");

const NS_PER_SEC = 1e9;

const calFactorialFromWorkerThread = number => {
  if (number === 0) {
    return 1;
  }
  return new Promise(async (parentResolve, parentReject) => {
    const numbers = [];
    for (let index = 1n; index <= number; index++) {
      numbers.push(index);
    }

    const cores = os.cpus().length;
    const segmentSize = Math.ceil(numbers.length / cores);
    const segmentCount = Math.ceil(numbers.length / segmentSize);
    const segments = [];

    // console.log(numbers.length, cores, segmentSize, segmentCount);

    for (let index = 0; index < segmentCount; index++) {
      const start = index * segmentSize;
      const end = start + segmentSize;

      segments.push(numbers.slice(start, end));
    }

    try {
      const results = await Promise.all(
        segments.map(segment => {
          return new Promise((resolve, reject) => {
            const worker = new Worker(path.resolve("factorial-worker.js"), {
              workerData: segment
            });
            worker.on("message", resolve);
            worker.on("error", reject);
            worker.on("exit", code => {
              if (code !== 0)
                reject(new Error(`Worker stopped with exit code ${code}`));
            });
          });
        })
      );
      const finalResult = results.reduce((acc, val) => acc * val, 1n);
      parentResolve(finalResult);
    } catch (e) {
      parentReject(e);
    }
  });
};

const calFactorialFromMainThread = number => {
  if (number === 0) {
    return 1;
  }
  return new Promise((resolve, reject) => {
    const numbers = [];
    for (let index = 1n; index <= number; index++) {
      numbers.push(index);
    }
    resolve(numbers.reduce((acc, val) => acc * val, 1n));
  });
};

const benchMark = async (funcName, time, label) => {
  const startTime = process.hrtime();
  await funcName(time).then();
  const diffTime = process.hrtime(startTime);
  console.log(
    `${label} took ${diffTime[0] + diffTime[1] / NS_PER_SEC} seconds`
  );
};

//cross = 11081
const run = async () => {
  benchMark(calFactorialFromMainThread, 100, "Main thread");
  benchMark(calFactorialFromWorkerThread, 100, "Worker thread");
};

run();
