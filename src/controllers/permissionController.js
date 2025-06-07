const Permission = require('../models/Permission');
const User = require('../models/User');


const setPermissions = async (req, res) => {
    try {
        const { path, accessType, sharedWith } = req.body;
        const userId = req.user.userId;

        console.log('Setting permissions for path:', path);
        console.log('User ID:', userId);
        console.log('Request body:', req.body);
        console.log('User object:', req.user);

        if (!path) {
            return res.status(400).json({ error: 'Path is required' });
        }

        if (!userId) {
            console.error('No user ID found in request');
            return res.status(401).json({ error: 'Authentication required' });
        }

        // Verify user exists
        const user = await User.findById(userId);
        if (!user) {
            console.error('User not found:', userId);
            return res.status(404).json({ error: 'User not found' });
        }

        console.log('Found user:', user._id);

        // Check if permission already exists
        let permission = await Permission.findOne({ path });
        console.log('Existing permission:', permission);

        const permissionData = {
            path,
            owner: userId,
            accessType: accessType || 'private',
            sharedWith: []
        };

        // Handle shared users if provided
        if (sharedWith && Array.isArray(sharedWith)) {
            for (const share of sharedWith) {
                const sharedUser = await User.findOne({ email: share.email });
                if (sharedUser) {
                    permissionData.sharedWith.push({
                        user: sharedUser._id,
                        permissions: share.permissions
                    });
                }
            }
        }

        console.log('Permission data to save:', permissionData);

        // Update or create permission
        try {
            permission = await Permission.findOneAndUpdate(
                { path },
                { $set: permissionData },
                { 
                    new: true, 
                    upsert: true,
                    runValidators: true,
                    setDefaultsOnInsert: true
                }
            ).populate('owner', 'username email');

            console.log('Updated permission:', permission);

            // Verify owner was set
            if (!permission.owner) {
                console.error('Failed to set owner for permission:', permission);
                return res.status(500).json({ error: 'Failed to set permission owner' });
            }

            res.json(permission);
        } catch (updateError) {
            console.error('Error updating permission:', updateError);
            return res.status(500).json({ 
                error: 'Error updating permission',
                details: updateError.message 
            });
        }
    } catch (error) {
        console.error('Error setting permissions:', error);
        res.status(500).json({ error: 'Error setting permissions' });
    }
};


const getPermissions = async (req, res) => {
    try {
        const { path } = req.query;
        const userId = req.user.userId;

        console.log('Getting permissions for path:', path);
        console.log('User ID:', userId);

        if (!path) {
            return res.status(400).json({ error: 'Path is required' });
        }

        const permission = await Permission.findOne({ path }).populate('owner', 'email name');
        console.log('Found permission:', permission);

        if (!permission) {
            return res.status(404).json({ error: 'Permissions not found for this path' });
        }

        // Check if the permission has an owner
        if (!permission.owner) {
            console.error('Permission found but owner is missing:', permission);
            return res.status(500).json({ error: 'Invalid permission: missing owner' });
        }

        console.log('Permission owner:', permission.owner);
        console.log('Owner ID:', permission.owner._id);
        console.log('User ID:', userId);

        // Check if the current user is the owner
        if (!permission.owner._id) {
            console.error('Owner ID is missing:', permission.owner);
            return res.status(500).json({ error: 'Invalid permission: owner ID is missing' });
        }

        if (permission.owner._id.toString() !== userId) {
            return res.status(403).json({ error: 'You do not have permission to view these details' });
        }

        // Populate shared users
        await permission.populate('sharedWith.user', 'email name');

        res.json({
            permission: permission
        });
    } catch (err) {
        console.error('Error in getPermissions:', err);
        console.error('Error stack:', err.stack);
        res.status(500).json({ error: 'Error retrieving permissions', details: err.message });
    }
};


const removeAccess = async (req, res) => {
    try {
        const { path, userId } = req.body;
        const currentUserId = req.user.userId;

        if (!path || !userId) {
            return res.status(400).json({ error: 'Path and userId are required' });
        }

        const permission = await Permission.findOne({ path });
        if (!permission) {
            return res.status(404).json({ error: 'Permissions not found for this path' });
        }

        if (permission.owner.toString() !== currentUserId) {
            return res.status(403).json({ error: 'You do not have permission to modify this item' });
        }

        permission.sharedWith = permission.sharedWith.filter(
            share => share.user.toString() !== userId
        );

        await permission.save();

        res.json({
            message: 'Access removed successfully',
            permission: permission
        });
    } catch (err) {
        res.status(500).json({ error: 'Error removing access', details: err.message });
    }
};


const getSharedItems = async (req, res) => {
    try {
        const userId = req.user.userId;

        const permissions = await Permission.find({
            'sharedWith.user': userId
        }).populate('owner', 'email name');

        res.json({
            sharedItems: permissions
        });
    } catch (err) {
        res.status(500).json({ error: 'Error retrieving shared items', details: err.message });
    }
};

module.exports = {
    setPermissions,
    getPermissions,
    removeAccess,
    getSharedItems
}; 