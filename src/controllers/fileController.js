const fs = require('fs');
const path = require('path');
const Permission = require('../models/Permission');
const File = require('../models/File');
const FileVersion = require('../models/FileVersion');
const { uploadToStorage, deleteFromStorage, getFileStream, getFileStats } = require('../utils/storage');

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const getFullPath = (relativePath) => {
    // First decode any URL-encoded characters
    const decodedPath = decodeURIComponent(relativePath);
    // Replace any remaining backslashes with forward slashes
    const normalizedPath = decodedPath.replace(/\\/g, '/');
    // Join with upload directory using platform-specific separator
    return path.join(uploadDir, normalizedPath);
};

const ensureDirectoryExists = (dirPath) => {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
};

// Check if user has permission to access a path
const checkPermission = async (userId, path, requiredPermission = 'read') => {
    return await Permission.checkAccess(userId, path, requiredPermission);
};

// Add this function before getAllFiles
const cleanupOrphanedRecords = async (userId) => {
    try {
        // Get all files from database for this user
        const dbFiles = await File.find({ owner: userId });
        console.log('Checking for orphaned records:', {
            totalFiles: dbFiles.length
        });

        for (const file of dbFiles) {
            const fullPath = getFullPath(file.path);
            const exists = fs.existsSync(fullPath);
            
            console.log('Checking file existence:', {
                path: file.path,
                fullPath,
                exists
            });

            if (!exists) {
                console.log('Found orphaned record, deleting:', {
                    path: file.path,
                    id: file._id
                });
                
                // Delete all versions
                await FileVersion.deleteMany({ fileId: file._id });
                // Delete the file record
                await File.deleteOne({ _id: file._id });
            }
        }
    } catch (error) {
        console.error('Error cleaning up orphaned records:', error);
    }
};

// Add this helper function at the top of the file
const normalizePathForComparison = (path) => {
    return path.replace(/\\/g, '/').replace(/\/+/g, '/');
};

// Add this function before getAllFiles
const forceDeleteFile = async (filePath) => {
    try {
        // Normalize the path
        const normalizedPath = normalizePathForComparison(filePath);
        console.log('Force deleting file:', {
            originalPath: filePath,
            normalizedPath
        });

        // Find the file in database
        const file = await File.findOne({ path: normalizedPath });
        if (file) {
            console.log('Found file in database:', {
                id: file._id,
                path: file.path,
                storageKey: file.storageKey
            });

            // Delete all versions
            await FileVersion.deleteMany({ fileId: file._id });
            console.log('Deleted file versions');

            // Delete the file record
            await File.deleteOne({ _id: file._id });
            console.log('Deleted file record');
        } else {
            console.log('File not found in database');
        }

        // Delete the physical file
        const fullPath = getFullPath(filePath);
        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
            console.log('Deleted physical file:', fullPath);
        } else {
            console.log('Physical file not found:', fullPath);
        }
    } catch (error) {
        console.error('Error force deleting file:', error);
    }
};

