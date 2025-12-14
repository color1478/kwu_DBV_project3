import express from 'express';
import bcrypt from 'bcrypt';
import pool from '../db/connection.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Register
router.post('/register', async (req, res, next) => {
  try {
    const { email, password, nickname } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check if user exists
    const [existing] = await pool.execute(
      'SELECT user_id FROM users WHERE email = ?',
      [email]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert user
    const [result] = await pool.execute(
      'INSERT INTO users (email, password_hash, nickname, role) VALUES (?, ?, ?, ?)',
      [email, passwordHash, nickname || null, 'USER']
    );

    // Auto login
    req.session.userId = result.insertId;
    req.session.role = 'USER';
    req.session.email = email;

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        userId: result.insertId,
        email,
        nickname,
        role: 'USER'
      }
    });
  } catch (error) {
    next(error);
  }
});

// Login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const [users] = await pool.execute(
      'SELECT user_id, email, password_hash, nickname, role, is_active FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];

    if (!user.is_active) {
      return res.status(403).json({ error: 'Account is deactivated' });
    }

    // Verify password
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Set session
    req.session.userId = user.user_id;
    req.session.role = user.role;
    req.session.email = user.email;

    res.json({
      message: 'Login successful',
      user: {
        userId: user.user_id,
        email: user.email,
        nickname: user.nickname,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
});

// Logout
router.post('/logout', requireAuth, (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to logout' });
    }
    res.json({ message: 'Logout successful' });
  });
});

// Get current user
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const [users] = await pool.execute(
      'SELECT user_id, email, nickname, role, is_active, created_at FROM users WHERE user_id = ?',
      [req.session.userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: users[0] });
  } catch (error) {
    next(error);
  }
});

export default router;

