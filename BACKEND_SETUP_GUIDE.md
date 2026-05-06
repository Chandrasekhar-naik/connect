# Backend Setup Guide: Express.js + Node.js + MongoDB for Pulse Chat

This guide provides a step-by-step approach to build a production-grade backend replacing Supabase with Node.js, Express.js, and MongoDB.

---

## **Phase 1: Project Initialization & Setup**

### **Step 1.1: Create Backend Directory Structure**

```bash
# From project root
mkdir backend
cd backend
npm init -y
```

### **Step 1.2: Install Core Dependencies**

```bash
npm install express mongoose dotenv cors helmet express-validator bcryptjs jsonwebtoken socket.io multer uuid
npm install --save-dev nodemon @types/node typescript ts-node
```

**Package Descriptions:**
- `express` — Web framework
- `mongoose` — MongoDB ODM
- `dotenv` — Environment variables
- `cors` — Cross-origin requests
- `helmet` — Security headers
- `express-validator` — Input validation
- `bcryptjs` — Password hashing
- `jsonwebtoken` — JWT auth
- `socket.io` — Real-time WebSocket communication
- `multer` — File upload handling
- `uuid` — Unique ID generation
- `nodemon` — Dev auto-reload
- `typescript` + `ts-node` — TypeScript support

### **Step 1.3: Project Structure**

```
backend/
├── src/
│   ├── config/
│   │   ├── database.ts          # MongoDB connection
│   │   ├── environment.ts       # Env vars validation
│   │   └── multer.ts            # File upload config
│   ├── models/
│   │   ├── User.ts              # User schema
│   │   ├── Chat.ts              # Chat/Group schema
│   │   ├── ChatMember.ts        # Chat members
│   │   ├── Message.ts           # Messages
│   │   ├── MessageRead.ts        # Read receipts
│   │   └── TypingStatus.ts       # Typing indicators
│   ├── controllers/
│   │   ├── authController.ts    # Login/signup/logout
│   │   ├── userController.ts    # Profile management
│   │   ├── chatController.ts    # Chat CRUD
│   │   ├── messageController.ts # Message CRUD
│   │   └── fileController.ts    # File uploads
│   ├── routes/
│   │   ├── auth.ts              # Auth routes
│   │   ├── users.ts             # User routes
│   │   ├── chats.ts             # Chat routes
│   │   ├── messages.ts          # Message routes
│   │   └── files.ts             # File upload routes
│   ├── middleware/
│   │   ├── auth.ts              # JWT verification
│   │   ├── errorHandler.ts      # Error handling
│   │   └── validation.ts        # Input validation
│   ├── services/
│   │   ├── authService.ts       # Auth business logic
│   │   ├── chatService.ts       # Chat logic
│   │   ├── messageService.ts    # Message logic
│   │   └── fileService.ts       # File handling
│   ├── socket/
│   │   ├── events.ts            # Socket event handlers
│   │   ├── namespaces.ts        # Socket namespaces
│   │   └── middleware.ts        # Socket auth
│   ├── utils/
│   │   ├── logger.ts            # Logging
│   │   ├── responses.ts         # Standard response format
│   │   └── validators.ts        # Validation helpers
│   └── server.ts                # Entry point
├── uploads/                     # File storage directory
├── .env                         # Environment variables
├── .env.example                 # Template
├── package.json
├── tsconfig.json
├── .gitignore
└── README.md
```

### **Step 1.4: TypeScript Configuration**

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### **Step 1.5: package.json Scripts**

```json
{
  "scripts": {
    "dev": "nodemon --exec ts-node src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "build:start": "npm run build && npm start",
    "test": "echo \"Error: no test specified\" && exit 1"
  }
}
```

---

## **Phase 2: Configuration & Database Setup**

### **Step 2.1: Environment Variables (.env)**

```
# Server
PORT=5000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/pulse-chat
# For MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/pulse-chat

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRE=7d

# File Upload
MAX_FILE_SIZE=5242880 # 5MB
UPLOAD_DIR=./uploads

# CORS
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:5000

# Email (optional, for OAuth callback)
OAUTH_REDIRECT_URL=http://localhost:5000/auth/oauth/callback
```

### **Step 2.2: Database Configuration (src/config/database.ts)**

```typescript
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pulse-chat';

export const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    process.exit(1);
  }
};

export const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    console.log('✅ MongoDB Disconnected');
  } catch (error) {
    console.error('❌ MongoDB Disconnection Error:', error);
  }
};

export default mongoose;
```

### **Step 2.3: Multer Configuration (src/config/multer.ts)**