const getAllFiles = async (req, res) => {
    try {
        // Normalize the path from the request
        const currentPath = normalizePathForComparison(req.query.path || '');
        const searchQuery = req.query.search || '';
        const searchType = req.query.searchType || 'all';
        const metadataQuery = req.query.metadata || {};
        const fullPath = getFullPath(currentPath);
        const userId = req.user.userId;

        console.log('Listing files - Request details:', {
            currentPath,
            fullPath,
            userId,
            searchQuery,
            searchType
        });

        // Force delete the problematic file
        const problematicFile = 'directory1/sub_dir1/sub_dir_1/1749227041720-04e7f0414882db80.pdf';
        await forceDeleteFile(problematicFile);

        // Clean up any orphaned records before listing files
        await cleanupOrphanedRecords(userId);

        // Check if user has access to this path
        const hasAccess = await checkPermission(userId, currentPath);
        console.log('Permission check result:', { hasAccess, path: currentPath });
        
        if (!hasAccess) {
            return res.status(403).json({ error: 'You do not have permission to access this directory' });
        }

        if (!fs.existsSync(fullPath)) {
            console.log('Directory not found:', fullPath);
            return res.status(404).json({ error: 'Directory not found' });
        }

        // Get files from database for metadata search
        let dbFiles = [];
        if (searchType === 'metadata' || searchType === 'all') {
            const searchCriteria = { owner: userId };
            if (Object.keys(metadataQuery).length > 0) {
                const metadataSearch = {};
                Object.entries(metadataQuery).forEach(([key, value]) => {
                    metadataSearch[`metadata.${key}`] = value;
                });
                searchCriteria.$and = [metadataSearch];
            }
            dbFiles = await File.find(searchCriteria);
            console.log('Database files found:', {
                count: dbFiles.length,
                files: dbFiles.map(f => ({
                    path: f.path,
                    name: f.name,
                    owner: f.owner.toString()
                }))
            });
        }

        fs.readdir(fullPath, { withFileTypes: true }, async (err, items) => {
            if (err) {
                console.error('Error reading directory:', err);
                return res.status(500).json({ error: 'Error reading directory' });
            }

            console.log('Directory contents:', {
                path: fullPath,
                itemCount: items.length,
                items: items.map(item => ({
                    name: item.name,
                    isDirectory: item.isDirectory(),
                    isFile: item.isFile()
                }))
            });

            const contents = await Promise.all(items.map(async item => {
                // Normalize path to use forward slashes for consistency
                const itemPath = normalizePathForComparison(path.join(currentPath, item.name));
                const itemFullPath = path.join(fullPath, item.name);
                
                // Check if file actually exists
                const exists = fs.existsSync(itemFullPath);
                console.log('File existence check:', {
                    name: item.name,
                    path: itemPath,
                    fullPath: itemFullPath,
                    exists
                });

                if (!exists) {
                    console.log('File does not exist, skipping:', itemPath);
                    return null;
                }

                const stats = fs.statSync(itemFullPath);
                const hasAccess = await checkPermission(userId, itemPath);
                
                // Find matching database record for metadata
                const dbFile = dbFiles.find(f => {
                    // Normalize database path for comparison
                    const normalizedDbPath = normalizePathForComparison(f.path);
                    console.log('Comparing paths:', {
                        itemPath,
                        normalizedDbPath,
                        matches: normalizedDbPath === itemPath
                    });
                    return normalizedDbPath === itemPath;
                });

                console.log('Processing item:', {
                    name: item.name,
                    path: itemPath,
                    hasAccess,
                    hasDbRecord: !!dbFile,
                    dbPath: dbFile?.path
                });
                
                return {
                    name: item.name,
                    path: itemPath,
                    type: item.isDirectory() ? 'directory' : 'file',
                    size: stats.size,
                    created: stats.birthtime,
                    modified: stats.mtime,
                    extension: item.isFile() ? path.extname(item.name).toLowerCase() : null,
                    isDirectory: item.isDirectory(),
                    hasAccess,
                    metadata: dbFile ? Object.fromEntries(dbFile.metadata) : {},
                    currentVersion: dbFile ? dbFile.currentVersion : null,
                    totalVersions: dbFile ? dbFile.totalVersions : null
                };
            }));

            // Filter out null items (files that don't exist)
            let filteredContents = contents.filter(item => item !== null);

            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                filteredContents = filteredContents.filter(item => {
                    if (searchType === 'name' || searchType === 'all') {
                        const nameMatch = item.name.toLowerCase().includes(query);
                        const extensionMatch = item.extension && item.extension.toLowerCase().includes(query);
                        const typeMatch = item.type.toLowerCase().includes(query);
                        if (nameMatch || extensionMatch || typeMatch) return true;
                    }
                    
                    if (searchType === 'metadata' || searchType === 'all') {
                        // Search in metadata
                        return Object.entries(item.metadata).some(([key, value]) => {
                            if (typeof value === 'string') {
                                return value.toLowerCase().includes(query);
                            }
                            return String(value).toLowerCase().includes(query);
                        });
                    }
                    
                    return false;
                });
            }

            // Sort contents
            filteredContents.sort((a, b) => {
                // First by type (directories first)
                if (a.isDirectory && !b.isDirectory) return -1;
                if (!a.isDirectory && b.isDirectory) return 1;
                
                // Then by name
                return a.name.localeCompare(b.name);
            });

            console.log('Final response:', {
                currentPath,
                totalItems: filteredContents.length,
                contents: filteredContents.map(item => ({
                    name: item.name,
                    path: item.path,
                    type: item.type
                }))
            });

            res.json({
                currentPath: currentPath,
                searchQuery: searchQuery,
                searchType: searchType,
                metadataQuery: metadataQuery,
                totalItems: filteredContents.length,
                contents: filteredContents
            });
        });
    } catch (err) {
        console.error('Error in getAllFiles:', err);
        res.status(500).json({ error: 'Error listing files', details: err.message });
    }
};

