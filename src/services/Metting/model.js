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

    pubsub.publish("CHANGE_STATUS", {
      changeStatus: "Meeting Started",
    });
  }

  return "Meeting Started";
};

const createSendTransport = async () => {
  //console.log("here is the transport", router);

  const transport = await router.createWebRtcTransport({
    listenIps: [{ ip: "0.0.0.0", announcedIp: "159.48.55.203" }],
    enableUdp: true,
    enableTcp: true,
    preferUdp: true,
  });

  const transportParams = { id: transport.id, ...transport._data };

  return JSON.stringify(transportParams);
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

  console.log(params)

  transporter
    .produce(params)//.then((prod) => console.log(prod))
    //.catch((err) => console.log(err));

    //console.log(producer)

  return "produce";
};

export {
  worker,
  startSession,
  meetingStatus,
  router,
  createSendTransport,
  connectTransport,
  produce
};
