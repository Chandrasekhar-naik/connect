# Express + MongoDB Backend - Quick Start Guide

## TL;DR - 5-Minute Setup

### 1. Initialize Backend Project
```bash
mkdir backend && cd backend
npm init -y
npm install express mongoose dotenv cors helmet express-validator bcryptjs jsonwebtoken socket.io multer uuid
npm install --save-dev nodemon @types/node typescript ts-node
npx tsc --init
```

### 2. Create .env File
```
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/pulse-chat
JWT_SECRET=your_secret_key_here
FRONTEND_URL=http://localhost:3000
MAX_FILE_SIZE=5242880
```

### 3. Create Basic server.ts
```typescript
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI!).then(() => {
  console.log('✅ MongoDB Connected');
});

app.listen(5000, () => {
  console.log('🚀 Server running on port 5000');
});
```

### 4. Run Dev Server
```bash
npm run dev
```

---

## Implementation Order (Step-by-Step)

### Week 1: Foundation
- [ ] **Day 1**: Project setup + TypeScript config
- [ ] **Day 2**: MongoDB connection + User model
- [ ] **Day 3**: Auth controller (signup/login) + JWT middleware
- [ ] **Day 4**: Auth routes + testing with Postman
- [ ] **Day 5**: Error handling middleware + validation

### Week 2: Chat Features
- [ ] **Day 6**: Chat model + ChatMember model
- [ ] **Day 7**: Message + MessageRead models
- [ ] **Day 8**: Chat controller (CRUD operations)
- [ ] **Day 9**: Message controller (send/retrieve)
- [ ] **Day 10**: Chat & Message routes + testing

### Week 3: Real-time
- [ ] **Day 11**: Socket.io setup + connection
- [ ] **Day 12**: Real-time message broadcasting
- [ ] **Day 13**: Typing indicators + presence
- [ ] **Day 14**: Read receipts via Socket.io
- [ ] **Day 15**: Integration testing

### Week 4: Files + Deployment
- [ ] **Day 16**: Multer file upload config
- [ ] **Day 17**: File controller + routes
- [ ] **Day 18**: Frontend API client integration
- [ ] **Day 19**: Production env setup
- [ ] **Day 20**: Docker + deployment

---

## Testing Checklist

### Authentication
```bash
# Test Signup
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123","name":"John"}'

# Test Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Test Get Current User (replace TOKEN with actual token)
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer TOKEN"
```

### Chats
```bash
# Create Direct Chat
curl -X POST http://localhost:5000/api/chats/direct \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"other_user_id":"<other_user_id>"}'

# Create Group Chat
curl -X POST http://localhost:5000/api/chats/group \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Team Chat","member_ids":["id1","id2"]}'

# Get User Chats
curl -X GET http://localhost:5000/api/chats \
  -H "Authorization: Bearer TOKEN"
```

### Messages
```bash
# Send Message
curl -X POST http://localhost:5000/api/messages \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"chat_id":"<chat_id>","content":"Hello!","type":"text"}'

# Get Messages
curl -X GET http://localhost:5000/api/messages/<chat_id> \
  -H "Authorization: Bearer TOKEN"
```

---

## Frontend Integration Steps

### Step 1: Install axios
```bash
# In frontend directory
npm install axios socket.io-client
```

### Step 2: Create API Client
```typescript
// src/integrations/api/client.ts
import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api'
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;
```

### Step 3: Update Auth Hook
```typescript
// src/hooks/useAuth.tsx
import { useContext, useEffect, useState } from 'react';
import API from '../integrations/api/client';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      API.get('/auth/me')
        .then((res) => setUser(res.data.user))
        .catch(() => localStorage.removeItem('auth_token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const signOut = async () => {
    localStorage.removeItem('auth_token');
    setUser(null);
  };

  return { user, loading, signOut };
};
```

### Step 4: Update Routes
```typescript
// src/routes/index.tsx
import API from '../integrations/api/client';

export async function LoginRoute() {
  const handleLogin = async (email: string, password: string) => {
    try {
      const res = await API.post('/auth/login', { email, password });
      localStorage.setItem('auth_token', res.data.token);
      // Redirect to chat
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    // Your login form
  );
}
```

