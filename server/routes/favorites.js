import express from 'express';
import pool from '../db/connection.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Get user's favorites
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const [favorites] = await pool.execute(
      `SELECT f.*, s.station_name, s.latitude, s.longitude, a.area_name,
       (SELECT bikes_available FROM station_status 
        WHERE station_id = s.station_id 
        ORDER BY snapshot_ts DESC LIMIT 1) as bikes_available,
       (SELECT docks_available FROM station_status 
        WHERE station_id = s.station_id 
        ORDER BY snapshot_ts DESC LIMIT 1) as docks_available
       FROM favorites f
       INNER JOIN stations s ON f.station_id = s.station_id
       INNER JOIN areas a ON s.area_id = a.area_id
       WHERE f.user_id = ?
       ORDER BY f.created_at DESC`,
      [req.session.userId]
    );

    res.json({ favorites });
  } catch (error) {
    next(error);
  }
});

// Add favorite
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { stationId } = req.body;

    if (!stationId) {
      return res.status(400).json({ error: 'Station ID is required' });
    }

    // Check if station exists
    const [stations] = await pool.execute(
      'SELECT station_id FROM stations WHERE station_id = ?',
      [stationId]
    );

    if (stations.length === 0) {
      return res.status(404).json({ error: 'Station not found' });
    }

    // Check if already favorited
    const [existing] = await pool.execute(
      'SELECT fav_id FROM favorites WHERE user_id = ? AND station_id = ?',
      [req.session.userId, stationId]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Station already in favorites' });
    }

    // Insert favorite
    await pool.execute(
      'INSERT INTO favorites (user_id, station_id) VALUES (?, ?)',
      [req.session.userId, stationId]
    );

    res.status(201).json({ message: 'Favorite added successfully' });
  } catch (error) {
    next(error);
  }
});

// Remove favorite
router.delete('/:stationId', requireAuth, async (req, res, next) => {
  try {
    const stationId = parseInt(req.params.stationId);

    const [result] = await pool.execute(
      'DELETE FROM favorites WHERE user_id = ? AND station_id = ?',
      [req.session.userId, stationId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Favorite not found' });
    }

    res.json({ message: 'Favorite removed successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;

