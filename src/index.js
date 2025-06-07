const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const fileRoutes = require('./routes/fileRoutes');
const authRoutes = require('./routes/authRoutes');
const permissionRoutes = require('./routes/permissionRoutes');
const auth = require('./middleware/auth');

const app = express();

// Use default local MongoDB URI if not set in environment
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/simple-cloud-storage';

mongoose.connect(MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));


app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));


app.use('/api/auth', authRoutes);
app.use('/api/files', auth, fileRoutes);
app.use('/api/permissions', permissionRoutes);


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 