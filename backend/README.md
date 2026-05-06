# Pulse Chat Backend

A production-grade, scalable real-time chat backend built with **Node.js**, **Express.js**, **MongoDB**, and **Socket.io**.

## 🎯 Features

- ✅ User authentication (JWT-based)
- ✅ Direct messaging (1:1 chats)
- ✅ Group chats with member management
- ✅ Real-time message delivery via Socket.io
- ✅ Read receipts and delivery status
- ✅ Typing indicators
- ✅ User presence tracking (online/offline/away)
- ✅ File uploads (avatars, messages attachments)
- ✅ Message editing and deletion
- ✅ Message search functionality
- ✅ Emoji reactions on messages
- ✅ Error handling and validation
- ✅ Logging system
- ✅ CORS and security (Helmet)

---

## 🏗️ Project Structure

```
backend/
├── src/
│   ├── config/              # Configuration files
│   │   ├── database.ts       # MongoDB connection
│   │   ├── logger.ts         # Winston logger
│   │   └── multer.ts         # File upload config
│   ├── models/               # Mongoose schemas (6 models)
│   │   ├── User.ts
│   │   ├── Chat.ts
│   │   ├── ChatMember.ts
│   │   ├── Message.ts
│   │   ├── MessageRead.ts
│   │   ├── TypingStatus.ts
│   │   └── index.ts
│   ├── controllers/          # Request handlers
│   │   ├── authController.ts
│   │   ├── chatController.ts
│   │   ├── messageController.ts
│   │   └── index.ts
│   ├── services/             # Business logic
│   │   ├── authService.ts
│   │   ├── chatService.ts
│   │   ├── messageService.ts
│   │   ├── typingService.ts
│   │   └── index.ts
│   ├── routes/               # API endpoints
│   │   ├── authRoutes.ts
│   │   ├── chatRoutes.ts
│   │   └── messageRoutes.ts
│   ├── middleware/           # Custom middleware
│   │   ├── auth.ts           # JWT authentication
│   │   ├── errorHandler.ts   # Error handling
│   │   └── validation.ts     # Input validation
│   ├── socket/               # Socket.io setup
│   │   └── socketEvents.ts
│   ├── utils/                # Utilities
│   │   ├── response.ts       # Response formatting
│   │   └── fileHandler.ts    # File operations
│   ├── types/                # TypeScript types
│   └── server.ts             # Entry point
├── uploads/                  # File storage directory
├── logs/                     # Application logs
├── .env                      # Environment variables
├── .env.example              # Environment template
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ or 18+
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. **Clone the repository** (if applicable):
```bash
cd backend
```

2. **Install dependencies**:
```bash
npm install
```

3. **Setup environment variables**:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Start MongoDB**:
```bash
# Option 1: Local MongoDB
mongod

# Option 2: MongoDB Atlas
# Update MONGODB_URI in .env
```

5. **Run development server**:
```bash
npm run dev
```

Server will start on `http://localhost:5000`

---

## 📋 Available Scripts

```bash
# Development
npm run dev              # Start with hot-reload (nodemon + ts-node)

# Production
npm run build            # Compile TypeScript
npm start                # Run production build
npm run build:start      # Build and start

# Code quality
npm run lint             # Run ESLint
```

---

## 🔌 API Endpoints

### Authentication
```
POST   /api/auth/signup           # Register user
POST   /api/auth/login            # Login user
GET    /api/auth/me               # Get current user (JWT required)
POST   /api/auth/logout           # Logout (JWT required)
PUT    /api/auth/profile          # Update profile (JWT required)
POST   /api/auth/avatar           # Upload avatar (JWT required)
GET    /api/auth/search           # Search users (JWT required)
```

### Chats
```
POST   /api/chats/direct          # Get/create direct chat
POST   /api/chats/group           # Create group chat
GET    /api/chats                 # Get user's chats
GET    /api/chats/:chatId/members # Get chat members
POST   /api/chats/:chatId/members # Add member to chat
DELETE /api/chats/:chatId/members/:memberId # Remove member
PUT    /api/chats/:chatId         # Update chat info
DELETE /api/chats/:chatId         # Delete chat
```

### Messages
```
POST   /api/messages              # Send message
GET    /api/messages/:chat_id     # Get messages
POST   /api/messages/read/mark    # Mark message as read
POST   /api/messages/:chat_id/read # Mark chat as read
GET    /api/messages/:message_id/reads # Get read receipts
PUT    /api/messages/:message_id  # Edit message
DELETE /api/messages/:message_id  # Delete message
GET    /api/messages/:chat_id/search # Search messages
POST   /api/messages/:message_id/reactions # Add emoji reaction
DELETE /api/messages/:message_id/reactions # Remove emoji reaction
```

---

## ⚡ Socket.io Events

### Client → Server
```javascript
// Join chat room
socket.emit('join-chat', chatId)

// Leave chat room
socket.emit('leave-chat', chatId)

// Send message
socket.emit('send-message', {
  chatId,
  content,
  type: 'text' // 'text', 'image', 'file'
})

// Typing indicator
socket.emit('start-typing', chatId)
socket.emit('stop-typing', chatId)

// Mark message as read
socket.emit('message-read', { messageId, chatId })

// User presence
socket.emit('user-presence', 'online') // 'online', 'away', 'offline'
```

