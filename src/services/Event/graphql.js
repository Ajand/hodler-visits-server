import { createModule, gql } from "graphql-modules";
import { __dirname } from "../../util.js";
import pubsub from "../pubsub.js";

import methods from "./model.js";

const onlineUsers = new Set();

const EventModule = ({ userService }) =>
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

          createPoll: Poll!
          vote: POAP!

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
            .then(() => {
              pubsub.publish("CHANGE_EVENT_STATUS", {
                eventStatusChanged: `Event with id ${eventId} have changed its status to ${status}`,
              });
              return "Status Chagned";
            });
        },

        connectToEvent: (_, __, { userId }) => {
          onlineUsers.add(userId);

          pubsub.publish("CHANGE_EVENT_STATUS", {
            eventStatusChanged: `user ${userId} has connected`,
          });
          return "connected";
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
