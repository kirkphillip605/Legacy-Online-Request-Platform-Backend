// Filepath: controllers/patron.auth.controller.js
'use strict';
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../models');
const logger = require('../utils/logger');

const SingerUser = db.SingerUser;
const saltRounds = 10;

const patronAuthController = {
    register: async (req, res) => {
        const { name, first_name, last_name, email, phone, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: true, errorString: 'Email and password are required for registration.' });
        }

        if (!/\S+@\S+\.\S+/.test(email)) {
            return res.status(400).json({ error: true, errorString: 'Invalid email format.' });
        }

        const resolvedName = (name || `${first_name || ''} ${last_name || ''}`.trim()).trim();
        if (!resolvedName) {
            return res.status(400).json({ error: true, errorString: 'Name is required.' });
        }

        try {
            const existingSinger = await SingerUser.findOne({ where: { email } });
            if (existingSinger) {
                return res.status(409).json({ error: true, errorString: 'Email already registered.' });
            }

            const hashedPassword = await bcrypt.hash(password, saltRounds);
            const newSinger = await SingerUser.create({
                name: resolvedName,
                email,
                phone: phone || null,
                passwordHash: hashedPassword,
            });

            const { passwordHash, ...singerResponse } = newSinger.toJSON();
            logger.info(`[Singer Auth] New singer registered: ${email} (ID: ${newSinger.id})`);
            res.status(201).json({ error: false, singer: singerResponse });
        } catch (error) {
            if (error instanceof db.Sequelize.ValidationError) {
                logger.warn('[Singer Auth] Validation error registering singer:', error.errors);
                return res.status(400).json({
                    error: true,
                    errorString: 'Validation failed',
                    details: error.errors.map(e => e.message),
                });
            }
            logger.error('[Singer Auth] Error registering singer:', error);
            res.status(500).json({ error: true, errorString: 'Error during registration.' });
        }
    },

    login: async (req, res) => {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: true, errorString: 'Email and password are required.' });
        }

        try {
            const singer = await SingerUser.findOne({ where: { email } });

            if (!singer || !singer.passwordHash) {
                logger.warn(`[Singer Auth] Login attempt failed for email: ${email} (Singer not found or missing password hash)`);
                return res.status(401).json({ error: true, errorString: 'Invalid credentials.' });
            }

            const isMatch = await bcrypt.compare(password, singer.passwordHash);

            if (!isMatch) {
                logger.warn(`[Singer Auth] Login attempt failed for email: ${email} (Password mismatch)`);
                return res.status(401).json({ error: true, errorString: 'Invalid credentials.' });
            }

            const payload = {
                singerId: singer.id,
                email: singer.email,
                name: singer.name,
            };

            const token = jwt.sign(payload, process.env.JWT_SECRET, {
                expiresIn: process.env.JWT_EXPIRES_IN || '1h',
            });

            logger.info(`[Singer Auth] Singer logged in successfully: ${email} (ID: ${singer.id})`);

            res.status(200).json({
                error: false,
                message: 'Login successful.',
                token,
                singer: {
                    singerId: singer.id,
                    name: singer.name,
                    email: singer.email,
                    phone: singer.phone,
                },
            });
        } catch (error) {
            logger.error('[Singer Auth] Error during singer login:', error);
            res.status(500).json({ error: true, errorString: 'Internal server error during login.' });
        }
    },
};

module.exports = patronAuthController;
