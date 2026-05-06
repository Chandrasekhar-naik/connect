import { io } from "socket.io-client";
import { api } from "./api";
let socket = null;
let activeToken = null;
export function getSocket(token) {
    if (!socket || activeToken !== token) {
        if (socket) {
            socket.disconnect();
        }
        socket = io(api.baseUrl, {
            transports: ["websocket", "polling"],
            autoConnect: true,
            auth: { token },
        });
        activeToken = token;
    }
    if (!socket.connected) {
        socket.connect();
    }
    return socket;
}
export function disconnectSocket() {
    if (socket) {
        socket.disconnect();
    }
    socket = null;
    activeToken = null;
}
