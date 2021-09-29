import graphqlModule from "./graphql.js";
//import model from './model.js'


const EventService = ({userService}) => {
  return {
   // model,
    graphqlModule: graphqlModule({userService}),
  };
};

export default EventService;
