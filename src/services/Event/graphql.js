import { createModule, gql } from "graphql-modules";
import { __dirname } from "../../util.js";
import pubsub from "../pubsub.js";

import methods from "./model.js";

const onlineUsers = new Set();

const stagers = new Map();
const stagerProducers = new Map();

const usersConsumeTransport = new Map();
const usersRtpCaps = new Map();

const EventModule = ({ userService, meetingService }) =>
  createModule({
    id: "eventModule",
    dirname: __dirname,
    typeDefs: [
      gql`
        type POAP {
          url: String!
          eventId: String!
          owner: ID!
        }

        type Event {
          topic: String!
          objectives: String!
          startDate: String!
          endDate: String!
          isGated: Boolean!
          status: String!
          poll: Poll
          onlineUsers: [User]
          _id: ID!
          stagers: [String]
        }

        type PollWeight {
          isWeighted: Boolean!
          want1: Int!
          want2: Int!
          want3: Int!
        }

        type Vote {
          voter: String!
          weight: Int!
          option: Int!
        }

        type Poll {
          eventId: String!
          weights: PollWeight
          onlyHodler: Boolean!
          body: String!
          options: [String!]!
          votes: [Vote!]!
        }

        type Message {
          sender: User!
          eventId: String!
          body: String!
          _id: ID!
          createdAt: String!
        }

        extend type Query {
          events: [Event!]!
          event(id: ID!): Event

          myPoaps: [POAP!]!

          messages(eventId: ID!): [Message!]!
        }

        extend type Mutation {
          createEvent(
            topic: String!
            objectives: String!
            startDate: String!
            endDate: String!
            isGated: Boolean
            poaps: [String]
          ): Event!
          changeEventStatus(eventId: ID!, status: String!): String!
          connectToEvent: String!
          disconnectFromEvent: String!

          sendRTPCap(rtpCap: String!): String
          wannaConsume(stager: ID!): String

          joinStage: String
          connectSendTransport(transportId: String!, params: String!): String
          produce(transportId: String!, params: String!): String

          createPoll(
            eventId: ID!
            isWeighted: Boolean
            want1Weight: Int
            want2Weight: Int
            want3Weight: Int
            onlyHodler: Boolean
            options: [String]
            body: String!
          ): Poll!
          vote(eventId: ID!, option: Int!): POAP!

          sendMessage(body: String, eventId: ID!): Message!
        }

        type Subscription {
          userConnection: String!
          pollCreated: String!
          eventStatusChanged: String!
          messageSented: String!
        }
      `,
    ],
    resolvers: {
      Query: {
        events: () => {
          return methods.queries.getEvents();
        },

        event: (_, { id }) => {
          const eventMapper = (ev) => {
            return {
              ...ev._doc,
              onlineUsers: Promise.all(
                [...onlineUsers].map((userId) =>
                  userService.model.methods.queries.get(userId)
                )
              ),
              poll: methods.queries.getPoll(ev._id),
              stagers: [...stagers.keys()],
            };
          };

          return methods.queries
            .getEvent(id)
            .then((event) => eventMapper(event));
        },

        messages: (_, { eventId }) => {
          const messageMapper = (message) => ({
            ...message._doc,
            sender: userService.model.methods.queries.get(message.sender),
          });

          return methods.queries
            .getMessages(eventId)
            .then((messages) => messages.map(messageMapper));
        },
      },

      Mutation: {
        createEvent: (
          _,
          { topic, objectives, startDate, endDate, isGated, poaps }
        ) => {
          return methods.commands
            .createEvent({ topic, objectives, startDate, endDate, isGated })
            .then((ev) => {
              methods.commands
                .addPoaps(ev._id, poaps)
                .then(() => "poaps added")
                .catch((err) => console.log(err));
              return ev;
            });
        },

        changeEventStatus: (_, { eventId, status }) => {
          return methods.commands
            .changeEventStatus(eventId, status)
            .then(async () => {
              if (status === "STARTED") {
                await meetingService.model.startSession();
              }
              pubsub.publish("CHANGE_EVENT_STATUS", {
                eventStatusChanged: `Event with id ${eventId} have changed its status to ${status}`,
              });
              return "Status Chagned";
            });
        },

        joinStage: async (_, __, { userId }) => {
          pubsub.publish("CHANGE_EVENT_STATUS", {
            eventStatusChanged: `user ${userId} has joined stage`,
          });

          const { transportParams, transport } =
            await meetingService.model.createSendTransport();

          stagers.set(userId, transport);

          return transportParams;
        },

        connectSendTransport: (_, { transportId, params }) => {
          if (!meetingService.model.getRouter()) return "";
          return meetingService.model.connectTransport(transportId, params);
        },

        produce: async (_, { transportId, params }, { userId }) => {
          if (!meetingService.model.getRouter()) return "";
          const oldStager = stagerProducers.get(userId)
            ? stagerProducers.get(userId)
            : [];
          const producerId = await meetingService.model.produce(
            transportId,
            params
          );

          console.log("producers adding", userId);

          stagerProducers.set(userId, [...oldStager, producerId]);

          return "Producer Added";
        },

        connectToEvent: async (_, __, { userId }) => {
          onlineUsers.add(userId);

          pubsub.publish("CHANGE_EVENT_STATUS", {
            eventStatusChanged: `user ${userId} has connected`,
          });

          const { transportParams, transport } =
            await meetingService.model.createRecvTransport();

          usersConsumeTransport.set(userId, transport);

          return transportParams;
        },

        sendRTPCap: (_, { rtpCap }, { userId }) => {
          // TODO WE SHOULD CHECK WETHER IT CAN CONSUME SPECIFIC PRODUCER OR NOT
          // FOR NOW WE NEED A PRODUCER
          usersRtpCaps.set(userId, JSON.parse(rtpCap));
          return "hi";
        },

        wannaConsume: async (_, { stager }, { userId }) => {
          const router = meetingService.model.getRouter();
          const stag = stagers.get(stager);
          const producers = stagerProducers.get(stager);
          const consumerRtpCaps = usersRtpCaps.get(userId);
          const consumerTransport = usersConsumeTransport.get(userId);


          if (
            producers &&
            producers.length &&
            router.canConsume({
              producerId: producers[0],
              rtpCapabilities: consumerRtpCaps,
            })
          ) {
           const consumer = await consumerTransport.consume({
              producerId: producers[0],
              rtpCapabilities: consumerRtpCaps,
            });

            console.log(consumer.params)

            return "hi"
          } else {
            return "";
          }
        },

        disconnectFromEvent: (_, __, { userId }) => {
          onlineUsers.delete(userId);
          pubsub.publish("CHANGE_EVENT_STATUS", {
            eventStatusChanged: `user ${userId} has disconnected`,
          });
          return "disconnected";
        },

        sendMessage: (_, { eventId, body }, { userId }) => {
          const messageMapper = (message) => ({
            ...message._doc,
            sender: userService.model.methods.queries.get(message.sender),
          });

          return methods.commands
            .sendMessage(eventId, body, userId)
            .then((msg) => {
              pubsub.publish("MESSAGE_SENTED", {
                messageSented: `message sented`,
              });
              return messageMapper(msg);
            });
        },

        createPoll: (
          _,
          {
            eventId,
            isWeighted,
            want1Weight,
            want2Weight,
            want3Weight,
            onlyHodler,
            body,
            options,
          },
          { userId }
        ) => {
          return methods.commands
            .createPoll({
              eventId,
              isWeighted,
              want1Weight,
              want2Weight,
              want3Weight,
              onlyHodler,
              body,
              options,
            })
            .then((poll) => {
              pubsub.publish("CHANGE_EVENT_STATUS", {
                eventStatusChanged: `Poll Added`,
              });
              return poll;
            });
        },

        vote: (_, { eventId, option }, { userId }) => {
          return userService.model.methods.queries
            .get(userId)
            .then((user) => methods.commands.votePoll(eventId, option, user))
            .then((poap) => {
              pubsub.publish("CHANGE_EVENT_STATUS", {
                eventStatusChanged: `VOTED`,
              });
              return poap;
            });
        },
      },

      Subscription: {
        eventStatusChanged: {
          subscribe: () => pubsub.asyncIterator(["CHANGE_EVENT_STATUS"]),
        },
        messageSented: {
          subscribe: () => pubsub.asyncIterator(["MESSAGE_SENTED"]),
        },
      },
    },
  });

export default EventModule;
