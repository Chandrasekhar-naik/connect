# Backend Quick Reference

## 🚀 Quick Start (5 Minutes)

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Setup Environment
```bash
# Copy example file
cp .env.example .env

# Edit .env with your settings
# Key values to set:
# - MONGODB_URI: mongodb://localhost:27017/pulse-chat
# - JWT_SECRET: your-secret-key
# - FRONTEND_URL: http://localhost:3173
```

### 3. Start Development
```bash
# Terminal 1: Ensure MongoDB is running
mongod

# Terminal 2: Start backend
npm run dev

# ✅ Server running on http://localhost:5000
```

---

## 📁 Project Structure Summary

```
backend/
├── src/
│   ├── config/          → Database, Logger, Multer config
│   ├── models/          → 6 Mongoose schemas
│   ├── controllers/     → Request handlers (Auth, Chat, Message)
│   ├── services/        → Business logic
│   ├── routes/          → API endpoints
│   ├── middleware/      → Auth, Error, Validation
│   ├── socket/          → Socket.io real-time
│   ├── utils/           → Helpers & Response formatting
│   └── server.ts        → Entry point
├── uploads/             → File storage
├── .env                 → Environment variables
├── docker-compose.yml   → Container setup
└── README.md            → Full documentation
```

---

## 🔌 Main API Endpoints

### Authentication
```
POST   /api/auth/signup          → Register user
POST   /api/auth/login           → Login user
GET    /api/auth/me              → Get current user
POST   /api/auth/logout          → Logout
PUT    /api/auth/profile         → Update profile
POST   /api/auth/avatar          → Upload avatar
GET    /api/auth/search          → Search users
```

### Chats
```
POST   /api/chats/direct         → Create direct chat
POST   /api/chats/group          → Create group chat
GET    /api/chats                → List user chats
GET    /api/chats/:id/members    → Get members
POST   /api/chats/:id/members    → Add member
DELETE /api/chats/:id/members/:mid → Remove member
PUT    /api/chats/:id            → Update chat
DELETE /api/chats/:id            → Delete chat
```

### Messages
```
POST   /api/messages             → Send message
GET    /api/messages/:chat_id    → Get messages
POST   /api/messages/read/mark   → Mark as read
PUT    /api/messages/:id         → Edit message
DELETE /api/messages/:id         → Delete message
GET    /api/messages/:id/reads   → Get read receipts
```

---

## ⚡ Socket.io Events

### Emit (Client → Server)
```javascript
socket.emit('join-chat', chatId)
socket.emit('leave-chat', chatId)
socket.emit('send-message', { chatId, content, type })
socket.emit('start-typing', chatId)
socket.emit('stop-typing', chatId)
socket.emit('message-read', { messageId, chatId })
socket.emit('user-presence', 'online') // 'online', 'away', 'offline'
```

### Listen (Server → Client)
```javascript
socket.on('new-message', (message) => {})
socket.on('user-typing', ({ userId, chatId }) => {})
socket.on('user-stopped-typing', ({ userId }) => {})
socket.on('message-read-update', ({ messageId, userId }) => {})
socket.on('user-presence-update', ({ userId, status }) => {})
socket.on('user-offline', ({ userId }) => {})
socket.on('error', ({ message }) => {})
```

---

## 🗄️ Database Models

| Model | Fields | Purpose |
|-------|--------|---------|
| **User** | email, password, name, phone, avatar_url, status | User accounts |
| **Chat** | is_group, name, description, created_by | Chat rooms |
| **ChatMember** | chat_id, user_id, role, joinedAt | Membership |
| **Message** | chat_id, sender_id, content, type, file_url | Messages |
| **MessageRead** | message_id, user_id, read_at | Read receipts |
| **TypingStatus** | chat_id, user_id, updated_at (TTL: 5s) | Typing state |

---

## 🧪 Test Commands

### Signup
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","name":"Test User"}'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

### Get Current User (Replace TOKEN)
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer TOKEN_HERE"
```

### Create Group Chat (Replace TOKEN)
```bash
curl -X POST http://localhost:5000/api/chats/group \
  -H "Authorization: Bearer TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"name":"Team","member_ids":["id1","id2"]}'
