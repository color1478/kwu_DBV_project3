import express from 'express';
import pool from '../db/connection.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// ========== Member Management ==========

// Get all users
router.get('/users', requireAdmin, async (req, res, next) => {
  try {
    const [users] = await pool.execute(
      `SELECT user_id, email, nickname, role, is_active, created_at,
       (SELECT COUNT(*) FROM rentals WHERE user_id = u.user_id) as rental_count,
       (SELECT COUNT(*) FROM fault_reports WHERE reporter_id = u.user_id) as report_count
       FROM users u
       ORDER BY u.created_at DESC`
    );

    res.json({ users });
  } catch (error) {
    next(error);
  }
});

// Update user role
router.put('/users/:id/role', requireAdmin, async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);
    const { role } = req.body;

    if (!['USER', 'ADMIN'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    await pool.execute(
      'UPDATE users SET role = ? WHERE user_id = ?',
      [role, userId]
    );

    res.json({ message: 'User role updated' });
  } catch (error) {
    next(error);
  }
});

// Toggle user active status
router.put('/users/:id/active', requireAdmin, async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);
    const { isActive } = req.body;

    await pool.execute(
      'UPDATE users SET is_active = ? WHERE user_id = ?',
      [isActive, userId]
    );

    res.json({ message: 'User status updated' });
  } catch (error) {
    next(error);
  }
});

// ========== Station Management ==========

// Get all stations
router.get('/stations', requireAdmin, async (req, res, next) => {
  try {
    const [stations] = await pool.execute(
      `SELECT s.*, a.area_name,
       (SELECT COUNT(*) FROM bikes 
        WHERE station_id = s.station_id 
        AND status IN ('AVAILABLE', 'FAULT')) as bikes_available
       FROM stations s
       INNER JOIN areas a ON s.area_id = a.area_id
       ORDER BY s.station_id`
    );
    
    // docks_available 계산 (총 도크 수 - 대여 가능 자전거 수)
    stations.forEach(station => {
      station.docks_available = station.docks_total - station.bikes_available;
    });

    res.json({ stations });
  } catch (error) {
    next(error);
  }
});

// Create station
router.post('/stations', requireAdmin, async (req, res, next) => {
  try {
    const { areaId, stationName, latitude, longitude, docksTotal } = req.body;

    if (!areaId || !stationName || !latitude || !longitude) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const [result] = await pool.execute(
      'INSERT INTO stations (area_id, station_name, latitude, longitude, docks_total) VALUES (?, ?, ?, ?, ?)',
      [areaId, stationName, latitude, longitude, docksTotal || 0]
    );

    res.status(201).json({ message: 'Station created', stationId: result.insertId });
  } catch (error) {
    next(error);
  }
});

// Update station
router.put('/stations/:id', requireAdmin, async (req, res, next) => {
  try {
    const stationId = parseInt(req.params.id);
    const { stationName, latitude, longitude, docksTotal, isActive } = req.body;

    await pool.execute(
      'UPDATE stations SET station_name = ?, latitude = ?, longitude = ?, docks_total = ?, is_active = ? WHERE station_id = ?',
      [stationName, latitude, longitude, docksTotal, isActive, stationId]
    );

    res.json({ message: 'Station updated' });
  } catch (error) {
    next(error);
  }
});

// Toggle station active status
router.put('/stations/:id/active', requireAdmin, async (req, res, next) => {
  try {
    const stationId = parseInt(req.params.id);
    const { isActive } = req.body;

    await pool.execute(
      'UPDATE stations SET is_active = ? WHERE station_id = ?',
      [isActive, stationId]
    );

    res.json({ message: 'Station status updated' });
  } catch (error) {
    next(error);
  }
});

// ========== Bike Management ==========

// Get all bikes
router.get('/bikes', requireAdmin, async (req, res, next) => {
  try {
    const [bikes] = await pool.execute(
      `SELECT b.*, s.station_name, a.area_name
       FROM bikes b
       LEFT JOIN stations s ON b.station_id = s.station_id
       LEFT JOIN areas a ON s.area_id = a.area_id
       ORDER BY b.bike_id`
    );

    res.json({ bikes });
  } catch (error) {
    next(error);
  }
});