```typescript
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';

const uploadDir = process.env.UPLOAD_DIR || './uploads';

// Create upload directory if it doesn't exist
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userUploadDir = path.join(uploadDir, req.user?.id || 'anonymous');
    if (!fs.existsSync(userUploadDir)) {
      fs.mkdirSync(userUploadDir, { recursive: true });
    }
    cb(null, userUploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

export const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880') },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'image/jpeg', 'image/png', 'image/gif',
      'application/pdf',
      'application/msword',
      'text/plain'
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});
```

---

## **Phase 3: Database Models**

### **Step 3.1: User Model (src/models/User.ts)**

```typescript
import mongoose, { Schema, Document } from 'mongoose';
import bcryptjs from 'bcryptjs';

interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  phone?: string;
  avatar_url?: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(password: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: true,
      minlength: 6
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    phone: {
      type: String,
      default: null
    },
    avatar_url: {
      type: String,
      default: null
    }
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcryptjs.genSalt(10);
    this.password = await bcryptjs.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(password: string) {
  return bcryptjs.compare(password, this.password);
};

export const User = mongoose.model<IUser>('User', userSchema);
```

### **Step 3.2: Chat Model (src/models/Chat.ts)**

```typescript
import mongoose, { Schema, Document } from 'mongoose';

interface IChat extends Document {
  is_group: boolean;
  name?: string;
  avatar_url?: string;
  created_by: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const chatSchema = new Schema<IChat>(
  {
    is_group: {
      type: Boolean,
      default: false
    },
    name: {
      type: String,
      required: function() { return this.is_group; }
    },
    avatar_url: {
      type: String,
      default: null
    },
    created_by: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  { timestamps: true }
);

export const Chat = mongoose.model<IChat>('Chat', chatSchema);
```

### **Step 3.3: ChatMember Model (src/models/ChatMember.ts)**

```typescript
import mongoose, { Schema, Document } from 'mongoose';

interface IChatMember extends Document {
  chat_id: mongoose.Types.ObjectId;
  user_id: mongoose.Types.ObjectId;
  joined_at: Date;
}

const chatMemberSchema = new Schema<IChatMember>({
  chat_id: {
    type: Schema.Types.ObjectId,
    ref: 'Chat',
    required: true
  },
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  joined_at: {
    type: Date,
    default: Date.now
  }
}, { timestamps: false });

// Composite unique index
chatMemberSchema.index({ chat_id: 1, user_id: 1 }, { unique: true });

export const ChatMember = mongoose.model<IChatMember>('ChatMember', chatMemberSchema);
```

### **Step 3.4: Message Model (src/models/Message.ts)**

```typescript
import mongoose, { Schema, Document } from 'mongoose';

type MessageType = 'text' | 'image' | 'file';

interface IMessage extends Document {
  chat_id: mongoose.Types.ObjectId;
  sender_id: mongoose.Types.ObjectId;
  content: string;
  type: MessageType;
  file_url?: string;
  file_name?: string;
  createdAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    chat_id: {
      type: Schema.Types.ObjectId,
      ref: 'Chat',
      required: true
    },
    sender_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['text', 'image', 'file'],
      default: 'text'
    },
    file_url: String,
    file_name: String
  },
  { timestamps: true }
);

// Index for fast queries
messageSchema.index({ chat_id: 1, createdAt: -1 });

export const Message = mongoose.model<IMessage>('Message', messageSchema);
```

### **Step 3.5: MessageRead Model (src/models/MessageRead.ts)**

```typescript
import mongoose, { Schema, Document } from 'mongoose';

interface IMessageRead extends Document {
  message_id: mongoose.Types.ObjectId;
  user_id: mongoose.Types.ObjectId;
  read_at: Date;
}

const messageReadSchema = new Schema<IMessageRead>({
  message_id: {
    type: Schema.Types.ObjectId,
    ref: 'Message',
    required: true
  },
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  read_at: {
    type: Date,
    default: Date.now
  }
});

// Composite unique index
messageReadSchema.index({ message_id: 1, user_id: 1 }, { unique: true });

export const MessageRead = mongoose.model<IMessageRead>('MessageRead', messageReadSchema);
```

### **Step 3.6: TypingStatus Model (src/models/TypingStatus.ts)**

```typescript
import mongoose, { Schema, Document } from 'mongoose';

interface ITypingStatus extends Document {
  chat_id: mongoose.Types.ObjectId;
  user_id: mongoose.Types.ObjectId;
  updated_at: Date;
}

const typingStatusSchema = new Schema<ITypingStatus>({
  chat_id: {
    type: Schema.Types.ObjectId,
    ref: 'Chat',
    required: true
  },
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updated_at: {
    type: Date,
    default: Date.now,
    expires: 5 // Auto-delete after 5 seconds
  }
});

typingStatusSchema.index({ chat_id: 1, user_id: 1 }, { unique: true });

export const TypingStatus = mongoose.model<ITypingStatus>('TypingStatus', typingStatusSchema);
```

