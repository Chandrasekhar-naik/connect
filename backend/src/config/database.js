import mongoose from 'mongoose';
import winston from 'winston';
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.Console({
            format: winston.format.simple()
        })
    ]
});
export const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/pulse-chat';
        await mongoose.connect(mongoUri, {
            maxPoolSize: 10,
            minPoolSize: 5,
            socketTimeoutMS: 45000
        });
        logger.info('✅ MongoDB Connected Successfully');
    }
    catch (error) {
        logger.error('❌ MongoDB Connection Failed:', error);
        process.exit(1);
    }
};
export const disconnectDB = async () => {
    try {
        await mongoose.disconnect();
        logger.info('✅ MongoDB Disconnected');
    }
    catch (error) {
        logger.error('❌ MongoDB Disconnection Error:', error);
    }
};
export default mongoose;
