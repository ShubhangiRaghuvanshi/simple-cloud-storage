const mongoose = require('mongoose');

const fileVersionSchema = new mongoose.Schema({
    fileId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'File',
        required: true,
        index: true
    },
    version: {
        type: Number,
        required: true
    },
    path: {
        type: String,
        required: true
    },
    size: {
        type: Number,
        required: true
    },
    mimeType: {
        type: String,
        required: true
    },
    storageKey: {
        type: String,
        required: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    metadata: {
        type: Map,
        of: mongoose.Schema.Types.Mixed,
        default: new Map()
    }
});

// Compound index to ensure unique versions per file
fileVersionSchema.index({ fileId: 1, version: 1 }, { unique: true });

// Method to get the latest version number for a file
fileVersionSchema.statics.getLatestVersion = async function(fileId) {
    const latestVersion = await this.findOne({ fileId })
        .sort({ version: -1 })
        .select('version');
    return latestVersion ? latestVersion.version : 0;
};

const FileVersion = mongoose.model('FileVersion', fileVersionSchema);

module.exports = FileVersion; 