---

## **Phase 4: Authentication & Middleware**

### **Step 4.1: JWT Middleware (src/middleware/auth.ts)**

```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';

declare global {
  namespace Express {
    interface Request {
      user?: any;
      token?: string;
    }
  }
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

export const generateToken = (userId: string) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};
```

### **Step 4.2: Error Handler (src/middleware/errorHandler.ts)**

```typescript
import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
  }
}

export const errorHandler = (
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      error: error.message,
      statusCode: error.statusCode
    });
  }

  console.error('Unhandled Error:', error);
  res.status(500).json({
    error: 'Internal Server Error',
    statusCode: 500
  });
};
```

---

## **Phase 5: Controllers & Routes**

### **Step 5.1: Auth Controller (src/controllers/authController.ts)**

```typescript
import { Request, Response } from 'express';
import { User } from '../models/User';
import { generateToken } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

export const authController = {
  // Signup
  async signup(req: Request, res: Response) {
    try {
      const { email, password, name } = req.body;

      // Validation
      if (!email || !password || !name) {
        throw new AppError(400, 'Missing required fields');
      }

      // Check if user exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new AppError(409, 'User already exists');
      }

      // Create user
      const user = new User({ email, password, name });
      await user.save();

      // Generate token
      const token = generateToken(user._id.toString());

      res.status(201).json({
        message: 'User created successfully',
        token,
        user: {
          id: user._id,
          email: user.email,
          name: user.name
        }
      });
    } catch (error) {
      throw error;
    }
  },

  // Login
  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        throw new AppError(400, 'Email and password required');
      }

      const user = await User.findOne({ email });
      if (!user) {
        throw new AppError(401, 'Invalid credentials');
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        throw new AppError(401, 'Invalid credentials');
      }

      const token = generateToken(user._id.toString());

      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          avatar_url: user.avatar_url
        }
      });
    } catch (error) {
      throw error;
    }
  },

  // Get current user
  async getCurrentUser(req: Request, res: Response) {
    try {
      res.json({
        user: {
          id: req.user._id,
          email: req.user.email,
          name: req.user.name,
          avatar_url: req.user.avatar_url,
          phone: req.user.phone
        }
      });
    } catch (error) {
      throw error;
    }
  }
};
```

### **Step 5.2: Chat Controller (src/controllers/chatController.ts)**

```typescript
import { Request, Response } from 'express';
import { Chat } from '../models/Chat';
import { ChatMember } from '../models/ChatMember';
import { Message } from '../models/Message';
import { AppError } from '../middleware/errorHandler';

export const chatController = {
  // Create or get direct chat
  async getOrCreateDirectChat(req: Request, res: Response) {
    try {
      const { other_user_id } = req.body;
      const userId = req.user._id;

      // Check if direct chat exists
      let chat = await Chat.findOne({
        is_group: false,
        $and: [
          { created_by: { $in: [userId, other_user_id] } }
        ]
      });

      if (chat) {
        const isMember = await ChatMember.findOne({
          chat_id: chat._id,
          user_id: userId
        });
        if (!isMember) {
          throw new AppError(403, 'Not a member of this chat');
        }
      } else {
        // Create new direct chat
        chat = new Chat({
          is_group: false,
          created_by: userId
        });
        await chat.save();

        // Add both users
        await ChatMember.create([
          { chat_id: chat._id, user_id: userId },
          { chat_id: chat._id, user_id: other_user_id }
        ]);
      }

      res.json({ chat_id: chat._id });
    } catch (error) {
      throw error;
    }
  },

  // Create group chat
  async createGroupChat(req: Request, res: Response) {
    try {
      const { name, member_ids } = req.body;
      const userId = req.user._id;

      if (!name || !Array.isArray(member_ids)) {
        throw new AppError(400, 'Name and member IDs required');
      }

      const chat = new Chat({
        is_group: true,
        name,
        created_by: userId
      });
      await chat.save();

      // Add all members
      const memberData = [
        { chat_id: chat._id, user_id: userId },
        ...member_ids.map((id: string) => ({ chat_id: chat._id, user_id: id }))
      ];
      await ChatMember.insertMany(memberData);

      res.status(201).json({ chat_id: chat._id, name, is_group: true });
    } catch (error) {
      throw error;
    }
  },

  // Get user's chats
  async getUserChats(req: Request, res: Response) {
    try {
      const userId = req.user._id;

      const memberChats = await ChatMember.find({ user_id: userId })
        .populate({
          path: 'chat_id',
          populate: { path: 'created_by', select: 'name avatar_url' }
        });

      const chats = await Promise.all(
        memberChats.map(async (member) => {
          const chat = member.chat_id as any;
          const lastMessage = await Message.findOne({ chat_id: chat._id })
            .sort({ createdAt: -1 });

          return {
            id: chat._id,
            name: chat.is_group ? chat.name : (chat.created_by as any).name,
            avatar_url: chat.avatar_url,
            is_group: chat.is_group,
            lastMessage: lastMessage?.content,
            lastMessageTime: lastMessage?.createdAt
          };
        })
      );

      res.json({ chats });
    } catch (error) {
      throw error;
    }
  }
};
```

