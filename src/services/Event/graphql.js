import { createModule, gql } from "graphql-modules";
import { __dirname } from "../../util.js";
import pubsub from "../pubsub.js";


const EventModule = createModule({
  id: "eventModule",
  dirname: __dirname,
  typeDefs: [
    gql`
      extend type Query {
        event: String
      }

     
    `,
  ],
  resolvers: {
    Query: {
    },

    Mutation: {
     
    },

    Subscription: {
      
    },
  },
});

export default EventModule;
