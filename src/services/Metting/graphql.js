import { createModule, gql } from "graphql-modules";
import { __dirname } from "../../util.js";
import { PubSub } from "graphql-subscriptions";

const pubsub = new PubSub();

setInterval(() => {
  pubsub.publish("SIGNAL", {
    signaling: "Some Random Signal",
  });
}, 1000);

const MeetingModule = createModule({
  id: "meetingModule",
  dirname: __dirname,
  typeDefs: [
    gql`
      type Subscription {
        signaling: String
      }
    `,
  ],
  resolvers: {
    Subscription: {
      signaling: {
        // More on pubsub below
        subscribe: () => pubsub.asyncIterator(["SIGNAL"]),
      },
    },
  },
});

export default MeetingModule;