const createDirectory = async (req, res) => {
    try {
        const { path: dirPath, name } = req.body;
        const userId = req.user.userId;
        const fullPath = getFullPath(path.join(dirPath || '', name));

        // Check if user has write permission to parent directory
        const hasAccess = await checkPermission(userId, dirPath, 'write');
        if (!hasAccess) {
            return res.status(403).json({ error: 'You do not have permission to create directories here' });
        }

        if (!name) {
            return res.status(400).json({ error: 'Directory name is required' });
        }

        if (fs.existsSync(fullPath)) {
            return res.status(400).json({ error: 'Directory already exists' });
        }

        fs.mkdirSync(fullPath, { recursive: true });

        // Create permission entry for new directory
        await Permission.create({
            path: path.join(dirPath || '', name),
            owner: userId,
            accessType: 'private'
        });

        res.json({
            message: 'Directory created successfully',
            directory: {
                name,
                path: path.join(dirPath || '', name)
            }
        });
    } catch (err) {
        res.status(500).json({ error: 'Error creating directory', details: err.message });
    }
};

const uploadFile = async (req, res) => {
    try {
        const { path: filePath } = req.body;
        const file = req.file;
        const userId = req.user.id;

        console.log('Upload request details:', {
            filePath,
            fileName: file?.originalname,
            userId
        });

        if (!file) {
            return res.status(400).json({ error: 'No file provided' });
        }

        if (!filePath) {
            return res.status(400).json({ error: 'File path is required' });
        }

        // Normalize path for storage and include filename
        const normalizedPath = path.join(filePath, file.originalname).replace(/\\/g, '/');
        
        console.log('Path details:', {
            originalPath: filePath,
            fileName: file.originalname,
            normalizedPath
        });

        // Upload to storage with target directory
        const storageKey = await uploadToStorage(file, filePath);

        // Check if file already exists
        let existingFile = await File.findOne({ path: normalizedPath });
        console.log('Existing file check:', {
            searchPath: normalizedPath,
            found: !!existingFile
        });

        let version = 1;

        if (existingFile) {
            // Get the latest version number
            const latestVersion = await FileVersion.findOne({ fileId: existingFile._id })
                .sort({ version: -1 })
                .select('version');
            
            version = latestVersion ? latestVersion.version + 1 : existingFile.currentVersion + 1;
            
            // Create version record for the previous version
            const fileVersion = new FileVersion({
                fileId: existingFile._id,
                version: existingFile.currentVersion,
                path: normalizedPath,
                size: existingFile.size,
                mimeType: existingFile.mimeType,
                storageKey: existingFile.storageKey,
                createdBy: existingFile.owner,
                metadata: existingFile.metadata
            });

            try {
                await fileVersion.save();
            } catch (error) {
                // If version already exists, skip creating it
                if (error.code === 11000) {
                    console.log('Version record already exists, skipping creation');
                } else {
                    throw error;
                }
            }

            // Update existing file
            existingFile.currentVersion = version;
            existingFile.totalVersions = version;
            existingFile.size = file.size;
            existingFile.mimeType = file.mimetype;
            existingFile.storageKey = storageKey;
            existingFile.updatedAt = Date.now();
            await existingFile.save();

            console.log('Updated existing file:', {
                path: existingFile.path,
                version: existingFile.currentVersion
            });

            return res.json({
                message: 'File version created successfully',
                file: existingFile,
                version
            });
        }

        // Create new file
        const newFile = new File({
            name: file.originalname,
            path: normalizedPath,
            size: file.size,
            mimeType: file.mimetype,
            storageKey,
            owner: userId,
            currentVersion: version,
            totalVersions: version
        });

        await newFile.save();

        console.log('Created new file:', {
            path: newFile.path,
            version: newFile.currentVersion
        });

        // Create initial version
        const fileVersion = new FileVersion({
            fileId: newFile._id,
            version,
            path: normalizedPath,
            size: file.size,
            mimeType: file.mimetype,
            storageKey,
            createdBy: userId
        });

        try {
            await fileVersion.save();
        } catch (error) {
            // If version already exists, skip creating it
            if (error.code === 11000) {
                console.log('Version record already exists, skipping creation');
            } else {
                throw error;
            }
        }

        res.status(201).json({
            message: 'File uploaded successfully',
            file: newFile,
            version
        });
    } catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).json({ error: 'Error uploading file' });
    }
};