### **Step 5.3: Message Controller (src/controllers/messageController.ts)**

```typescript
import { Request, Response } from 'express';
import { Message } from '../models/Message';
import { MessageRead } from '../models/MessageRead';
import { AppError } from '../middleware/errorHandler';

export const messageController = {
  // Get chat messages
  async getMessages(req: Request, res: Response) {
    try {
      const { chat_id } = req.params;
      const { limit = 50, skip = 0 } = req.query;

      const messages = await Message.find({ chat_id })
        .populate('sender_id', 'name avatar_url email')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit as string))
        .skip(parseInt(skip as string));

      res.json({ messages: messages.reverse() });
    } catch (error) {
      throw error;
    }
  },

  // Send message
  async sendMessage(req: Request, res: Response) {
    try {
      const { chat_id, content, type = 'text' } = req.body;
      const sender_id = req.user._id;

      if (!chat_id || !content) {
        throw new AppError(400, 'Chat ID and content required');
      }

      const message = new Message({
        chat_id,
        sender_id,
        content,
        type
      });
      await message.save();
      await message.populate('sender_id', 'name avatar_url');

      res.status(201).json({ message });
    } catch (error) {
      throw error;
    }
  },

  // Mark message as read
  async markAsRead(req: Request, res: Response) {
    try {
      const { message_id } = req.body;
      const user_id = req.user._id;

      await MessageRead.findOneAndUpdate(
        { message_id, user_id },
        { read_at: new Date() },
        { upsert: true }
      );

      res.json({ success: true });
    } catch (error) {
      throw error;
    }
  }
};
```

### **Step 5.4: Auth Routes (src/routes/auth.ts)**

```typescript
import { Router } from 'express';
import { authController } from '../controllers/authController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/me', authMiddleware, authController.getCurrentUser);

export default router;
```

### **Step 5.5: Chat Routes (src/routes/chats.ts)**

```typescript
import { Router } from 'express';
import { chatController } from '../controllers/chatController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.post('/direct', chatController.getOrCreateDirectChat);
router.post('/group', chatController.createGroupChat);
router.get('/', chatController.getUserChats);

export default router;
```

### **Step 5.6: Message Routes (src/routes/messages.ts)**

```typescript
import { Router } from 'express';
import { messageController } from '../controllers/messageController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/:chat_id', messageController.getMessages);
router.post('/', messageController.sendMessage);
router.post('/read', messageController.markAsRead);

export default router;
```

---

## **Phase 6: Real-time with Socket.io**

### **Step 6.1: Socket Events (src/socket/events.ts)**

```typescript
import { Server, Socket } from 'socket.io';
import { Message } from '../models/Message';
import { TypingStatus } from '../models/TypingStatus';
import { ChatMember } from '../models/ChatMember';

export const setupSocketEvents = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    const userId = socket.handshake.auth.userId;
    console.log(`User ${userId} connected`);

    // Join chat room
    socket.on('join-chat', (chatId: string) => {
      socket.join(`chat-${chatId}`);
      io.to(`chat-${chatId}`).emit('user-online', { userId });
    });

    // Leave chat room
    socket.on('leave-chat', (chatId: string) => {
      socket.leave(`chat-${chatId}`);
      io.to(`chat-${chatId}`).emit('user-offline', { userId });
    });

    // Send message (real-time)
    socket.on('send-message', async (data) => {
      const { chatId, content, type } = data;
      try {
        const message = new Message({
          chat_id: chatId,
          sender_id: userId,
          content,
          type
        });
        await message.save();
        await message.populate('sender_id', 'name avatar_url');

        io.to(`chat-${chatId}`).emit('new-message', {
          message,
          timestamp: new Date()
        });
      } catch (error) {
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Typing indicator
    socket.on('start-typing', async (chatId: string) => {
      await TypingStatus.findOneAndUpdate(
        { chat_id: chatId, user_id: userId },
        { updated_at: new Date() },
        { upsert: true }
      );
      io.to(`chat-${chatId}`).emit('user-typing', { userId });
    });

    socket.on('stop-typing', async (chatId: string) => {
      await TypingStatus.deleteOne({
        chat_id: chatId,
        user_id: userId
      });
      io.to(`chat-${chatId}`).emit('user-stopped-typing', { userId });
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`User ${userId} disconnected`);
      socket.broadcast.emit('user-offline', { userId });
    });
  });
};
```

