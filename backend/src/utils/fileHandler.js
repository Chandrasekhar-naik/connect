import path from 'path';
import fs from 'fs';
export const createUploadDir = (userId) => {
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    const userDir = path.join(uploadDir, userId);
    if (!fs.existsSync(userDir)) {
        fs.mkdirSync(userDir, { recursive: true });
    }
    return userDir;
};
export const deleteFile = (filePath) => {
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            return true;
        }
        return false;
    }
    catch (error) {
        return false;
    }
};
export const getFileUrl = (userId, filename) => {
    return `/uploads/${userId}/${filename}`;
};
export const getFilePath = (userId, filename) => {
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    return path.join(uploadDir, userId, filename);
};
export const getFileSize = (filePath) => {
    try {
        const stats = fs.statSync(filePath);
        return stats.size;
    }
    catch {
        return 0;
    }
};
