const express = require('express');
const router = express.Router();
const {
  setPermissions,
  getPermissions,
  removeAccess,
  getSharedItems
} = require('../controllers/permissionController');

const auth = require('../middleware/auth');

// 🔐 Apply authentication to all routes
router.use(auth);

// Set permissions for a file or directory
router.post('/set', setPermissions);

// Get permissions for a file or directory
router.get('/get', getPermissions);

// Remove access for a user
router.delete('/remove', removeAccess);

// Get all items shared with the current user
router.get('/shared', getSharedItems);

module.exports = router;
