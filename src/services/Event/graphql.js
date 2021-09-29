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

          sendMessage: Message!
        }

        type Subscription {
          userConnection: String!
          pollCreated: String!
          eventStatusChanged: String!
        }
      `,
    ],
    resolvers: {
      Query: {
        events: () => {
          return methods.queries.getEvents();
        },

        event: (_, { id }) => {
          const eventMapper = (userSerive) => (ev) => {
            return {
              ...ev._doc,
              users: [...onlineUsers].map((userId) =>
                userSerive.model.methods.queries.get(userId)
              ),
              poll: methods.queries.getPoll(ev._id),
            };
          };

          return methods.queries.getEvent(id);
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
      },

      Subscription: {
        eventStatusChanged: {
          subscribe: () => pubsub.asyncIterator(["CHANGE_EVENT_STATUS"]),
        },
      },
    },
  });

export default EventModule;
