# Frontend Integration Guide

This guide shows how to integrate your Pulse Chat frontend with the backend API.

## 1. Environment Setup

Create a `.env` file in your frontend root:

```env
# API Configuration
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000

# App Configuration
VITE_APP_NAME=Pulse Chat
VITE_APP_VERSION=1.0.0
```

---

## 2. API Client Setup

Create `src/integrations/api/client.ts`:

```typescript
import axios, { AxiosInstance } from 'axios';

const API: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_id');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default API;
```

---

## 3. Socket.io Client Setup

Create `src/hooks/useSocket.ts`:

```typescript
import { useEffect, useState } from 'react';
import io, { Socket } from 'socket.io-client';

export const useSocket = (chatId?: string) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const userId = localStorage.getItem('user_id');

    if (!token || !userId) return;

    const newSocket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
      auth: {
        token,
        userId
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      if (chatId) {
        newSocket.emit('join-chat', chatId);
      }
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    setSocket(newSocket);

    return () => {
      if (chatId) {
        newSocket.emit('leave-chat', chatId);
      }
      newSocket.disconnect();
    };
  }, [chatId]);

  return { socket, isConnected };
};
```

---

## 4. Update Authentication Hook

Update `src/hooks/useAuth.tsx`:

```typescript
import { useContext, useEffect, useState } from 'react';
import API from '../integrations/api/client';

interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  status: string;
  phone?: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      API.get('/auth/me')
        .then((res) => {
          setUser(res.data.user);
          localStorage.setItem('user_id', res.data.user.id);
        })
        .catch(() => {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user_id');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const signUp = async (email: string, password: string, name: string) => {
    const res = await API.post('/auth/signup', { email, password, name });
    const { token, user } = res.data;
    localStorage.setItem('auth_token', token);
    localStorage.setItem('user_id', user.id);
    setUser(user);
    return user;
  };

  const signIn = async (email: string, password: string) => {
    const res = await API.post('/auth/login', { email, password });
    const { token, user } = res.data;
    localStorage.setItem('auth_token', token);
    localStorage.setItem('user_id', user.id);
    setUser(user);
    return user;
  };

  const signOut = async () => {
    try {
      await API.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    }
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_id');
    setUser(null);
  };

  return { user, loading, signUp, signIn, signOut };
};
```

---

## 5. Chat API Service

Create `src/services/chatService.ts`:

```typescript
import API from '../integrations/api/client';

export const chatService = {
  // Get all user chats
  getChats: async (limit = 50, skip = 0) => {
    const res = await API.get('/chats', { params: { limit, skip } });
    return res.data.chats;
  },

  // Get or create direct chat
  getOrCreateDirectChat: async (otherUserId: string) => {
    const res = await API.post('/chats/direct', { other_user_id: otherUserId });
    return res.data.chat_id;
  },

  // Create group chat
  createGroupChat: async (name: string, memberIds: string[], description?: string) => {
    const res = await API.post('/chats/group', { name, member_ids: memberIds, description });
    return res.data;
  },

  // Get chat members
  getChatMembers: async (chatId: string) => {
    const res = await API.get(`/chats/${chatId}/members`);
    return res.data.members;
  },

  // Add member to chat
  addChatMember: async (chatId: string, userId: string) => {
    const res = await API.post(`/chats/${chatId}/members`, { user_id: userId });
    return res.data;
  },

  // Remove member from chat
  removeChatMember: async (chatId: string, memberId: string) => {
    const res = await API.delete(`/chats/${chatId}/members/${memberId}`);
    return res.data;
  },

  // Update chat
  updateChat: async (chatId: string, name: string, description?: string) => {
    const res = await API.put(`/chats/${chatId}`, { name, description });
    return res.data;
  },

  // Delete chat
  deleteChat: async (chatId: string) => {
    const res = await API.delete(`/chats/${chatId}`);
    return res.data;
  }
};
```

---

## 6. Message API Service

Create `src/services/messageService.ts`:

```typescript
import API from '../integrations/api/client';

export const messageService = {
  // Send message
  sendMessage: async (chatId: string, content: string, type = 'text', fileUrl?: string, fileName?: string) => {
    const res = await API.post('/messages', {
      chat_id: chatId,
      content,
      type,
      file_url: fileUrl,
      file_name: fileName
    });
    return res.data.data;
  },

  // Get messages
  getMessages: async (chatId: string, limit = 50, skip = 0) => {
    const res = await API.get(`/messages/${chatId}`, { params: { limit, skip } });
    return res.data.messages;
  },

  // Mark message as read
  markAsRead: async (messageId: string) => {
    const res = await API.post('/messages/read/mark', { message_id: messageId });
    return res.data;
  },

  // Mark chat as read
  markChatAsRead: async (chatId: string) => {
    const res = await API.post(`/messages/${chatId}/read`);
    return res.data;
  },

  // Get read receipts
  getMessageReads: async (messageId: string) => {
    const res = await API.get(`/messages/${messageId}/reads`);
    return res.data.reads;
  },

  // Edit message
  editMessage: async (messageId: string, content: string) => {
    const res = await API.put(`/messages/${messageId}`, { content });
    return res.data.data;
  },

  // Delete message
  deleteMessage: async (messageId: string) => {
    const res = await API.delete(`/messages/${messageId}`);
    return res.data;
  },

  // Search messages
  searchMessages: async (chatId: string, query: string, limit = 20) => {
    const res = await API.get(`/messages/${chatId}/search`, { params: { query, limit } });
    return res.data.messages;
  },

  // Add reaction
  addReaction: async (messageId: string, emoji: string) => {
    const res = await API.post(`/messages/${messageId}/reactions`, { emoji });
    return res.data;
  },

  // Remove reaction
  removeReaction: async (messageId: string, emoji: string) => {
    const res = await API.delete(`/messages/${messageId}/reactions`, { data: { emoji } });
    return res.data;
  }
};
```

