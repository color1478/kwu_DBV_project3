import express from 'express';
import pool from '../db/connection.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Get my page data
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const userId = req.session.userId;

    // Get user profile
    const [users] = await pool.execute(
      'SELECT user_id, email, nickname, role, created_at FROM users WHERE user_id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];

    // Get rental history
    const [rentals] = await pool.execute(
      `SELECT r.*, 
       s1.station_name as start_station_name,
       s2.station_name as end_station_name
       FROM rentals r
       LEFT JOIN stations s1 ON r.start_station = s1.station_id
       LEFT JOIN stations s2 ON r.end_station = s2.station_id
       WHERE r.user_id = ?
       ORDER BY r.start_time DESC
       LIMIT 20`,
      [userId]
    );

    // Get favorites
    const [favorites] = await pool.execute(
      `SELECT f.*, s.station_name, a.area_name
       FROM favorites f
       INNER JOIN stations s ON f.station_id = s.station_id
       INNER JOIN areas a ON s.area_id = a.area_id
       WHERE f.user_id = ?
       ORDER BY f.created_at DESC`,
      [userId]
    );

    // Get fault reports
    const [reports] = await pool.execute(
      `SELECT r.*, s.station_name
       FROM fault_reports r
       LEFT JOIN stations s ON r.station_id = s.station_id
       WHERE r.reporter_id = ?
       ORDER BY r.created_at DESC`,
      [userId]
    );

    // Get achievements
    const [achievements] = await pool.execute(
      `SELECT ua.*, ad.code, ad.name, ad.icon_url
       FROM user_achievements ua
       INNER JOIN achievement_defs ad ON ua.achv_id = ad.achv_id
       WHERE ua.user_id = ?
       ORDER BY ua.awarded_at DESC`,
      [userId]
    );

    // Get unread alerts
    const [alerts] = await pool.execute(
      `SELECT * FROM alerts
       WHERE user_id = ? AND is_read = FALSE
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json({
      user,
      rentals,
      favorites,
      reports,
      achievements,
      alerts
    });
  } catch (error) {
    next(error);
  }
});

// Mark alert as read
router.put('/alerts/:id/read', requireAuth, async (req, res, next) => {
  try {
    const alertId = parseInt(req.params.id);

    const [result] = await pool.execute(
      'UPDATE alerts SET is_read = TRUE WHERE alert_id = ? AND user_id = ?',
      [alertId, req.session.userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    res.json({ message: 'Alert marked as read' });
  } catch (error) {
    next(error);
  }
});

export default router;

