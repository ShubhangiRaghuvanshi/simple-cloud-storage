const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
    getAllFiles,
    createDirectory,
    uploadFile,
    downloadFile,
    deleteItem,
    getFileVersions,
    getFileVersion,
    rollbackVersion,
    deleteVersion,
    updateMetadata,
    getMetadata,
    searchByMetadata
} = require('../controllers/fileController');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../../uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        console.log('Upload directory:', uploadDir);
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const timestamp = Date.now();
        const randomString = Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        cb(null, `${timestamp}-${randomString}${extension}`);
    }
});

// File filter to accept all file types
const fileFilter = (req, file, cb) => {
    console.log('Processing file:', file.originalname);
    cb(null, true);
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// Routes
router.get('/', getAllFiles);

// Create new directory
router.post('/directories', createDirectory);

// Upload file
router.post('/upload', upload.single('file'), uploadFile);

// Download file
router.get('/download', downloadFile);

// Delete file or directory
router.delete('/', deleteItem);

// Versioning operations
router.get('/versions', getFileVersions);
router.get('/versions/:version', getFileVersion);
router.post('/versions/:version/rollback', rollbackVersion);
router.delete('/versions/:version', deleteVersion);

// Metadata routes
router.patch('/metadata', updateMetadata);
router.get('/metadata', getMetadata);
router.get('/search', searchByMetadata);

module.exports = router; 