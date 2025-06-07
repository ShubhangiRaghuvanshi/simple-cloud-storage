const jwt = require('jsonwebtoken');

const auth = async (req, res, next) => {
    try {
        // Log the entire request headers for debugging
        console.log('Request headers:', req.headers);
        
        const authHeader = req.header('Authorization');
        console.log('Auth header:', authHeader);

        if (!authHeader) {
            console.error('No Authorization header found');
            return res.status(401).json({ error: 'No Authorization header' });
        }

        const token = authHeader.replace('Bearer ', '');
        console.log('Token:', token);

        if (!token) {
            console.error('No token found in Authorization header');
            return res.status(401).json({ error: 'No token provided' });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log('Decoded token:', decoded);

            if (!decoded || !decoded.userId) {
                console.error('Invalid token format:', decoded);
                return res.status(401).json({ error: 'Invalid token format' });
            }

            // Set the user ID in the request
            req.user = { userId: decoded.userId };
            console.log('Set user in request:', req.user);
            next();
        } catch (jwtError) {
            console.error('JWT verification error:', jwtError);
            if (jwtError.name === 'JsonWebTokenError') {
                return res.status(401).json({ error: 'Invalid token' });
            }
            if (jwtError.name === 'TokenExpiredError') {
                return res.status(401).json({ error: 'Token expired' });
            }
            throw jwtError;
        }
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(401).json({ error: 'Authentication failed' });
    }
};

module.exports = auth; 