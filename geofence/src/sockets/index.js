import { io } from "socket.io-client";
import { WEB_SOCKET_URL } from "../utils/constants";



const socket = io(WEB_SOCKET_URL, {
  transports: ["websocket"], // recommended for React Native
  autoConnect: false, // connect manually when ready
});

export default socket;
