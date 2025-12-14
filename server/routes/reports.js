import express from 'express';
import multer from 'multer';
import pool from '../db/connection.js';
import { requireAuth } from '../middleware/auth.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// Ensure uploads directory exists
const uploadsDir = join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Submit fault report
router.post('/', requireAuth, upload.single('photo'), async (req, res, next) => {
  try {
    const { stationId, bikeId, category, content } = req.body;

    if (!stationId || !category || !content) {
      return res.status(400).json({ error: 'Station ID, category, and content are required' });
    }

    // Check if station exists
    const [stations] = await pool.execute(
      'SELECT station_id FROM stations WHERE station_id = ?',
      [stationId]
    );

    if (stations.length === 0) {
      return res.status(404).json({ error: 'Station not found' });
    }

    const photoUrl = req.file ? `/uploads/${req.file.filename}` : null;

    // Insert report
    const [result] = await pool.execute(
      `INSERT INTO fault_reports (reporter_id, station_id, bike_id, category, content, photo_url, status)
       VALUES (?, ?, ?, ?, ?, ?, 'RECEIVED')`,
      [req.session.userId, stationId, bikeId || null, category, content, photoUrl]
    );

    // Create alert for admin
    await pool.execute(
      `INSERT INTO alerts (user_id, type, ref_id, message)
       SELECT user_id, 'REPORT', ?, CONCAT('새로운 고장 신고가 접수되었습니다: ', ?)
       FROM users WHERE role = 'ADMIN'`,
      [result.insertId, content.substring(0, 50)]
    );

    res.status(201).json({
      message: 'Report submitted successfully',
      reportId: result.insertId
    });
  } catch (error) {
    next(error);
  }
});

// Get my reports
router.get('/mine', requireAuth, async (req, res, next) => {
  try {
    const [reports] = await pool.execute(
      `SELECT r.*, s.station_name, b.bike_id as bike_number
       FROM fault_reports r
       LEFT JOIN stations s ON r.station_id = s.station_id
       LEFT JOIN bikes b ON r.bike_id = b.bike_id
       WHERE r.reporter_id = ?
       ORDER BY r.created_at DESC`,
      [req.session.userId]
    );

    res.json({ reports });
  } catch (error) {
    next(error);
  }
});

// Get report detail
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const reportId = parseInt(req.params.id);

    const [reports] = await pool.execute(
      `SELECT r.*, s.station_name, b.bike_id as bike_number,
       u.nickname as reporter_name
       FROM fault_reports r
       LEFT JOIN stations s ON r.station_id = s.station_id
       LEFT JOIN bikes b ON r.bike_id = b.bike_id
       LEFT JOIN users u ON r.reporter_id = u.user_id
       WHERE r.report_id = ?`,
      [reportId]
    );

    if (reports.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const report = reports[0];

    // Check if user owns this report or is admin
    if (report.reporter_id !== req.session.userId && req.session.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ report });
  } catch (error) {
    next(error);
  }
});

export default router;