### Server → Client
```javascript
// New message received
socket.on('new-message', (message) => {})

// User typing
socket.on('user-typing', ({ userId, chatId }) => {})
socket.on('user-stopped-typing', ({ userId, chatId }) => {})

// User joined/left
socket.on('user-joined', ({ userId }) => {})
socket.on('user-left', ({ userId }) => {})

// Message read update
socket.on('message-read-update', ({ messageId, userId, readAt }) => {})

// User presence update
socket.on('user-presence-update', ({ userId, status, lastSeen }) => {})
socket.on('user-offline', ({ userId, lastSeen }) => {})

// Error
socket.on('error', ({ message }) => {})
```

---

## 🛡️ Security Features

- ✅ JWT authentication for protected routes
- ✅ Password hashing with bcryptjs
- ✅ Input validation with express-validator
- ✅ CORS protection
- ✅ Helmet for HTTP headers security
- ✅ Environment variables for secrets
- ✅ Mongoose schema validation
- ✅ Error handling middleware
- ✅ Socket.io authentication

---

## 💾 Database Models

### User
```typescript
{
  email: String (unique, required)
  password: String (hashed, required)
  name: String (required)
  phone: String
  avatar_url: String
  status: 'online' | 'offline' | 'away'
  lastSeen: Date
  createdAt: Date
  updatedAt: Date
}
```

### Chat
```typescript
{
  is_group: Boolean
  name: String (for groups)
  avatar_url: String
  description: String
  created_by: ObjectId (ref: User)
  lastMessage: String
  lastMessageTime: Date
  createdAt: Date
  updatedAt: Date
}
```

### ChatMember
```typescript
{
  chat_id: ObjectId (ref: Chat)
  user_id: ObjectId (ref: User)
  role: 'admin' | 'member'
  joinedAt: Date
}
```

### Message
```typescript
{
  chat_id: ObjectId (ref: Chat)
  sender_id: ObjectId (ref: User)
  content: String
  type: 'text' | 'image' | 'file'
  file_url: String
  file_name: String
  file_size: Number
  edited: Boolean
  editedAt: Date
  deletedAt: Date
  isDeleted: Boolean
  reactions: [{ emoji: String, users: ObjectId[] }]
  createdAt: Date
  updatedAt: Date
}
```

### MessageRead
```typescript
{
  message_id: ObjectId (ref: Message)
  user_id: ObjectId (ref: User)
  read_at: Date
}
```

### TypingStatus (TTL: 5 seconds)
```typescript
{
  chat_id: ObjectId (ref: Chat)
  user_id: ObjectId (ref: User)
  updated_at: Date
}
```

---

## 🧪 Testing with Postman/curl

### Signup
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email":"user@example.com",
    "password":"password123",
    "name":"John Doe"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email":"user@example.com",
    "password":"password123"
  }'
```

### Get Current User
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Create Group Chat
```bash
curl -X POST http://localhost:5000/api/chats/group \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Team Chat",
    "member_ids":["user_id_1","user_id_2"]
  }'
```

### Send Message
```bash
curl -X POST http://localhost:5000/api/messages \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "chat_id":"chat_id_here",
    "content":"Hello everyone!",
    "type":"text"
  }'
```

---

## 📊 Performance Optimization

- Database indexes on frequently queried fields
- TTL index for auto-cleanup of typing status
- Pagination for message retrieval
- Compression middleware
- Connection pooling for MongoDB
- Socket.io namespaces (can be extended)

---

## 🚢 Deployment

### Production Environment Variables
```
NODE_ENV=production
JWT_SECRET=<generate-strong-random-secret>
JWT_REFRESH_SECRET=<generate-strong-random-secret>
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/pulse-chat
FRONTEND_URL=https://yourdomain.com
BACKEND_URL=https://api.yourdomain.com
ALLOWED_ORIGINS=https://yourdomain.com
```

### Deploy to Heroku
```bash
heroku login
heroku create your-app-name
heroku config:set JWT_SECRET=<secret>
heroku config:set MONGODB_URI=<uri>
git push heroku main
```

### Deploy with Docker
```bash
docker build -t pulse-chat-api .
docker run -p 5000:5000 \
  -e MONGODB_URI=mongodb://... \
  -e JWT_SECRET=secret \
  pulse-chat-api
```

### Deploy to AWS EC2 / DigitalOcean
1. SSH into server
2. Install Node.js and MongoDB
3. Clone repository
4. Install dependencies: `npm install`
5. Build: `npm run build`
6. Start with PM2: `pm2 start dist/server.js`

---

## 🐛 Troubleshooting

### MongoDB Connection Error
```bash
# Check if MongoDB is running
mongosh

# Or on Windows
net start MongoDB
```

### Port Already in Use
```bash
# Change port in .env or:
PORT=3001 npm run dev
```

### JWT Token Invalid
- Ensure JWT_SECRET matches in .env
- Check token hasn't expired
- Verify token format: `Authorization: Bearer <token>`

### Socket.io Not Connecting
- Check CORS settings match frontend URL
- Verify auth token in socket connection
- Check WebSocket port is accessible

---

## 📚 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Runtime** | Node.js 16+ |
| **Framework** | Express.js 4.x |
| **Language** | TypeScript 5.x |
| **Database** | MongoDB 5.0+ |
| **ORM** | Mongoose 8.x |
| **Real-time** | Socket.io 4.x |
| **Authentication** | JWT + bcryptjs |
| **File Upload** | Multer |
| **Validation** | express-validator, Joi |
| **Security** | Helmet |
| **Logging** | Winston |

---

## 📝 License

MIT

---

## 👥 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📞 Support

For issues and questions, please open an issue on GitHub.

---

**Happy coding! 🚀**
