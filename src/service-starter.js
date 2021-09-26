import UserService from "./services/User/index.js";
import MeetingService from "./services/Metting/index.js";

const userService = UserService();
const meetingService = MeetingService();

export { userService, meetingService };

export default [userService, meetingService];
