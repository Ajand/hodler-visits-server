import graphqlModule from "./graphql.js";
//import model from './model.js'


const EventService = ({userService, meetingService}) => {


  return {
    graphqlModule: graphqlModule({userService, meetingService}),
  };
};

export default EventService;