```

### Send Message (Replace TOKEN and CHAT_ID)
```bash
curl -X POST http://localhost:5000/api/messages \
  -H "Authorization: Bearer TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"chat_id":"CHAT_ID","content":"Hello!","type":"text"}'
```

---

## 🐳 Docker Setup

### Run with Docker Compose
```bash
# Start all services (MongoDB + Backend)
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down
```

### Build Custom Image
```bash
# Build image
docker build -t pulse-chat-api .

# Run container
docker run -p 5000:5000 \
  -e MONGODB_URI=mongodb://mongo:27017/pulse-chat \
  -e JWT_SECRET=secret \
  pulse-chat-api
```

---

## 🛠️ Development Commands

```bash
# Start development server with auto-reload
npm run dev

# Build TypeScript to JavaScript
npm run build

# Run production build
npm start

# Lint code
npm run lint

# Install new package
npm install package-name

# Remove package
npm uninstall package-name
```

---

## 📊 Database Setup

### MongoDB Local (macOS)
```bash
# Install via Homebrew
brew tap mongodb/brew
brew install mongodb-community

# Start service
brew services start mongodb-community

# Connect
mongosh
```

### MongoDB Local (Windows)
```bash
# Install from: https://www.mongodb.com/try/download/community
# Then start service via Services app
# Or: net start MongoDB
```

### MongoDB Cloud (Atlas)
1. Go to https://www.mongodb.com/cloud/atlas
2. Create free account & cluster
3. Copy connection string to MONGODB_URI

---

## 🔐 Security Checklist

- ✅ JWT_SECRET is random & strong (generate: `openssl rand -base64 32`)
- ✅ Passwords hashed with bcryptjs (10 rounds)
- ✅ CORS properly configured
- ✅ Helmet security headers enabled
- ✅ Input validation on all endpoints
- ✅ Environment variables used for secrets
- ✅ Socket.io authentication required
- ✅ Error messages don't leak info

---

## 📈 Performance Tips

- Use pagination for message queries
- Enable database indexes (already configured)
- Monitor memory usage with `node --inspect`
- Use CDN for file uploads (optional)
- Enable compression middleware (already enabled)
- Consider Redis for caching (optional upgrade)

---

## 🚢 Deployment Checklist

- [ ] Update NODE_ENV=production
- [ ] Generate strong JWT_SECRET
- [ ] Use MongoDB Atlas for database
- [ ] Setup domain with HTTPS
- [ ] Update FRONTEND_URL & ALLOWED_ORIGINS
- [ ] Enable CORS only for trusted origins
- [ ] Setup logging to file or service
- [ ] Configure health checks
- [ ] Setup monitoring/alerts
- [ ] Backup database regularly
- [ ] Test all endpoints in production

---

## 📞 Troubleshooting

### "Cannot find module" error
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Port already in use
```bash
# Change port in .env
PORT=3001 npm run dev

# Or kill process using port 5000
lsof -i :5000  # Find PID
kill -9 <PID>  # Kill process
```

### MongoDB connection timeout
```bash
# Check MongoDB is running
mongosh

# Or update connection string
# MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/pulse-chat
```

### Socket.io not connecting
- Check CORS settings
- Verify auth token in socket config
- Check WebSocket port 5000 is accessible
- Look for errors in browser console

---

## 📚 Key Files

| File | Purpose |
|------|---------|
| `src/server.ts` | Express server setup |
| `src/config/database.ts` | MongoDB connection |
| `src/socket/socketEvents.ts` | Real-time events |
| `src/middleware/auth.ts` | JWT authentication |
| `src/middleware/errorHandler.ts` | Error handling |
| `.env` | Environment configuration |
| `README.md` | Full documentation |

---

## 🎓 Learning Resources

- Express.js: https://expressjs.com
- MongoDB: https://docs.mongodb.com
- Mongoose: https://mongoosejs.com
- Socket.io: https://socket.io/docs
- JWT: https://jwt.io/introduction

---

**Backend is ready! Start with `npm run dev` 🚀**
