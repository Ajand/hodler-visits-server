import graphqlModule from "./graphql.js";
import model from './model.js'

const UserService = () => {
  return {
    model,
    graphqlModule,
  };
};

export default UserService;