const downloadFile = async (req, res) => {
    try {
        const { path: filePath } = req.query;
        const userId = req.user.id;

        console.log('Download request received:', {
            query: req.query,
            params: req.params,
            headers: req.headers,
            user: req.user
        });

        if (!filePath) {
            console.log('No file path provided');
            return res.status(400).json({ error: 'File path is required' });
        }

        // Normalize path for lookup
        const normalizedPath = filePath.replace(/\\/g, '/');

        console.log('Downloading file:', { filePath: normalizedPath, userId });

        const file = await File.findOne({ path: normalizedPath });
        if (!file) {
            console.log('File not found:', normalizedPath);
            return res.status(404).json({ error: 'File not found' });
        }

        // Check permissions
        if (file.owner.toString() !== userId) {
            console.log('Permission denied:', { fileOwner: file.owner, userId });
            return res.status(403).json({ error: 'Permission denied' });
        }

        try {
            // Get file stream
            const fileStream = getFileStream(file.storageKey);
            
            // Set appropriate headers
            res.setHeader('Content-Type', file.mimeType);
            res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.name)}"`);
            res.setHeader('Content-Length', file.size);
            
            // Handle stream errors
            fileStream.on('error', (error) => {
                console.error('Stream error:', error);
                if (!res.headersSent) {
                    res.status(500).json({ error: 'Error streaming file' });
                }
            });

            // Pipe the file to the response
            fileStream.pipe(res);
        } catch (error) {
            console.error('Error getting file stream:', error);
            if (!res.headersSent) {
                res.status(500).json({ error: 'Error accessing file' });
            }
        }
    } catch (error) {
        console.error('Error downloading file:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Error downloading file' });
        }
    }
};

const deleteItem = async (req, res) => {
    try {
        const { path: filePath } = req.query;
        const userId = req.user.id;

        // Normalize path for lookup
        const normalizedPath = filePath.replace(/\\/g, '/');

        const file = await File.findOne({ path: normalizedPath });
        if (!file) {
            return res.status(404).json({ error: 'File not found' });
        }

        // Check permissions
        if (file.owner.toString() !== userId) {
            return res.status(403).json({ error: 'Permission denied' });
        }

        // Delete all versions
        const versions = await FileVersion.find({ fileId: file._id });
        for (const version of versions) {
            await deleteFromStorage(version.storageKey);
            await FileVersion.deleteOne({ _id: version._id });
        }

        // Delete the file record
        await File.deleteOne({ _id: file._id });

        res.json({ message: 'File deleted successfully' });
    } catch (error) {
        console.error('Error deleting file:', error);
        res.status(500).json({ error: 'Error deleting file' });
    }
};

