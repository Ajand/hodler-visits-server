import mongoose from "mongoose";

const POAPSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
    },
    eventId: {
      type: mongoose.Types.ObjectId,
      required: true,
    },
    owner: {
      type: mongoose.Types.ObjectId,
    },
  },
  {
    timestamps: true,
  }
);

const EventSchema = new mongoose.Schema(
  {
    topic: {
      type: String,
      required: true,
      max: 200,
    },
    objectives: {
      type: String,
      required: true,
      max: 2500,
      
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    isGated: {
      type: Boolean,
      required: true,
      default: false,
    },
    status: {
      type: String,
      enum: ["WAITING", "STARTED", "FINISHED", "CANCELED", "ARCHIVED"],
      default: "WAITING",
    },
  },
  {
    timestamps: true,
  }
);

const PollSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Types.ObjectId,
      required: true,
      unique: true,
    },
    weights: {
      isWeighted: {
        type: Boolean,
        default: false,
      },
      want1: {
        type: Number,
        default: 1,
      },
      want2: {
        type: Number,
        default: 1,
      },
      want3: {
        type: Number,
        default: 1,
      },
    },
    onlyHodler: {
      type: Boolean,
      required: true,
      default: false,
    },
    body: {
      type: String,
      required: true,
      max: 500,
    },
    options: {
      type: [String],
      max: 300,
    },
    votes: [
      {
        voter: { type: mongoose.Types.ObjectId, required: true },
        weight: { type: Number, default: 1 },
        option: {
          type: Number,
          required: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const MessageSchema = new mongoose.Schema(
  {
    sender: {
      type: String,
      required: true,
    },
    body: {
      type: String,
      required: true,
      max: 500,
    },
    eventId: {
      type: mongoose.Types.ObjectId,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const POAP = mongoose.model("poap", POAPSchema);
const Event = mongoose.model("event", EventSchema);
const Poll = mongoose.model("poll", PollSchema);
const Message = mongoose.model("message", MessageSchema);

const getEvents = () => {
  // Pagination and other things most be added!
  return new Promise((resolve, reject) => {
    Event.find({}, (err, events) => {
      if (err) return reject(err);
      return resolve(events);
    });
  });
};

const getEvent = (_id) => {
  return new Promise((resolve, reject) => {
    Event.findOne({ _id }, (err, event) => {
      if (err) return reject(err);
      return resolve(event);
    });
  });
};

const createEvent = ({ topic, objectives, startDate, endDate, isGated }) => {
  // Only moderator can create Event
  return new Promise((resolve, reject) => {
    const ev = new Event({ topic, objectives, startDate, endDate, isGated });
    return resolve(ev.save());
  });
};

const addPoaps = (eventId, poaps) => {
  // Only moderator can create Event
  return new Promise((resolve, reject) => {
    POAP.insertMany(
      poaps.map((url) => ({ url, eventId })),
      (err, pops) => {
        if (err) return reject(err);
        return resolve(pops);
      }
    );
  });
};

const changeEventStatus = (eventId, status) => {
  // Only moderator can change Event status
  return new Promise((resolve, reject) => {
    Event.updateOne(
      { _id: eventId },
      {
        $set: {
          status,
        },
      },
      (err) => {
        if (err) return reject(err);
        return resolve("Updated!");
      }
    );
  });
};

const takePoap = (eventId, user) => {
  // Only system can take poap
  return new Promise((resolve, reject) => {
    POAP.find({ eventId }, (err, poaps) => {
      if (err) return reject(err);
      if (poaps.find((poap) => String(poap.owner) == String(user)))
        return reject(new Error("User already got a POAP!"));
      const availablePoaps = poaps.filter((poap) => !poap.owner);
      if (!availablePoaps.length)
        return reject(
          new Error("No POAP is available for this event anymore!")
        );
      POAP.updateOne(
        { _id: availablePoaps[0] },
        {
          set: {
            owner: user,
          },
        },
        (err) => {
          if (err) return reject(err);
          return resolve(availablePoaps[0]);
        }
      );
    });
  });
};
const userPoaps = (owner) => {
  // only the user self can see his Poaps
  return new Promise((resolve, reject) => {
    POAP.find({ owner }, (err, poaps) => {
      if (err) return reject(err);
      return resolve(poaps);
    });
  });
};

const getPoll = (eventId) => {
  return new Promise((resolve, reject) => {
    Poll.findOne({ eventId }, (err, poll) => {
      if (err) return reject(err);
      return resolve(poll);
    });
  });
};

const createPoll = ({
  eventId,
  isWeighted,
  want1Weight,
  want2Weight,
  want3Weight,
  onlyHodler,
  body,
  options,
}) => {
  // Only moderator can create a Poll
  return new Promise((resolve, reject) => {
    const poll = new Poll({
      eventId,
      weights: {
        isWeighted,
        want1: want1Weight,
        want2: want2Weight,
        want3: want3Weight,
      },
      onlyHodler,
      body,
      options,
    });

    return resolve(poll);
  });
};

const votePoll = (eventId, option, user) => {
  return new Promise((resolve, reject) => {
    getPoll(eventId)
      .then((poll) => {
        if (!poll) return reject("No poll found!");
        if (poll.votes.find((vote) => String(vote.voter) == String(user._id)))
          return rejcet("Already voted");
        if (poll.onlyHodler && user.role === "LISTENER")
          return reject("Only hodlers can vote.");
        var voteWeight = 1;
        if (poll.weights.isWeighted) {
          const { want1, want2, want3 } = poll.weights;
          voteWeight =
            Number(user.want1Balance) * Number(want1) +
            Number(user.want2Balance) * Number(want2) +
            Number(user.want3Balance) * Number(want3);
        }
        const newVote = {
          voter: user._id,
          weight: voteWeight,
          option,
        };

        Poll.updateOne(
          { eventId },
          {
            $set: {
              votes: [...poll.votes, newVote],
            },
          },
          (err) => {
            if (err) return reject(err);
            return takePoap(eventId, user._id);
          }
        );
      })
      .catch((err) => reject(err));
  });
};

const sendMessage = (eventId, body, sender) => {
  const message = new Message({ eventId, body, sender });
  return message.save();
};

const getMessages = () => {
  return new Promise((resolve, reject) => {
    Message.find({ eventId }, (err, messages) => {
      if (err) return reject(err);
      return resolve(messages);
    });
  });
};

const methods = {
  queries: {
    getEvent,
    getPoll,
    userPoaps,
    getEvents,
    getMessages,
  },
  commands: {
    createEvent,
    addPoaps,
    takePoap,
    createPoll,
    votePoll,
    changeEventStatus,
    sendMessage,
  },
};

export default methods;
