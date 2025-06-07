const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema({
    path: {
        type: String,
        required: true,
        index: true
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    accessType: {
        type: String,
        enum: ['private', 'public', 'shared'],
        default: 'private'
    },
    sharedWith: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        permissions: {
            read: { type: Boolean, default: false },
            write: { type: Boolean, default: false },
            delete: { type: Boolean, default: false }
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Ensure owner is set before saving
permissionSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    if (!this.owner) {
        next(new Error('Owner is required'));
    }
    next();
});

// Ensure owner is set before updating
permissionSchema.pre('findOneAndUpdate', function(next) {
    this.set({ updatedAt: Date.now() });
    if (!this.getUpdate().$set.owner) {
        next(new Error('Owner is required'));
    }
    next();
});

permissionSchema.statics.checkAccess = async function(userId, path, requiredPermission = 'read') {
    const permission = await this.findOne({ path });
    
    if (!permission) {
        return false;
    }

    // Owner has full access
    if (permission.owner.toString() === userId.toString()) {
        return true;
    }

    // Public access
    if (permission.accessType === 'public') {
        return true;
    }

    // Shared access
    if (permission.accessType === 'shared') {
        const sharedUser = permission.sharedWith.find(share => 
            share.user.toString() === userId.toString()
        );
        
        if (sharedUser) {
            return sharedUser.permissions[requiredPermission];
        }
    }

    return false;
};

// Method to get all paths a user has access to
permissionSchema.statics.getUserAccessiblePaths = async function(userId) {
    const permissions = await this.find({
        $or: [
            { owner: userId },
            { accessType: 'public' },
            { 'sharedWith.user': userId }
        ]
    });
    
    return permissions.map(p => p.path);
};

const Permission = mongoose.model('Permission', permissionSchema);

module.exports = Permission; 