// Get file versions
const getFileVersions = async (req, res) => {
    try {
        const { path: filePath } = req.query;
        const userId = req.user.id;

        // Normalize path for lookup
        const normalizedPath = filePath.replace(/\\/g, '/');

        console.log('Getting versions:', { filePath: normalizedPath, userId });

        const file = await File.findOne({ path: normalizedPath });
        if (!file) {
            console.log('File not found:', normalizedPath);
            return res.status(404).json({ error: 'File not found' });
        }

        // Check permissions
        if (file.owner.toString() !== userId) {
            console.log('Permission denied:', { fileOwner: file.owner, userId });
            return res.status(403).json({ error: 'Permission denied' });
        }

        const versions = await file.getVersions();
        console.log('Found versions:', { count: versions.length });
        res.json({ versions });
    } catch (error) {
        console.error('Error getting file versions:', error);
        res.status(500).json({ error: 'Error getting file versions' });
    }
};

// Get specific version
const getFileVersion = async (req, res) => {
    try {
        const { path: filePath } = req.query;
        const { version } = req.params;
        const userId = req.user.id;

        const file = await File.findOne({ path: filePath });
        if (!file) {
            return res.status(404).json({ error: 'File not found' });
        }

        // Check permissions
        if (file.owner.toString() !== userId) {
            return res.status(403).json({ error: 'Permission denied' });
        }

        const fileVersion = await file.getVersion(version);
        if (!fileVersion) {
            return res.status(404).json({ error: 'Version not found' });
        }

        res.json({ version: fileVersion });
    } catch (error) {
        console.error('Error getting file version:', error);
        res.status(500).json({ error: 'Error getting file version' });
    }
};

// Rollback to previous version
const rollbackVersion = async (req, res) => {
    try {
        const { path: filePath } = req.query;
        const { version } = req.params;
        const userId = req.user.id;

        console.log('Rollback request:', { filePath, version, userId });

        const file = await File.findOne({ path: filePath });
        if (!file) {
            console.log('File not found:', filePath);
            return res.status(404).json({ error: 'File not found' });
        }

        console.log('Current file state:', {
            currentVersion: file.currentVersion,
            totalVersions: file.totalVersions,
            storageKey: file.storageKey
        });

        // Check permissions
        if (file.owner.toString() !== userId) {
            console.log('Permission denied:', { fileOwner: file.owner, userId });
            return res.status(403).json({ error: 'Permission denied' });
        }

        const fileVersion = await file.getVersion(version);
        if (!fileVersion) {
            console.log('Version not found:', version);
            return res.status(404).json({ error: 'Version not found' });
        }

        console.log('Found version:', {
            version: fileVersion.version,
            size: fileVersion.size,
            storageKey: fileVersion.storageKey
        });

        // Store the old storage key for cleanup
        const oldStorageKey = file.storageKey;

        // Update file with version info
        file.size = fileVersion.size;
        file.mimeType = fileVersion.mimeType;
        file.storageKey = fileVersion.storageKey;
        file.currentVersion = parseInt(version);
        file.updatedAt = Date.now();
        await file.save();

        // Delete the old file if it's different from the version we're rolling back to
        if (oldStorageKey !== fileVersion.storageKey) {
            try {
                await deleteFromStorage(oldStorageKey);
                console.log('Deleted old file:', oldStorageKey);
            } catch (error) {
                console.error('Error deleting old file:', error);
                // Continue even if deletion fails
            }
        }

        console.log('Updated file state:', {
            currentVersion: file.currentVersion,
            totalVersions: file.totalVersions,
            size: file.size,
            storageKey: file.storageKey
        });

        res.json({
            message: 'Rollback successful',
            file: {
                ...file.toObject(),
                currentVersion: parseInt(version),
                totalVersions: file.totalVersions
            },
            version: {
                ...fileVersion.toObject(),
                version: parseInt(version)
            }
        });
    } catch (error) {
        console.error('Error rolling back version:', error);
        res.status(500).json({ error: 'Error rolling back version' });
    }
};

