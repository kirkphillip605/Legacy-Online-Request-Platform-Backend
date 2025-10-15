// Filepath: controllers/auth.controller.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../models');
const logger = require('../utils/logger');
const User = db.User;

const authController = {
    login: async (req, res) => {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: true, errorString: 'Email and password are required.' });
        }

        try {
            const user = await User.findOne({ where: { email } });

            if (!user || !user.passwordHash) {
                logger.warn(`Login attempt failed for email: ${email} (User not found or missing password hash)`);
                return res.status(401).json({ error: true, errorString: 'Invalid credentials.' });
            }

            const isMatch = await bcrypt.compare(password, user.passwordHash);

            if (!isMatch) {
                logger.warn(`Login attempt failed for email: ${email} (Password mismatch)`);
                return res.status(401).json({ error: true, errorString: 'Invalid credentials.' });
            }

            const payload = {
                userId: user.id,
                email: user.email,
                name: user.name,
            };

            const token = jwt.sign(payload, process.env.JWT_SECRET, {
                expiresIn: process.env.JWT_EXPIRES_IN || '1h',
            });

            logger.info(`User logged in successfully: ${email} (ID: ${user.id})`);

            res.status(200).json({
                error: false,
                message: 'Login successful.',
                token,
                user: {
                    userId: user.id,
                    name: user.name,
                    email: user.email,
                },
            });
        } catch (error) {
            logger.error('Error during user login:', error);
            res.status(500).json({ error: true, errorString: 'Internal server error during login.' });
        }
    },
};

module.exports = authController;
