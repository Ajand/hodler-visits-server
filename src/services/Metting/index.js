import graphqlModule from "./graphql.js";
import model from './model.js'

import './TransportManager.js'

const MeetingService = () => {
  return {
    model,
    graphqlModule,
  };
};

export default MeetingService;
