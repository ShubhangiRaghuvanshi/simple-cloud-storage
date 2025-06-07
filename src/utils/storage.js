const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Generate a unique storage key for a file
const generateStorageKey = (file) => {
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const extension = path.extname(file.originalname);
    return `${timestamp}-${randomString}${extension}`;
};

// Upload a file to storage
const uploadToStorage = async (file, targetDir = '') => {
    try {
        const storageKey = generateStorageKey(file);
        const targetPath = path.join(uploadDir, targetDir, storageKey);

        // Ensure the target directory exists
        const targetDirPath = path.dirname(targetPath);
        if (!fs.existsSync(targetDirPath)) {
            fs.mkdirSync(targetDirPath, { recursive: true });
        }

        // Move the file from temp location to storage
        await fs.promises.rename(file.path, targetPath);

        return storageKey;
    } catch (error) {
        console.error('Error uploading file to storage:', error);
        throw new Error('Failed to upload file to storage');
    }
};

// Delete a file from storage
const deleteFromStorage = async (storageKey, targetDir = '') => {
    try {
        const filePath = path.join(uploadDir, targetDir, storageKey);
        
        // Check if file exists
        if (fs.existsSync(filePath)) {
            await fs.promises.unlink(filePath);
        }
    } catch (error) {
        console.error('Error deleting file from storage:', error);
        throw new Error('Failed to delete file from storage');
    }
};

// Get file stream from storage
const getFileStream = (storageKey, targetDir = '') => {
    const filePath = path.join(uploadDir, targetDir, storageKey);
    
    if (!fs.existsSync(filePath)) {
        throw new Error('File not found in storage');
    }

    return fs.createReadStream(filePath);
};

// Get file stats from storage
const getFileStats = async (storageKey, targetDir = '') => {
    try {
        const filePath = path.join(uploadDir, targetDir, storageKey);
        
        if (!fs.existsSync(filePath)) {
            throw new Error('File not found in storage');
        }

        return await fs.promises.stat(filePath);
    } catch (error) {
        console.error('Error getting file stats:', error);
        throw new Error('Failed to get file stats');
    }
};

module.exports = {
    uploadToStorage,
    deleteFromStorage,
    getFileStream,
    getFileStats
}; 