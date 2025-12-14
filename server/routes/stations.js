import express from 'express';
import pool from '../db/connection.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Calculate distance using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Get stations near location
router.get('/nearby', async (req, res, next) => {
  try {
    const { lat, lng, radius = 1 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    const radiusKm = parseFloat(radius);

    // Get all active stations with actual bike counts
    const [stations] = await pool.execute(
      `SELECT s.*, a.area_name,
       (SELECT COUNT(*) FROM bikes 
        WHERE station_id = s.station_id 
        AND status IN ('AVAILABLE', 'FAULT')) as bikes_available
       FROM stations s
       INNER JOIN areas a ON s.area_id = a.area_id
       WHERE s.is_active = TRUE`
    );
    
    // docks_available 계산 (총 도크 수 - 대여 가능 자전거 수)
    stations.forEach(station => {
      station.docks_available = station.docks_total - station.bikes_available;
    });

    // Calculate distance and filter
    const nearbyStations = stations
      .map(station => {
        const distance = calculateDistance(
          userLat, userLng,
          parseFloat(station.latitude),
          parseFloat(station.longitude)
        );
        return { ...station, distance };
      })
      .filter(station => station.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance);

    // Get baseline for current day/hour
    const now = new Date();
    const currentDow = now.getDay();
    const currentHour = now.getHours();

    // Get user's favorites if authenticated
    let userFavorites = [];
    if (req.session && req.session.userId) {
      const [favorites] = await pool.execute(
        'SELECT station_id FROM favorites WHERE user_id = ?',
        [req.session.userId]
      );
      userFavorites = favorites.map((f) => f.station_id);
    }

    // Get baseline and compute load factor for each station
    const stationsWithBaseline = await Promise.all(
      nearbyStations.map(async (station) => {
        // 먼저 현재 요일/시간의 baseline 찾기
        let [baselines] = await pool.execute(
          'SELECT baseline_demand FROM station_baseline WHERE station_id = ? AND dow = ? AND hour = ?',
          [station.station_id, currentDow, currentHour]
        );

        // 없으면 같은 요일의 가장 가까운 시간대 찾기
        if (baselines.length === 0) {
          [baselines] = await pool.execute(
            'SELECT baseline_demand FROM station_baseline WHERE station_id = ? AND dow = ? ORDER BY ABS(hour - ?) LIMIT 1',
            [station.station_id, currentDow, currentHour]
          );
        }

        // 그래도 없으면 월요일(1) 8시 baseline 사용 (기본값)
        if (baselines.length === 0) {
          [baselines] = await pool.execute(
            'SELECT baseline_demand FROM station_baseline WHERE station_id = ? AND dow = 1 AND hour = 8 LIMIT 1',
            [station.station_id]
          );
        }

        const baseline = baselines.length > 0 ? parseFloat(baselines[0].baseline_demand) : 10; // 기본값 10
        const bikesAvailable = station.bikes_available || 0;
        const loadFactor = baseline > 0 ? bikesAvailable / baseline : 0;

        // Color coding (사용자 관점)
        // 부족(<0.5) = 빨강, 보통(0.5-0.8) = 노랑, 양호(0.8-1.2) = 초록, 여유(>1.2) = 파랑
        let color = 'blue'; // blue (여유 > 1.2)
        if (loadFactor < 0.5) color = 'red'; // red (부족)
        else if (loadFactor < 0.8) color = 'orange'; // orange (보통 = 노랑)
        else if (loadFactor <= 1.2) color = 'green'; // green (양호)
        else color = 'blue'; // blue (여유 > 1.2)

        return {
          ...station,
          baseline_demand: baseline,
          load_factor: loadFactor,
          color,
          is_favorite: userFavorites.includes(station.station_id)
        };
      })
    );

    res.json({ stations: stationsWithBaseline });
  } catch (error) {
    next(error);
  }
});

// Get all stations (for map view)
router.get('/', async (req, res, next) => {
  try {
    const [stations] = await pool.execute(
      `SELECT s.*, a.area_name,
       (SELECT COUNT(*) FROM bikes 
        WHERE station_id = s.station_id 
        AND status IN ('AVAILABLE', 'FAULT')) as bikes_available
       FROM stations s
       INNER JOIN areas a ON s.area_id = a.area_id
       WHERE s.is_active = TRUE`
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

// Get all stations congestion prediction (전체 대여소 혼잡도 예측)
// 이 경로를 /:id 보다 먼저 정의해야 함 (라우트 순서 중요!)
router.get('/congestion/all', requireAuth, async (req, res, next) => {
  try {
    const { targetHour } = req.query; // 예측할 시간 (0-23)

    const now = new Date();
    const currentDow = now.getDay();
    const targetHourInt = targetHour ? parseInt(String(targetHour)) : now.getHours() + 1;

    // Get all active stations with current bike counts
    const [stations] = await pool.execute(
      `SELECT s.station_id, s.station_name, s.docks_total, a.area_name,
       (SELECT COUNT(*) FROM bikes 
        WHERE station_id = s.station_id 
        AND status IN ('AVAILABLE', 'FAULT')) as bikes_available
       FROM stations s
       INNER JOIN areas a ON s.area_id = a.area_id
       WHERE s.is_active = TRUE
       ORDER BY s.station_id`
    );

    // Get baselines for all stations for target hour
    const [baselines] = await pool.execute(
      `SELECT station_id, baseline_demand 
       FROM station_baseline 
       WHERE dow = ? AND hour = ?`,
      [currentDow, targetHourInt]
    );

    const baselineMap = new Map();
    baselines.forEach(b => {
      baselineMap.set(b.station_id, parseFloat(b.baseline_demand));
    });

    // Calculate predictions for each station
    const predictions = stations.map(station => {
      const baseline = baselineMap.get(station.station_id) || 10; // 기본값 10
      const currentBikesAvailable = station.bikes_available || 0;
      
      // 예측: 현재 대여 가능 수를 기준으로 예측 (실제로는 과거 패턴 분석이 필요하지만 간단히 현재값 사용)
      const predictedBikesAvailable = currentBikesAvailable; // 실제로는 시계열 예측 필요
      const predictedLoadFactor = baseline > 0 ? predictedBikesAvailable / baseline : 0;
      
      let loadFactorStatus = '보통';
      if (predictedLoadFactor < 0.5) {
        loadFactorStatus = '부족';
      } else if (predictedLoadFactor < 0.8) {
        loadFactorStatus = '보통';
      } else if (predictedLoadFactor <= 1.2) {
        loadFactorStatus = '양호';
      } else {
        loadFactorStatus = '여유';
      }

      return {
        station_id: station.station_id,
        station_name: station.station_name,
        area_name: station.area_name,
        predicted_bikes_available: predictedBikesAvailable,
        predicted_load_factor: predictedLoadFactor,
        load_factor_status: loadFactorStatus,
        baseline_demand: baseline
      };
    });

    res.json({
      targetHour: targetHourInt,
      predictions
    });
  } catch (error) {
    next(error);
  }
});

// Get station detail
router.get('/:id', async (req, res, next) => {
  try {
    const stationId = parseInt(req.params.id);

    // Get station info
    const [stations] = await pool.execute(
      `SELECT s.*, a.area_name FROM stations s
       INNER JOIN areas a ON s.area_id = a.area_id
       WHERE s.station_id = ?`,
      [stationId]
    );

    if (stations.length === 0) {
      return res.status(404).json({ error: 'Station not found' });
    }

    const station = stations[0];

    // Get actual bike count from bikes table
    const [bikeCounts] = await pool.execute(
      `SELECT 
        COUNT(*) as bikes_available,
        COUNT(CASE WHEN status = 'AVAILABLE' THEN 1 END) as available_count,
        COUNT(CASE WHEN status = 'FAULT' THEN 1 END) as fault_count
       FROM bikes 
       WHERE station_id = ? 
       AND status IN ('AVAILABLE', 'FAULT')`,
      [stationId]
    );
    
    const bikesAvailable = bikeCounts[0]?.bikes_available || 0;
    const latestStatus = {
      bikes_available: bikesAvailable,
      docks_available: station.docks_total - bikesAvailable,
      snapshot_ts: new Date()
    };

    // Get baseline for current day/hour
    const now = new Date();
    const currentDow = now.getDay();
    const currentHour = now.getHours();

    let [baselines] = await pool.execute(
      'SELECT * FROM station_baseline WHERE station_id = ? AND dow = ? AND hour = ?',
      [stationId, currentDow, currentHour]
    );

    if (baselines.length === 0) {
      [baselines] = await pool.execute(
        'SELECT * FROM station_baseline WHERE station_id = ? AND dow = 1 AND hour = 8 LIMIT 1',
        [stationId]
      );
    }

    // Get status history for chart (last 7 days)
    const [history] = await pool.execute(
      `SELECT snapshot_ts, bikes_available, docks_available 
       FROM station_status 
       WHERE station_id = ? 
       AND snapshot_ts >= DATE_SUB(NOW(), INTERVAL 7 DAY)
       ORDER BY snapshot_ts ASC`,
      [stationId]
    );

    // Get baseline for all hours (0-23) of current day, 없으면 기본값 10
    const [allBaselinesRaw] = await pool.execute(
      'SELECT hour, baseline_demand FROM station_baseline WHERE station_id = ? AND dow = ? ORDER BY hour',
      [stationId, currentDow]
    );
    
    // 0-23시 모두 채우기 (없는 시간대는 기본값 10)
    const allBaselines = [];
    for (let hour = 0; hour < 24; hour++) {
      const found = allBaselinesRaw.find((b) => b.hour === hour);
      allBaselines.push({
        hour,
        baseline_demand: found ? found.baseline_demand : 10
      });
    }

    const baseline = baselines.length > 0 ? baselines[0] : null;

    // Get bikes at this station (AVAILABLE 또는 FAULT만, IN_USE 제외)
    // 실제 자전거 개수만큼 정확히 표시 (이미 bikesAvailable 변수가 선언됨)
    // 대여 가능 개수만큼만 조회 (정확히 일치하도록)
    const [bikesAll] = await pool.execute(
      `SELECT bike_id, status, purchased_at 
       FROM bikes 
       WHERE station_id = ? 
       AND status IN ('AVAILABLE', 'FAULT')
       ORDER BY bike_id
       LIMIT ${Math.max(bikesAvailable, 0)}`,
      [stationId]
    );
    
    // 정확히 대여 가능 개수만큼만 반환
    const bikes = bikesAll.slice(0, bikesAvailable);

    let loadFactor = 0;
    if (baseline && baseline.baseline_demand > 0 && latestStatus) {
      loadFactor = latestStatus.bikes_available / baseline.baseline_demand;
    } else if (latestStatus) {
      // baseline이 없어도 기본값으로 계산
      const defaultBaseline = 10;
      loadFactor = latestStatus.bikes_available / defaultBaseline;
    }

    res.json({
      station,
      latestStatus: latestStatus || { bikes_available: 0, docks_available: station.docks_total || 0 },
      baseline: baseline || { baseline_demand: 10 },
      loadFactor,
      history: history || [],
      allBaselines: allBaselines || [],
      bikes: bikes || []
    });
  } catch (error) {
    next(error);
  }
});

// Get congestion prediction (혼잡도 예측)
router.get('/:id/congestion', requireAuth, async (req, res, next) => {
  try {
    const stationId = parseInt(req.params.id);
    const { targetHour } = req.query; // 예측할 시간 (0-23)

    const now = new Date();
    const currentDow = now.getDay();
    const targetHourInt = targetHour ? parseInt(String(targetHour)) : now.getHours() + 1;

    // Get baseline for target hour
    const [baselines] = await pool.execute(
      'SELECT baseline_demand FROM station_baseline WHERE station_id = ? AND dow = ? AND hour = ?',
      [stationId, currentDow, targetHourInt]
    );

    if (baselines.length === 0) {
      return res.json({
        prediction: '데이터 부족',
        confidence: 0,
        recommendation: '기준 데이터가 없어 예측할 수 없습니다.'
      });
    }

    const baseline = parseFloat(baselines[0].baseline_demand);
    
    // Get current bikes from bikes table
    const [bikeCounts] = await pool.execute(
      `SELECT COUNT(*) as bikes_available
       FROM bikes 
       WHERE station_id = ? 
       AND status IN ('AVAILABLE', 'FAULT')`,
      [stationId]
    );

    const currentBikesAvailable = bikeCounts[0]?.bikes_available || 0;

    // 간단한 예측: 현재 대여 가능 수와 baseline 비교
    const predictedLoad = baseline > 0 ? currentBikesAvailable / baseline : 0;
    
    let prediction = '보통';
    let recommendation = '이용 가능합니다.';
    
    if (predictedLoad < 0.5) {
      prediction = '혼잡 예상';
      recommendation = '자전거가 부족할 수 있습니다. 다른 대여소를 이용하시는 것을 권장합니다.';
    } else if (predictedLoad < 0.8) {
      prediction = '보통';
      recommendation = '이용 가능하지만 여유가 많지 않을 수 있습니다.';
    } else if (predictedLoad <= 1.2) {
      prediction = '여유';
      recommendation = '이용하기 좋은 상태입니다.';
    } else {
      prediction = '매우 여유';
      recommendation = '충분한 자전거가 있어 이용하기 좋습니다.';
    }

    res.json({
      stationId,
      targetHour: targetHourInt,
      baseline,
      currentBikesAvailable,
      predictedLoad,
      prediction,
      recommendation,
      confidence: 0.7
    });
  } catch (error) {
    next(error);
  }
});

export default router;