// Create bike
router.post('/bikes', requireAdmin, async (req, res, next) => {
  try {
    const { stationId, status, purchasedAt } = req.body;

    const [result] = await pool.execute(
      'INSERT INTO bikes (station_id, status, purchased_at) VALUES (?, ?, ?)',
      [stationId || null, status || 'AVAILABLE', purchasedAt || null]
    );

    res.status(201).json({ message: 'Bike created', bikeId: result.insertId });
  } catch (error) {
    next(error);
  }
});

// Update bike
router.put('/bikes/:id', requireAdmin, async (req, res, next) => {
  try {
    const bikeId = parseInt(req.params.id);
    const { stationId, status } = req.body;

    await pool.execute(
      'UPDATE bikes SET station_id = ?, status = ? WHERE bike_id = ?',
      [stationId || null, status, bikeId]
    );

    res.json({ message: 'Bike updated' });
  } catch (error) {
    next(error);
  }
});

// ========== Report & Maintenance Management ==========

// Get all reports
router.get('/reports', requireAdmin, async (req, res, next) => {
  try {
    const [reports] = await pool.execute(
      `SELECT r.*, u.nickname as reporter_name, s.station_name,
       m.order_id, m.status as maintenance_status, m.priority, m.due_date
       FROM fault_reports r
       LEFT JOIN users u ON r.reporter_id = u.user_id
       LEFT JOIN stations s ON r.station_id = s.station_id
       LEFT JOIN maintenance_orders m ON r.report_id = m.report_id
       ORDER BY r.created_at DESC`
    );

    res.json({ reports });
  } catch (error) {
    next(error);
  }
});

// Create maintenance order
router.post('/reports/:id/maintenance', requireAdmin, async (req, res, next) => {
  try {
    const reportId = parseInt(req.params.id);
    const { assigneeId, priority, dueDate } = req.body;

    if (!assigneeId) {
      return res.status(400).json({ error: 'Assignee ID is required' });
    }

    // Check if order already exists
    const [existing] = await pool.execute(
      'SELECT order_id FROM maintenance_orders WHERE report_id = ?',
      [reportId]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Maintenance order already exists' });
    }

    const [result] = await pool.execute(
      `INSERT INTO maintenance_orders (report_id, assignee_id, priority, due_date, status)
       VALUES (?, ?, ?, ?, 'ASSIGNED')`,
      [reportId, assigneeId, priority || 0, dueDate || null]
    );

    // Update report status
    await pool.execute(
      'UPDATE fault_reports SET status = ? WHERE report_id = ?',
      ['IN_PROGRESS', reportId]
    );

    // Get reporter ID for alert
    const [reports] = await pool.execute(
      'SELECT reporter_id FROM fault_reports WHERE report_id = ?',
      [reportId]
    );

    if (reports.length > 0) {
      await pool.execute(
        'INSERT INTO alerts (user_id, type, ref_id, message) VALUES (?, ?, ?, ?)',
        [reports[0].reporter_id, 'MAINT', reportId, '고장 신고가 유지보수팀에 배정되었습니다.']
      );
    }

    res.status(201).json({ message: 'Maintenance order created', orderId: result.insertId });
  } catch (error) {
    next(error);
  }
});

// Update maintenance order
router.put('/maintenance/:id', requireAdmin, async (req, res, next) => {
  try {
    const orderId = parseInt(req.params.id);
    const { status, priority, dueDate } = req.body;

    await pool.execute(
      'UPDATE maintenance_orders SET status = ?, priority = ?, due_date = ? WHERE order_id = ?',
      [status, priority, dueDate, orderId]
    );

    // If status is DONE, update report status
    if (status === 'DONE') {
      const [orders] = await pool.execute(
        'SELECT report_id FROM maintenance_orders WHERE order_id = ?',
        [orderId]
      );

      if (orders.length > 0) {
        await pool.execute(
          'UPDATE fault_reports SET status = ? WHERE report_id = ?',
          ['DONE', orders[0].report_id]
        );
      }
    }

    res.json({ message: 'Maintenance order updated' });
  } catch (error) {
    next(error);
  }
});

