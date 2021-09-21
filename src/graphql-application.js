import { createApplication } from "graphql-modules";
import services from "./service-starter.js";

const application = createApplication({
  modules: services.map((service) => service.graphqlModule),
});

export const ApplicationSchema = application.schema

export default application