import { createModule, gql } from "graphql-modules";
import { __dirname } from "../../util.js";
import pubsub from "../pubsub.js";

import {
  startSession,
  meetingStatus,
  router,
  createSendTransport,
  connectTransport,
  produce,
} from "./model.js";


const MeetingModule = createModule({
  id: "meetingModule",
  dirname: __dirname,
  typeDefs: [
    gql`
      extend type Query {
        meetingStatus: String
      }

      extend type Mutation {
        startSession: String
        endSession: String
        getRTPCap: String!
        createSendTransport: String!
      }

      extend type Subscription {
        changeStatus: String
        signaling: String
      }
    `,
  ],
  resolvers: {
    Query: {
      meetingStatus: () => meetingStatus,
    },

    Mutation: {
      startSession: () => {
        // Only Moderator should be able to do it
        return startSession();
      },

      getRTPCap: () => {
        if (!router) return "";
        return JSON.stringify(router.rtpCapabilities);
      },

      createSendTransport: () => {
        if (!router) return "";
        return createSendTransport();
      },

     
    },

    Subscription: {
      changeStatus: {
        subscribe: () => pubsub.asyncIterator(["CHANGE_STATUS"]),
      },

      signaling: {
        // More on pubsub below
        subscribe: () => pubsub.asyncIterator(["SIGNAL"]),
      },
    },
  },
});

export default MeetingModule;
