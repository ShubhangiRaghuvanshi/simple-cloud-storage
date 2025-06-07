const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    path: {
        type: String,
        required: true,
        index: true
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
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    currentVersion: {
        type: Number,
        default: 1
    },
    totalVersions: {
        type: Number,
        default: 1
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    metadata: {
        type: Map,
        of: mongoose.Schema.Types.Mixed,
        default: new Map()
    }
});

// Update the updatedAt timestamp before saving
fileSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Method to get file versions
fileSchema.methods.getVersions = async function() {
    const FileVersion = mongoose.model('FileVersion');
    return FileVersion.find({ fileId: this._id })
        .sort({ version: -1 })
        .populate('createdBy', 'username email');
};

// Method to get a specific version
fileSchema.methods.getVersion = async function(versionNumber) {
    const FileVersion = mongoose.model('FileVersion');
    return FileVersion.findOne({ 
        fileId: this._id,
        version: versionNumber
    }).populate('createdBy', 'username email');
};

const File = mongoose.model('File', fileSchema);

module.exports = File; 