// Validate fault report
router.put('/reports/:id/validate', requireAdmin, async (req, res, next) => {
  try {
    const reportId = parseInt(req.params.id);
    const { isValid } = req.body;

    await pool.execute(
      'UPDATE fault_reports SET is_valid = ?, validated_at = NOW(), status = ? WHERE report_id = ?',
      [isValid, 'DONE', reportId]
    );

    // Get reporter ID for alert
    const [reports] = await pool.execute(
      'SELECT reporter_id FROM fault_reports WHERE report_id = ?',
      [reportId]
    );

    if (reports.length > 0) {
      const message = isValid
        ? '고장 신고가 유효한 것으로 검증되었습니다. 배지를 확인해주세요!'
        : '고장 신고가 검증되었습니다.';

      await pool.execute(
        'INSERT INTO alerts (user_id, type, ref_id, message) VALUES (?, ?, ?, ?)',
        [reports[0].reporter_id, 'REPORT', reportId, message]
      );
    }

    res.json({ message: 'Report validated' });
  } catch (error) {
    next(error);
  }
});

// ========== Rebalancing Recommendation ==========

router.get('/rebalancing', requireAdmin, async (req, res, next) => {
  try {
    const thresholdLow = 3; // Below this, needs bikes
    const thresholdHigh = 0.8; // Above this ratio, has excess bikes

    // Get latest status for all stations using CTE
    const [stations] = await pool.execute(
      `WITH latest_status AS (
        SELECT station_id, bikes_available, docks_available, snapshot_ts,
               ROW_NUMBER() OVER (PARTITION BY station_id ORDER BY snapshot_ts DESC) as rn
        FROM station_status
      )
      SELECT s.station_id, s.station_name, s.docks_total,
             ls.bikes_available, ls.docks_available,
             (ls.bikes_available / NULLIF(s.docks_total, 0)) as utilization_ratio
      FROM stations s
      LEFT JOIN latest_status ls ON s.station_id = ls.station_id AND ls.rn = 1
      WHERE s.is_active = TRUE
      ORDER BY ls.bikes_available ASC`
    );

    // Identify stations needing bikes
    const needsBikes = stations.filter(s => 
      s.bikes_available < thresholdLow || s.bikes_available === null
    );

    // Identify stations with excess bikes
    const hasExcess = stations.filter(s => 
      s.utilization_ratio > thresholdHigh && s.bikes_available > thresholdLow
    );

    // Simple heuristic: suggest transfers from excess to need
    const suggestions = [];
    for (const need of needsBikes.slice(0, 10)) {
      const excess = hasExcess.find(e => 
        e.bikes_available > thresholdLow + 2
      );
      if (excess) {
        const transferAmount = Math.min(
          Math.ceil((thresholdLow + 5 - need.bikes_available) / 2),
          Math.floor((excess.bikes_available - thresholdLow) / 2)
        );
        if (transferAmount > 0) {
          suggestions.push({
            from_station_id: excess.station_id,
            from_station_name: excess.station_name,
            to_station_id: need.station_id,
            to_station_name: need.station_name,
            suggested_bikes: transferAmount
          });
        }
      }
    }

    res.json({
      needsBikes,
      hasExcess,
      suggestions
    });
  } catch (error) {
    next(error);
  }
});

// ========== Statistics Dashboard ==========

// Get stations with utilization rate
router.get('/stations/utilization', requireAdmin, async (req, res, next) => {
  try {
    const now = new Date();
    const currentDow = now.getDay();
    const currentHour = now.getHours();

    const [stations] = await pool.execute(
      `WITH latest_status AS (
        SELECT station_id, bikes_available, docks_available, snapshot_ts,
               ROW_NUMBER() OVER (PARTITION BY station_id ORDER BY snapshot_ts DESC) as rn
        FROM station_status
      )
      SELECT s.station_id, s.station_name, s.latitude, s.longitude, s.docks_total,
             COALESCE(ls.bikes_available, 0) as bikes_available,
             COALESCE(ls.docks_available, 0) as docks_available,
             (COALESCE(ls.bikes_available, 0) / NULLIF(s.docks_total, 0)) as utilization_rate
      FROM stations s
      LEFT JOIN latest_status ls ON s.station_id = ls.station_id AND ls.rn = 1
      WHERE s.is_active = TRUE`
    );

    // Get baseline for each station
    const stationsWithBaseline = await Promise.all(
      stations.map(async (station) => {
        let [baselines] = await pool.execute(
          'SELECT baseline_demand FROM station_baseline WHERE station_id = ? AND dow = ? AND hour = ?',
          [station.station_id, currentDow, currentHour]
        );

        if (baselines.length === 0) {
          [baselines] = await pool.execute(
            'SELECT baseline_demand FROM station_baseline WHERE station_id = ? AND dow = 1 AND hour = 8 LIMIT 1',
            [station.station_id]
          );
        }

        const baseline = baselines.length > 0 ? parseFloat(baselines[0].baseline_demand) : 10;
        const bikesAvailable = station.bikes_available || 0;
        const loadFactor = baseline > 0 ? bikesAvailable / baseline : 0;

        // Color based on load factor (관리자 관점: 재배치 필요 상황을 빨강으로)
        // 부족(<0.5) 또는 과잉(>1.2) = 재배치 필요 = 빨강
        // 보통(0.5-0.8) = 주황, 양호(0.8-1.2) = 초록
        let color = 'red'; // 과잉 = 재배치 필요
        if (loadFactor < 0.5) color = 'red'; // 부족 = 재배치 필요
        else if (loadFactor < 0.8) color = 'orange'; // 보통
        else if (loadFactor <= 1.2) color = 'green'; // 양호
        else color = 'red'; // 과잉 > 1.2 = 재배치 필요

        return {
          ...station,
          baseline_demand: baseline,
          load_factor: loadFactor,
          color
        };
      })
    );

    res.json({ stations: stationsWithBaseline });
  } catch (error) {
    next(error);
  }
});

