import mediasoup from "mediasoup";
import pubsub from "../pubsub.js";

// Started
var meetingStatus = "offline";

var worker = null;
var router = null;


const startSession = async () => {
  // create worker
  if (!worker || !router) {
    worker = await mediasoup.createWorker();
    // create router
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

    router = await worker.createRouter({
      mediaCodecs,
    });

    meetingStatus = "started";
  }

  return "Meeting Started";
};

startSession().then(() => {
  console.log("session started")
}).catch(err => {
  console.log(err)
})

const getRouter = () => router
const getWorker = () => worker

const createSendTransport = async () => {
  //console.log("here is the transport", router);

  const transport = await router.createWebRtcTransport({
    listenIps: [{ ip: "0.0.0.0", announcedIp: "159.48.55.203" }],
    enableUdp: true,
    enableTcp: true,
    preferUdp: true,
  });

  const transportParams = { id: transport.id, ...transport._data };

  return {transportParams: JSON.stringify(transportParams), transport};
};

const createRecvTransport = async () => {
  //console.log("here is the transport", router);

  const transport = await router.createWebRtcTransport({
    listenIps: [{ ip: "0.0.0.0", announcedIp: "159.48.55.203" }],
    enableUdp: true,
    enableTcp: true,
    preferUdp: true,
  });

  const transportParams = { id: transport.id, ...transport._data };

  return {transportParams: JSON.stringify(transportParams), transport};
};


const connectTransport = async (transportId, connectParams) => {
  const transporter = router._transports.get(transportId);
  transporter
    .connect(JSON.parse(connectParams))
    .then((r) => {
      console.log(r);
    })
    .catch((err) => {
      console.log(err);
    });

  return "connected";
};

const produce = async (transportId, produceParams) => {
  const transporter = router._transports.get(transportId);

  const params = {
    ...JSON.parse(produceParams),
  }


  const producer = await transporter
    .produce(params)

  return producer.id;
};

export {
  worker,
  startSession,
  meetingStatus,
  router,
  createSendTransport,
  createRecvTransport,
  connectTransport,
  produce
};

export default {
  worker,
  startSession,
  meetingStatus,
  router,
  createSendTransport,
  createRecvTransport,
  connectTransport,
  produce,
  getRouter,
  getWorker
};
