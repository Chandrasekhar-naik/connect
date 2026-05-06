import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { useAuth } from "./useAuth";
export function usePresence() {
    const { user, token } = useAuth();
    const [online, setOnline] = useState(new Set());
    useEffect(() => {
        if (!user || !token)
            return;
        let cancelled = false;
        const socket = getSocket(token);
        const loadUsers = async () => {
            try {
                const response = await api.listUsers(token, "", 200);
                if (cancelled)
                    return;
                setOnline(new Set(response.users.filter((item) => item.status === "online").map((item) => item.id)));
            }
            catch {
                if (!cancelled) {
                    setOnline(new Set());
                }
            }
        };
        loadUsers();
        const onPresence = (payload) => {
            if (cancelled)
                return;
            setOnline((prev) => {
                const next = new Set(prev);
                if (payload.status === "online" || payload.status === "away") {
                    next.add(payload.userId);
                }
                else {
                    next.delete(payload.userId);
                }
                return next;
            });
        };
        const onOffline = (payload) => {
            if (cancelled)
                return;
            setOnline((prev) => {
                const next = new Set(prev);
                next.delete(payload.userId);
                return next;
            });
        };
        socket.emit("user-presence", "online");
        socket.on("user-presence-update", onPresence);
        socket.on("user-offline", onOffline);
        return () => {
            cancelled = true;
            socket.off("user-presence-update", onPresence);
            socket.off("user-offline", onOffline);
        };
    }, [user, token]);
    return online;
}
