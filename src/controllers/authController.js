const jwt = require('jsonwebtoken');
const User = require('../models/User');


const register = async (req, res) => {
    try {
        const { username, email, password } = req.body;

       
        const existingUser = await User.findOne({ 
            $or: [{ email }, { username }] 
        });

        if (existingUser) {
            return res.status(400).json({ 
                error: 'User with this email or username already exists' 
            });
        }

     
        const user = new User({
            username,
            email,
            password
        });

        await user.save();

       
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Error registering user' });
    }
};


const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log('Login attempt for email:', email);

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            console.log('User not found:', email);
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            console.log('Invalid password for user:', email);
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        console.log('Generated token for user:', user._id);

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Error logging in' });
    }
};


const getProfile = async (req, res) => {
    try {
        console.log('Getting profile for user ID:', req.user.userId);
        const user = await User.findById(req.user.userId).select('-password');
        console.log('Found user:', user);
        if (!user) {
            console.log('User not found with ID:', req.user.userId);
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        console.error('Error in getProfile:', error);
        res.status(500).json({ error: 'Error fetching profile' });
    }
};


const updateProfile = async (req, res) => {
    try {
        const { username, email } = req.body;
        const user = await User.findById(req.user.userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

     
        if (username !== user.username || email !== user.email) {
            const existingUser = await User.findOne({
                $or: [
                    { username, _id: { $ne: user._id } },
                    { email, _id: { $ne: user._id } }
                ]
            });

            if (existingUser) {
                return res.status(400).json({ 
                    error: 'Username or email already taken' 
                });
            }
        }

        user.username = username || user.username;
        user.email = email || user.email;

        await user.save();

        res.json({
            message: 'Profile updated successfully',
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Error updating profile' });
    }
};

module.exports = {
    register,
    login,
    getProfile,
    updateProfile
}; 