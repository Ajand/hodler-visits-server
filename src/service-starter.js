import UserService from "./services/User/index.js";
import MeetingService from "./services/Metting/index.js";
import EventService from "./services/Event/index.js";

const userService = UserService();
const meetingService = MeetingService();
const eventService = EventService({userService, meetingService});

export { userService, meetingService, eventService };

export default [userService, meetingService, eventService];
