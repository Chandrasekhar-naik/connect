# Backend Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     FRONTEND (React + TanStack)                 │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │
│  │  Auth    │  │  Chat    │  │ Messages │  │ Real-time    │   │
│  │Components│  │Components│  │Components│  │(Socket.io)   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────┘   │
└─────────────────────────────────────────────────────────────────┘
         │                                            │
         ├──────────────────┬───────────────────────┬─┤
         │                  │                       │
    HTTP API            WebSocket           REST API
   (REST calls)      (Real-time events)   (File uploads)
         │                  │                       │
┌─────────────────────────────────────────────────────────────────┐
│                   BACKEND (Express.js + Node.js)                 │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ HTTP Server (Express)                                    │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │ • Auth Routes  (/api/auth)                               │  │
│  │ • Chat Routes  (/api/chats)                              │  │
│  │ • Message Routes  (/api/messages)                        │  │
│  │ • File Upload  (/api/files)                              │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Socket.io Server (Real-time)                             │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │ • Message Broadcast                                      │  │
│  │ • Typing Indicators                                      │  │
│  │ • User Presence                                          │  │
│  │ • Read Receipts                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Middleware & Services                                    │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │ • JWT Authentication                                     │  │
│  │ • Error Handling                                         │  │
│  │ • Input Validation                                       │  │
│  │ • File Upload (Multer)                                   │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
         │                                            │
         │ Mongoose ODM                               │ File Storage
         ▼                                            ▼
┌──────────────────────────┐              ┌──────────────────────┐
│   MongoDB Database       │              │   File System        │
│                          │              │                      │
│  ┌────────────────────┐ │              │  /uploads/           │
│  │ Collections:       │ │              │   ├── user1/         │
│  │ • users            │ │              │   ├── user2/         │
│  │ • chats            │ │              │   └── ...            │
│  │ • chat_members     │ │              │                      │
│  │ • messages         │ │              │  OR Cloud Storage    │
│  │ • message_reads    │ │              │  (AWS S3, etc)       │
│  │ • typing_status    │ │              │                      │
│  └────────────────────┘ │              │                      │
└──────────────────────────┘              └──────────────────────┘
```

## Request Flow Examples

### Authentication Flow
```
1. User enters email + password
   │
   ▼
2. Frontend: POST /api/auth/login
   │
   ▼
3. Backend validates credentials against User model
   │
   ├─ Password match? (bcryptjs comparison)
   │
   ▼ YES
4. Backend generates JWT token
   │
   ▼
5. Backend returns token to frontend
   │
   ▼
6. Frontend stores token in localStorage
   │
   ▼
7. Subsequent requests include token in Authorization header
```

### Message Sending Flow (Real-time)
```
1. User types and sends message in ChatPanel
   │
   ▼
2. Frontend: socket.emit('send-message', { chatId, content })
   │
   ▼
3. Backend Socket Handler validates auth + chat membership
   │
   ▼
4. Backend saves message to MongoDB (Message model)
   │
   ▼
5. Backend broadcasts to all clients in chat room
   socket.io('new-message', { message, timestamp })
   │
   ▼
6. All connected clients receive message in real-time
   │
   ▼
7. Frontend displays message instantly (no page refresh)
```

### Chat Creation Flow
```
1. User clicks "New Chat"
   │
   ▼
2. Frontend: POST /api/chats/group
   { name, member_ids }
   │
   ▼
3. Backend auth middleware validates JWT
   │
   ▼
4. Backend creates Chat document
   │
   ▼
5. Backend creates ChatMember entries for all members
   │
   ▼
6. Backend returns chat_id
   │
   ▼
7. Frontend redirects to /chat/:chatId
```

## Database Schema Relationships

```
┌─────────────┐
│   Users     │
│─────────────│
│ _id (PK)    │◄─────────┐
│ email       │          │
│ password    │          │
│ name        │          │
│ phone       │          │
│ avatar_url  │          │
│ createdAt   │          │
│ updatedAt   │          │
└─────────────┘          │
        ▲                │
        │                │
        │         ┌──────────────────┐
        │         │   ChatMembers    │
        └─────────│─────────────────│
                  │ chat_id (FK)     │
                  │ user_id (FK)────┤
                  │ joined_at        │
                  └──────────────────┘
                         ▲
                         │
                         │
        ┌────────────────┴──────────────┐
        │                               │
    ┌─────────┐               ┌──────────────┐
    │  Chats  │               │   Messages   │
    │─────────│───────────────│──────────────│
    │ _id(PK) │◄──is_group───│ chat_id(FK)  │
    │ is_group│   name        │ sender_id(FK)│───┐
    │ name    │   avatar_url  │ content      │   │
    │created_ │   created_by  │ type         │   │
    │by (FK)──┼──────────────┤ file_url     │   │
    │createdAt│               │ file_name    │   │
    │updatedAt│               │ createdAt    │   │
    └─────────┘               └──────────────┘   │
                                    ▲            │
                                    │            │
                            ┌───────┴─────────┐  │
                            │  MessageReads   │  │
                            │───────────────│  │
                            │message_id(FK) │  │
                            │user_id(FK)────┼──┴─To Users
                            │read_at        │
                            └───────────────┘

