import 'express-async-errors';
import express from 'express';
import http from 'http';
import { Server as SocketServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './config/database.js';
import logger from './config/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { setupSocketIO } from './socket/socketEvents.js';
// Routes
import authRoutes from './routes/authRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
// Load environment variables
dotenv.config();
// ES modules workaround
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const allowedOrigins = (process.env.ALLOWED_ORIGINS?.split(',') || [process.env.FRONTEND_URL || 'http://localhost:3000'])
    .map((origin) => origin.trim())
    .filter(Boolean);
const corsOrigin = (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
    }
    callback(new Error(`CORS blocked for origin: ${origin}`));
};
// Initialize app
const app = express();
const server = http.createServer(app);
const io = new SocketServer(server, {
    cors: {
        origin: corsOrigin,
        credentials: true
    },
    transports: ['websocket', 'polling']
});
// Trust proxy
app.set('trust proxy', 1);
// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
    origin: corsOrigin,
    credentials: true,
    optionsSuccessStatus: 200
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
// Health check
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
    });
});
// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/messages', messageRoutes);
// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});
// Global error handler
app.use(errorHandler);
// Socket.io setup
setupSocketIO(io);
// Initialize server
const PORT = parseInt(process.env.PORT || '5000', 10);
const startServer = async () => {
    try {
        // Connect to database
        await connectDB();
        // Start server
        server.listen(PORT, '0.0.0.0', () => {
            logger.info(`🚀 Server running on ${process.env.BACKEND_URL || `http://localhost:${PORT}`}`);
            logger.info(`📁 Environment: ${process.env.NODE_ENV}`);
            logger.info(`🔌 Socket.io ready for connections`);
        });
    }
    catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
};
// Handle graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
        logger.info('Server closed');
        process.exit(0);
    });
});
process.on('SIGINT', () => {
    logger.info('SIGINT received. Shutting down gracefully...');
    server.close(() => {
        logger.info('Server closed');
        process.exit(0);
    });
});
// Start server
startServer();
export { app, server, io };
