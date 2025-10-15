// Filepath: middleware/auth.middleware.js
const db = require('../models');
const logger = require('../utils/logger');
const jwt = require('jsonwebtoken');

const SingerUser = db.SingerUser;

const verifySingerToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (!token) {
        return res.status(401).json({ error: true, errorString: 'Authentication required: No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded.singerId) {
            logger.warn('[Singer Auth] Token verification failed: Missing singerId in payload.');
            return res.status(401).json({ error: true, errorString: 'Authentication failed: Invalid token type.' });
        }

        req.auth = decoded;

        const singer = await SingerUser.findByPk(decoded.singerId);
        if (!singer) {
            logger.warn(`[Singer Auth] Singer ID ${decoded.singerId} from valid token not found in DB.`);
            return res.status(401).json({ error: true, errorString: 'Invalid token: Singer not found.' });
        }

        req.auth.singer = singer;

        logger.debug(`[Singer Auth] Token validated for singer: ${req.auth.email || singer.email} (ID: ${req.auth.singerId}).`);
        next();
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            logger.warn('[Singer Auth] Token expired.');
            return res.status(401).json({ error: true, errorString: 'Authentication failed: Token expired.' });
        }
        if (error instanceof jwt.JsonWebTokenError) {
            logger.warn('[Singer Auth] Invalid token:', error.message);
            return res.status(401).json({ error: true, errorString: `Authentication failed: ${error.message}` });
        }
        logger.error('[Singer Auth] Error during token verification:', error);
        return res.status(500).json({ error: true, errorString: 'Server error during authentication.' });
    }
};

module.exports = { verifySingerToken };