router.get('/stats', requireAdmin, async (req, res, next) => {
  try {
    // Rentals count last 7 days
    const [rentalsStats] = await pool.execute(
      `SELECT DATE(start_time) as date, COUNT(*) as count
       FROM rentals
       WHERE start_time >= DATE_SUB(NOW(), INTERVAL 7 DAY)
       GROUP BY DATE(start_time)
       ORDER BY date ASC`
    );

    // Reports count
    const [reportsStats] = await pool.execute(
      `SELECT status, COUNT(*) as count
       FROM fault_reports
       GROUP BY status`
    );

    // Maintenance done count
    const [maintenanceStats] = await pool.execute(
      `SELECT status, COUNT(*) as count
       FROM maintenance_orders
       GROUP BY status`
    );

    // Station congestion levels (using aggregation with HAVING)
    const [congestionStats] = await pool.execute(
      `WITH latest_status AS (
        SELECT station_id, bikes_available, snapshot_ts,
               ROW_NUMBER() OVER (PARTITION BY station_id ORDER BY snapshot_ts DESC) as rn
        FROM station_status
      )
      SELECT 
        CASE 
          WHEN ls.bikes_available < 3 THEN 'LOW'
          WHEN ls.bikes_available < 10 THEN 'MEDIUM'
          ELSE 'HIGH'
        END as level,
        COUNT(*) as count
      FROM stations s
      LEFT JOIN latest_status ls ON s.station_id = ls.station_id AND ls.rn = 1
      WHERE s.is_active = TRUE
      GROUP BY level`
    );

    // Total users, active users
    const [userStats] = await pool.execute(
      `SELECT 
        COUNT(*) as total_users,
        SUM(CASE WHEN is_active = TRUE THEN 1 ELSE 0 END) as active_users
       FROM users`
    );

    // Additional statistics
    // Average bikes per station
    const [avgBikes] = await pool.execute(
      `SELECT AVG(bikes_available) as avg_bikes
       FROM latest_station_status`
    );

    // Stations by area
    const [stationsByArea] = await pool.execute(
      `SELECT a.area_name, COUNT(*) as count
       FROM stations s
       INNER JOIN areas a ON s.area_id = a.area_id
       WHERE s.is_active = TRUE
       GROUP BY a.area_id, a.area_name`
    );

    // Recent reports (last 7 days)
    const [recentReports] = await pool.execute(
      `SELECT DATE(created_at) as date, COUNT(*) as count
       FROM fault_reports
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
       GROUP BY DATE(created_at)
       ORDER BY date ASC`
    );

    // Bike status distribution
    const [bikeStatus] = await pool.execute(
      `SELECT status, COUNT(*) as count
       FROM bikes
       GROUP BY status`
    );

    res.json({
      rentalsLast7Days: rentalsStats,
      reportsByStatus: reportsStats,
      maintenanceByStatus: maintenanceStats,
      stationCongestion: congestionStats,
      userStats: userStats[0],
      avgBikes: avgBikes[0]?.avg_bikes || 0,
      stationsByArea,
      recentReports,
      bikeStatus
    });
  } catch (error) {
    next(error);
  }
});

export default router;