// Delete a specific version
const deleteVersion = async (req, res) => {
    try {
        const { path: filePath } = req.query;
        const { version } = req.params;
        const userId = req.user.id;

        const file = await File.findOne({ path: filePath });
        if (!file) {
            return res.status(404).json({ error: 'File not found' });
        }

        // Check permissions
        if (file.owner.toString() !== userId) {
            return res.status(403).json({ error: 'Permission denied' });
        }

        const fileVersion = await file.getVersion(version);
        if (!fileVersion) {
            return res.status(404).json({ error: 'Version not found' });
        }

        // Don't allow deleting the current version
        if (fileVersion.version === file.currentVersion) {
            return res.status(400).json({ error: 'Cannot delete current version' });
        }

        // Delete version from storage if it's not the current version
        await deleteFromStorage(fileVersion.storageKey);

        // Delete version record
        await FileVersion.deleteOne({ _id: fileVersion._id });

        res.json({ message: 'Version deleted successfully' });
    } catch (error) {
        console.error('Error deleting version:', error);
        res.status(500).json({ error: 'Error deleting version' });
    }
};

// Update file metadata
const updateMetadata = async (req, res) => {
    try {
        const { path: filePath } = req.query;
        const { metadata } = req.body;
        const userId = req.user.id;

        console.log('Updating metadata:', { filePath, metadata, userId });

        const file = await File.findOne({ path: filePath });
        if (!file) {
            console.log('File not found:', filePath);
            return res.status(404).json({ error: 'File not found' });
        }

        // Check permissions
        if (file.owner.toString() !== userId) {
            console.log('Permission denied:', { fileOwner: file.owner, userId });
            return res.status(403).json({ error: 'Permission denied' });
        }

        // Update metadata
        if (metadata) {
            // Convert metadata object to Map
            const metadataMap = new Map(Object.entries(metadata));
            file.metadata = metadataMap;
            await file.save();
        }

        console.log('Metadata updated successfully:', {
            filePath,
            metadata: Object.fromEntries(file.metadata)
        });

        res.json({
            message: 'Metadata updated successfully',
            file: {
                ...file.toObject(),
                metadata: Object.fromEntries(file.metadata)
            }
        });
    } catch (error) {
        console.error('Error updating metadata:', error);
        res.status(500).json({ error: 'Error updating metadata' });
    }
};

// Get file metadata
const getMetadata = async (req, res) => {
    try {
        const { path: filePath } = req.query;
        const userId = req.user.id;

        // Normalize path for lookup
        const normalizedPath = filePath.replace(/\\/g, '/');

        console.log('Getting metadata:', { filePath: normalizedPath, userId });

        const file = await File.findOne({ path: normalizedPath });
        if (!file) {
            console.log('File not found:', normalizedPath);
            return res.status(404).json({ error: 'File not found' });
        }

        // Check permissions
        if (file.owner.toString() !== userId) {
            console.log('Permission denied:', { fileOwner: file.owner, userId });
            return res.status(403).json({ error: 'Permission denied' });
        }

        res.json({
            metadata: Object.fromEntries(file.metadata)
        });
    } catch (error) {
        console.error('Error getting metadata:', error);
        res.status(500).json({ error: 'Error getting metadata' });
    }
};

// Search files by metadata
const searchByMetadata = async (req, res) => {
    try {
        const  query  = req.query;
        const userId = req.user.id;

        console.log('Searching by metadata:', { query, userId });

        // Convert query object to metadata search criteria
        const searchCriteria = {};
        if (query) {
            const metadataQuery = {};
            Object.entries(query).forEach(([key, value]) => {
                metadataQuery[`metadata.${key}`] = value;
            });
            searchCriteria.$and = [
                { owner: userId },
                metadataQuery
            ];
        } else {
            searchCriteria.owner = userId;
        } 

        const files = await File.find(searchCriteria);
        
        console.log('Search results:', {
            criteria: searchCriteria,
            count: files.length
        });

        res.json({
            files: files.map(file => ({
                ...file.toObject(),
                metadata: Object.fromEntries(file.metadata)
            }))
        });
    } catch (error) {
        console.error('Error searching by metadata:', error);
        res.status(500).json({ error: 'Error searching by metadata' });
    }
};

module.exports = {
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
}; 