---

## 7. Update ChatPanel Component

Update `src/components/chat/ChatPanel.tsx`:

```typescript
import { useEffect, useState } from 'react';
import { useSocket } from '../../hooks/useSocket';
import { messageService } from '../../services/messageService';
import { useAuth } from '../../hooks/useAuth';

export const ChatPanel = ({ chatId }: { chatId: string }) => {
  const { user } = useAuth();
  const { socket, isConnected } = useSocket(chatId);
  const [messages, setMessages] = useState<any[]>([]);
  const [content, setContent] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Load messages
  useEffect(() => {
    if (chatId) {
      messageService.getMessages(chatId, 50, 0).then(setMessages);
    }
  }, [chatId]);

  // Listen for new messages
  useEffect(() => {
    if (!socket) return;

    socket.on('new-message', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    socket.on('user-typing', ({ userId }) => {
      if (userId !== user?.id) {
        setIsTyping(true);
      }
    });

    socket.on('user-stopped-typing', () => {
      setIsTyping(false);
    });

    return () => {
      socket.off('new-message');
      socket.off('user-typing');
      socket.off('user-stopped-typing');
    };
  }, [socket, user?.id]);

  const handleSendMessage = async () => {
    if (!content.trim() || !isConnected) return;

    socket?.emit('send-message', {
      chatId,
      content: content.trim(),
      type: 'text'
    });

    setContent('');
  };

  const handleTyping = () => {
    socket?.emit('start-typing', chatId);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages List */}
      <div className="flex-1 overflow-y-auto">
        {messages.map((msg) => (
          <div key={msg.id} className="p-2 border-b">
            <strong>{msg.sender_name}</strong>: {msg.content}
          </div>
        ))}
        {isTyping && <div className="text-gray-500 italic">User is typing...</div>}
      </div>

      {/* Input Area */}
      <div className="border-t p-4">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onInput={handleTyping}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Type a message..."
          className="w-full border rounded p-2"
        />
        <button
          onClick={handleSendMessage}
          disabled={!isConnected}
          className="mt-2 bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
};
```

---

## 8. Update ContactsPanel Component

Update `src/components/chat/ContactsPanel.tsx`:

```typescript
import { useEffect, useState } from 'react';
import { chatService } from '../../services/chatService';

export const ContactsPanel = ({ onSelectChat }: { onSelectChat: (chatId: string) => void }) => {
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadChats = async () => {
      try {
        const data = await chatService.getChats();
        setChats(data);
      } catch (error) {
        console.error('Failed to load chats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadChats();
    const interval = setInterval(loadChats, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, []);

  if (loading) return <div>Loading chats...</div>;

  return (
    <div className="border-r">
      <h2 className="p-4 font-bold">Chats</h2>
      {chats.map((chat) => (
        <div
          key={chat.id}
          onClick={() => onSelectChat(chat.id)}
          className="p-4 border-b hover:bg-gray-100 cursor-pointer"
        >
          <div className="font-semibold">{chat.name}</div>
          <div className="text-sm text-gray-500 truncate">{chat.lastMessage}</div>
        </div>
      ))}
    </div>
  );
};
```

---

## 9. Testing Checklist

- [ ] Auth: Login/Signup works and token is stored
- [ ] Chats: Can load and display user's chats
- [ ] Messages: Can send and receive messages in real-time
- [ ] Socket.io: Connected status shows correctly
- [ ] Typing: Typing indicator appears when user types
- [ ] Read receipts: Messages show read status
- [ ] File upload: Can upload avatars/files
- [ ] Presence: User status updates (online/offline)
- [ ] Error handling: Error messages display correctly

---

## 10. Common Issues

### API Connection Failed
```typescript
// Check if backend URL is correct in .env
console.log(import.meta.env.VITE_API_URL);

// Test API connection
fetch('http://localhost:5000/health')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
```

### Socket.io Not Connecting
```typescript
// Check auth token is set
console.log(localStorage.getItem('auth_token'));

// Check Socket.io URL
console.log(import.meta.env.VITE_SOCKET_URL);
```

### 401 Unauthorized
- Token expired or invalid
- JWT_SECRET mismatch between frontend and backend
- Token not being sent in Authorization header

### CORS Errors
- Check ALLOWED_ORIGINS in backend .env
- Ensure frontend URL matches backend CORS config

---

**Integration complete! Your frontend and backend are now connected. 🎉**
