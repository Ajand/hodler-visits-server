import mediasoup from "mediasoup";

// We need to keep track of workers
// We need to keep track of routers
// We need to keep track of transports
// We need to keep track of conusmers
// We need to keep track of producers

mediasoup.observer.on("newworker", (worker) => {
  console.log("new worker created [pid:%d]", worker.pid);
});

const manager = {};

const startNewWorker = async () => {
  const currentWorker = await mediasoup.createWorker();

  const workers = manager.workers;

  if (workers) {
    manager.workers.push(currentWorker);
  } else {
    manager.workers = [currentWorker];
  }

  const removeWoker = () => {
    const workerIndex = manager.workers.findIndex(
      (worker) => worker.pid == currentWorker.pid
    );
    manager.workers.splice(workerIndex, 1);
  };

  currentWorker.on("died", (error) => {
    removeWoker()
  });

  currentWorker.observer.on("close", () => {
    console.log(`Worker pid ${currentWorker.pid} closed`);
    removeWoker()
  });
};

startNewWorker();
startNewWorker();

const shutDownWorker = async (index) => {
  if (!manager.workers) return;
  manager.workers[index]?.close();
};

const createRouter = () => {};

const shutDownRouter = () => {};

const createTransport = () => {};

const shutDownTransport = () => {};

const createConsumer = () => {};

const shutDownConsumer = () => {};

const createProducer = () => {};

const shutDownProducer = () => {};

setTimeout(() => {
  shutDownWorker(0);
}, 9000);

setTimeout(() => {
  shutDownWorker(0);
}, 11000);

const runner = () => {
  setInterval(() => {
    console.log(manager);
  }, 4000);
};

runner();
