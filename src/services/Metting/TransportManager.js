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
    removeWoker();
  });

  currentWorker.observer.on("close", () => {
    console.log(`Worker pid ${currentWorker.pid} closed`);
    removeWoker();
  });
};



const shutDownWorker = async (index) => {
  if (!manager.workers) return;
  manager.workers[index]?.close();
};

const createRouter = async (workerIndex) => {
  if (!manager.workers || !manager.workers[workerIndex]) return;
  const mediaCodecs = [
    {
      kind: "audio",
      mimeType: "audio/opus",
      clockRate: 48000,
      channels: 2,
    },
    {
      kind: "video",
      mimeType: "video/H264",
      clockRate: 90000,
      parameters: {
        "packetization-mode": 1,
        "profile-level-id": "42e01f",
        "level-asymmetry-allowed": 1,
      },
    },
  ];

  const currentRouter = await manager.workers[workerIndex].createRouter({
    mediaCodecs,
  });
};

const shutDownRouter = () => {};

const createTransport = () => {};

const shutDownTransport = () => {};

const createConsumer = () => {};

const shutDownConsumer = () => {};

const createProducer = () => {};

const shutDownProducer = () => {};

//startNewWorker();
//
//setTimeout(() => {
//    createRouter(0);
//
//}, 1000)

const runner = () => {
  setInterval(() => {
    console.log(manager, manager.workers[0]._routers);
  }, 4000);
};

//runner();
