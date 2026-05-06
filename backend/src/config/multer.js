import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
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
const fileFilter = (req, file, cb) => {
    const allowedMimes = process.env.ALLOWED_FILE_TYPES?.split(',') || [
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/pdf',
        'text/plain'
    ];
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error(`Invalid file type: ${file.mimetype}`));
    }
};
export const upload = multer({
    storage,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10) // 5MB
    },
    fileFilter
});
export const uploadSingle = upload.single('file');
export const uploadMultiple = upload.array('files', 5);
