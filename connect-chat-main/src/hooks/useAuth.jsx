import { createContext, useContext, useEffect, useState } from "react";
import { api, getStoredToken, setStoredToken } from "@/lib/api";
import { disconnectSocket } from "@/lib/socket";
const AuthCtx = createContext({
    user: null,
    token: null,
    loading: true,
    signIn: async () => { },
    signUp: async () => { },
    signOut: async () => { },
    refreshUser: async () => { },
    setUser: () => { },
});
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const storedToken = getStoredToken();
        if (!storedToken) {
            setLoading(false);
            return;
        }
        setToken(storedToken);
        api
            .me(storedToken)
            .then(({ user }) => {
            setUser(user);
        })
            .catch(() => {
            setStoredToken(null);
            setToken(null);
            setUser(null);
        })
            .finally(() => {
            setLoading(false);
        });
    }, []);
    const refreshUser = async () => {
        const authToken = token ?? getStoredToken();
        if (!authToken)
            return;
        const response = await api.me(authToken);
        setUser(response.user);
    };
    return (<AuthCtx.Provider value={{
            user,
            token,
            loading,
            signIn: async (email, password) => {
                const response = await api.login(email, password);
                setStoredToken(response.token);
                setToken(response.token);
                setUser(response.user);
            },
            signUp: async (payload) => {
                const response = await api.signup(payload);
                setStoredToken(response.token);
                setToken(response.token);
                setUser(response.user);
            },
            signOut: async () => {
                const authToken = token ?? getStoredToken();
                if (authToken) {
                    await api.logout(authToken).catch(() => { });
                }
                disconnectSocket();
                setStoredToken(null);
                setToken(null);
                setUser(null);
            },
            refreshUser,
            setUser,
        }}>
      {children}
    </AuthCtx.Provider>);
}
export const useAuth = () => useContext(AuthCtx);