### **Step 6.2: Socket Middleware (src/socket/middleware.ts)**

```typescript
import { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

export const socketAuthMiddleware = (socket: Socket, next: any) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('No token'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    socket.handshake.auth.userId = decoded.userId;
    next();
  } catch (error) {
    next(new Error('Invalid token'));
  }
};
```

---

## **Phase 7: Main Server File**

### **Step 7.1: Server Setup (src/server.ts)**

```typescript
import express from 'express';
import http from 'http';
import { Server as SocketServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { connectDB } from './config/database';
import { setupSocketEvents } from './socket/events';
import { socketAuthMiddleware } from './socket/middleware';
import { errorHandler } from './middleware/errorHandler';

// Routes
import authRoutes from './routes/auth';
import chatRoutes from './routes/chats';
import messageRoutes from './routes/messages';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new SocketServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
  }
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Socket auth middleware
io.use(socketAuthMiddleware);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/messages', messageRoutes);

// Static files for uploads
app.use('/uploads', express.static('uploads'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

// Socket events
setupSocketEvents(io);

// Error handler
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;

(async () => {
  try {
    await connectDB();
    server.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();

export { app, io };
```

---

## **Phase 8: Frontend Integration**

### **Step 8.1: Update API Client (src/integrations/supabase/client.ts)**

Replace Supabase with API calls:

```typescript
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const client = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default client;
```

### **Step 8.2: Socket.io Client Hook**

Create `src/hooks/useSocket.ts`:

```typescript
import { useEffect, useState } from 'react';
import io, { Socket } from 'socket.io-client';

export const useSocket = (chatId: string) => {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const userId = localStorage.getItem('user_id');

    const newSocket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
      auth: {
        token,
        userId
      }
    });

    newSocket.emit('join-chat', chatId);
    setSocket(newSocket);

    return () => {
      newSocket.emit('leave-chat', chatId);
      newSocket.disconnect();
    };
  }, [chatId]);

  return socket;
};
```

---

## **Phase 9: Deployment**

### **Step 9.1: Production Build**

```bash
# Build TypeScript
npm run build

# Start production server
npm start
```

### **Step 9.2: Environment for Production**

Update `.env` for production:

```
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/pulse-chat
JWT_SECRET=<generate-strong-secret>
FRONTEND_URL=https://yourdomain.com
BACKEND_URL=https://api.yourdomain.com
```

### **Step 9.3: Docker Setup (Optional)**

Create `Dockerfile`:

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY src ./src
COPY tsconfig.json ./
RUN npm run build
CMD ["npm", "start"]
```

---

## **Phase 10: Testing Checklist**

- [ ] Auth: Signup, login, token validation
- [ ] Chats: Create direct chat, create group, list chats
- [ ] Messages: Send, retrieve, mark as read
- [ ] Real-time: Socket connection, message broadcasting
- [ ] Files: Upload, download with permissions
- [ ] Error handling: Invalid inputs, auth failures
- [ ] Database: Proper indexes, validation
- [ ] Security: JWT validation, CORS, input sanitization

---

## **Key Differences from Supabase**

| Feature | Supabase | Express + MongoDB |
|---------|----------|-------------------|
| **Auth** | Supabase Auth | JWT + bcryptjs |
| **DB** | PostgreSQL | MongoDB |
| **Real-time** | Supabase Realtime (LISTEN/NOTIFY) | Socket.io |
| **Files** | Supabase Storage | Local disk / S3 |
| **RLS** | Built-in | Manual middleware |
| **Hosting** | Managed | Docker/VPS |

---

## **Next Steps**

1. Initialize backend directory
2. Install dependencies
3. Create `.env` file
4. Set up MongoDB (local or Atlas)
5. Implement Phase 2-4 (Config & Models)
6. Implement Phase 5 (Controllers & Routes)
7. Implement Phase 6 (Socket.io)
8. Test with Postman/Insomnia
9. Connect frontend
10. Deploy to production

This comprehensive guide gives you a production-ready backend structure. Adjust as needed for your specific requirements!