### Step 5: Socket.io Integration
```typescript
// src/hooks/useSocket.ts
import { useEffect } from 'react';
import io from 'socket.io-client';

export const useSocket = (chatId: string) => {
  useEffect(() => {
    const socket = io('http://localhost:5000', {
      auth: {
        token: localStorage.getItem('auth_token')
      }
    });

    socket.emit('join-chat', chatId);

    socket.on('new-message', (data) => {
      // Update messages
    });

    return () => {
      socket.emit('leave-chat', chatId);
      socket.disconnect();
    };
  }, [chatId]);
};
```

---

## Environment Setup

### MongoDB Local Installation

**macOS (Homebrew)**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Windows**
- Download from https://www.mongodb.com/try/download/community
- Run installer
- MongoDB runs as a service automatically

**Linux (Ubuntu)**
```bash
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/7.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list
apt-get update
apt-get install -y mongodb-org
systemctl start mongod
```

**Cloud Alternative (MongoDB Atlas)**
1. Go to https://www.mongodb.com/cloud/atlas
2. Create free account
3. Create cluster
4. Copy connection string to `.env`

---

## Development Tools

### Postman Collection Template
```json
{
  "info": {
    "name": "Pulse Chat API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Auth",
      "item": [
        {
          "name": "Signup",
          "request": {
            "method": "POST",
            "url": "http://localhost:5000/api/auth/signup"
          }
        },
        {
          "name": "Login",
          "request": {
            "method": "POST",
            "url": "http://localhost:5000/api/auth/login"
          }
        }
      ]
    }
  ]
}
```

### VS Code Extensions
- REST Client
- Thunder Client
- MongoDB for VS Code
- Postman

### Debugging
```typescript
// Add debug logs
const DEBUG = process.env.NODE_ENV === 'development';

if (DEBUG) {
  console.log('Request:', req.body);
}
```

---

## Common Issues & Solutions

### Issue: MongoDB Connection Error
```bash
# Solution 1: Start MongoDB service
brew services start mongodb-community  # macOS
systemctl start mongod                 # Linux

# Solution 2: Check connection string
echo $MONGODB_URI
```

### Issue: JWT Token Invalid
```bash
# Ensure JWT_SECRET is set in .env
# Re-generate token after changing SECRET
```

### Issue: CORS Errors
```typescript
// Add to backend
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
```

### Issue: Socket.io Connection Failing
```typescript
// Ensure socket middleware includes auth validation
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('No token'));
  // Verify token
  next();
});
```

---

## Production Deployment

### Deploy to Heroku
```bash
# Install Heroku CLI
npm install -g heroku

# Login
heroku login

# Create app
heroku create pulse-chat-api

# Set env variables
heroku config:set MONGODB_URI=mongodb+srv://...
heroku config:set JWT_SECRET=production_secret

# Deploy
git push heroku main

# View logs
heroku logs --tail
```

### Deploy to AWS EC2
```bash
# SSH into instance
ssh -i key.pem ubuntu@ec2-instance.amazonaws.com

# Install Node
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone repo, install, build
git clone https://github.com/your/repo
cd backend
npm install
npm run build

# Start with PM2
sudo npm install -g pm2
pm2 start dist/server.js
pm2 save
```

### Docker Deployment
```bash
# Build image
docker build -t pulse-chat-api .

# Run container
docker run -p 5000:5000 \
  -e MONGODB_URI=mongodb://... \
  -e JWT_SECRET=secret \
  pulse-chat-api
```

---

## Performance Optimization

### Database Indexes
```typescript
// Already in models, but ensure these exist:
messageSchema.index({ chat_id: 1, createdAt: -1 });
chatMemberSchema.index({ chat_id: 1, user_id: 1 });
```

### Caching (Redis)
```typescript
import redis from 'redis';

const client = redis.createClient();

// Cache user by ID
await client.setex(`user:${userId}`, 3600, JSON.stringify(user));
```

### Pagination
```typescript
// Get messages with pagination
const skip = (page - 1) * limit;
Message.find({ chat_id }).skip(skip).limit(limit);
```

---

## Project Summary

**Stack**: Node.js + Express.js + MongoDB + Socket.io + TypeScript

**Timeline**: 20 days (full-time) or 4-5 weeks (part-time)

**Cost**: ~$5-15/month (small VPS + MongoDB Atlas)

**Result**: Production-ready chat backend with real-time capabilities

---

## Next: Start Building! 🚀

1. Run `npm init` in backend directory
2. Follow the 4-step setup above
3. Create your first model (User)
4. Build auth API
5. Test with Postman
6. Expand features incrementally

**Good luck! 🎉**