┌──────────────────┐
│  TypingStatus    │
│──────────────────│
│ chat_id(FK)──┐   │
│ user_id(FK)──┼─┐ │
│ updated_at   │ │ │
└──────────────┘ │ │
                 │ │
         To Chats│ │
         To Users├─┘
```

## File Upload Architecture

```
┌──────────────────────────────────────┐
│  User uploads file                   │
│  (ChatPanel / ProfileImage)          │
└──────────────────────────────────────┘
              │
              ▼
┌──────────────────────────────────────┐
│  Frontend FormData                   │
│  multipart/form-data                 │
└──────────────────────────────────────┘
              │
              ▼
┌──────────────────────────────────────┐
│  Backend Route: /api/files/upload    │
│  Multer middleware validation        │
└──────────────────────────────────────┘
              │
              ▼
┌──────────────────────────────────────┐
│  Save to disk or cloud storage:      │
│  uploads/{user_id}/{uuid}+ext        │
└──────────────────────────────────────┘
              │
              ▼
┌──────────────────────────────────────┐
│  Return file URL to frontend         │
│  /uploads/{user_id}/filename         │
└──────────────────────────────────────┘
              │
              ▼
┌──────────────────────────────────────┐
│  Frontend displays file preview      │
│  or stores reference in Message      │
└──────────────────────────────────────┘
```

## API Endpoint Summary

```
Authentication
├── POST   /api/auth/signup          → Register new user
├── POST   /api/auth/login           → Login & get JWT
└── GET    /api/auth/me              → Get current user (JWT required)

Chats
├── GET    /api/chats                → List user's chats
├── POST   /api/chats/direct         → Get/create direct message
├── POST   /api/chats/group          → Create group chat
└── PUT    /api/chats/:id            → Update chat (name, avatar)

Messages
├── GET    /api/messages/:chat_id    → Get chat messages
├── POST   /api/messages             → Send message
├── POST   /api/messages/read        → Mark as read
└── DELETE /api/messages/:id         → Delete message (soft delete)

Files
├── POST   /api/files/upload         → Upload avatar/chat file
└── GET    /uploads/:path            → Download/stream file

Socket.io Events
├── join-chat                        → User enters chat
├── leave-chat                       → User exits chat
├── send-message                     → Broadcast new message
├── start-typing                     → Send typing indicator
├── stop-typing                      → Clear typing indicator
├── user-online                      → Presence update
└── user-offline                     → Presence update
```

## Security Layers

```
Request comes in
        │
        ▼
┌───────────────────────────────────────┐
│ 1. CORS Verification                  │
│    ✓ Check origin matches allowed     │
└───────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────┐
│ 2. Helmet Security Headers            │
│    ✓ X-Frame-Options                  │
│    ✓ X-Content-Type-Options           │
│    ✓ Strict-Transport-Security        │
└───────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────┐
│ 3. JWT Token Validation               │
│    ✓ Bearer token extracted           │
│    ✓ Signature verified               │
│    ✓ Expiration checked               │
│    ✓ User exists in DB                │
└───────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────┐
│ 4. Input Validation                   │
│    ✓ Required fields present          │
│    ✓ Data types correct               │
│    ✓ Length/format validated          │
│    ✓ No injection attempts            │
└───────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────┐
│ 5. Authorization Checks               │
│    ✓ User owns resource               │
│    ✓ User is chat member              │
│    ✓ User has permission              │
└───────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────┐
│ 6. Database Operation                 │
│    ✓ Mongoose schema validation       │
│    ✓ Indexes for performance          │
│    ✓ TTL for temporary data           │
└───────────────────────────────────────┘
        │
        ▼
Response to client
```

## Comparison: Supabase vs Express + MongoDB

```
┌─────────────────────┬──────────────────────┬──────────────────────┐
│     Feature         │      Supabase        │  Express + MongoDB   │
├─────────────────────┼──────────────────────┼──────────────────────┤
│ Authentication      │ Built-in Auth        │ JWT + bcryptjs       │
│ Database            │ PostgreSQL (managed) │ MongoDB (self-hosted)│
│ Real-time           │ Realtime LISTEN/     │ Socket.io            │
│                     │ NOTIFY               │                      │
│ File Storage        │ S3-compatible        │ Local disk/S3        │
│ Security            │ Row-level policies   │ Manual middleware    │
│ Serverless          │ Yes (managed)        │ No (requires server) │
│ Cost (small scale)  │ Free tier available  │ ~$5-10/mo (VPS)      │
│ Customization       │ Limited              │ Full control         │
│ Scaling             │ Automatic            │ Manual config        │
│ Learning curve      │ Easy (SQL)           │ Moderate (JS/TS)     │
│ Deployment          │ Managed              │ Docker/VPS/K8s       │
└─────────────────────┴──────────────────────┴──────────────────────┘
```
