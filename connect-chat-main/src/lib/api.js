const API_BASE_URL = (import.meta.env.VITE_API_URL || "https://connect-35ho.onrender.com").replace(/\/$/, "");
const TOKEN_KEY = "pulse.token";
async function request(path, options = {}) {
    const headers = new Headers(options.headers);
    const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
    if (!isFormData && options.body && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
    }
    if (options.token) {
        headers.set("Authorization", `Bearer ${options.token}`);
    }
    const response = await fetch(`${API_BASE_URL}${path}`, {
        method: options.method || "GET",
        headers,
        body: options.body && !isFormData && typeof options.body !== "string"
            ? JSON.stringify(options.body)
            : options.body,
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload?.success === false) {
        const details = Array.isArray(payload?.errors)
            ? payload.errors.map((error) => error.message).join(", ")
            : null;
        throw new Error(details || payload?.message || "Request failed");
    }
    return payload;
}
export function getStoredToken() {
    if (typeof window === "undefined")
        return null;
    return localStorage.getItem(TOKEN_KEY);
}
export function setStoredToken(token) {
    if (typeof window === "undefined")
        return;
    if (token) {
        localStorage.setItem(TOKEN_KEY, token);
    }
    else {
        localStorage.removeItem(TOKEN_KEY);
    }
}
export function resolveAssetUrl(url) {
    if (!url)
        return null;
    if (/^https?:\/\//i.test(url)) {
        return url;
    }
    if (url.startsWith("/")) {
        return `${API_BASE_URL}${url}`;
    }
    return `${API_BASE_URL}/${url}`;
}
export const api = {
    baseUrl: API_BASE_URL,
    health: () => request("/health"),
    login: (email, password) => request("/api/auth/login", {
        method: "POST",
        body: { email, password },
    }),
    signup: (payload) => request("/api/auth/signup", {
        method: "POST",
        body: payload,
    }),
    me: (token) => request("/api/auth/me", { token }),
    logout: (token) => request("/api/auth/logout", { method: "POST", token }),
    updateProfile: (token, payload) => request("/api/auth/profile", {
        method: "PUT",
        token,
        body: payload,
    }),
    uploadAvatar: (token, file) => {
        const formData = new FormData();
        formData.append("file", file);
        return request("/api/auth/avatar", {
            method: "POST",
            token,
            body: formData,
        });
    },
    listUsers: (token, query = "", limit = 100) => request(`/api/auth/search?query=${encodeURIComponent(query)}&limit=${limit}`, { token }),
    getUserById: (token, id) => request(`/api/auth/users/${id}`, { token }),
    listChats: (token) => request("/api/chats", { token }),
    getChatMembers: (token, chatId) => request(`/api/chats/${chatId}/members`, { token }),
    getOrCreateDirectChat: (token, otherUserId) => request("/api/chats/direct", {
        method: "POST",
        token,
        body: { other_user_id: otherUserId },
    }),
    createGroupChat: (token, payload) => request("/api/chats/group", {
        method: "POST",
        token,
        body: payload,
    }),
    getMessages: (token, chatId, limit = 100) => request(`/api/messages/${chatId}?limit=${limit}`, { token }),
    sendMessage: (token, payload) => request("/api/messages", {
        method: "POST",
        token,
        body: payload,
    }),
    uploadAttachment: (token, file) => {
        const formData = new FormData();
        formData.append("file", file);
        return request("/api/messages/upload", {
            method: "POST",
            token,
            body: formData,
        });
    },
    markChatAsRead: (token, chatId) => request(`/api/messages/${chatId}/read`, {
        method: "POST",
        token,
    }),
};
