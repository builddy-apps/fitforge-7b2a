import express from 'express';
import { db } from '../db.js';
import { authMiddleware } from '../auth.js';

const router = express.Router();

router.use(authMiddleware);

// GET /api/progress/exercise/:id - Get exercise progress over time
router.get('/exercise/:id', (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    
    const exercise = db.prepare('SELECT * FROM exercises WHERE id = ?').get(id);
    if (!exercise) {
      return res.status(404).json({ success: false, error: 'Exercise not found' });
    }
    
    const sets = db.prepare(`
      SELECT 
        date(ws.completed_at) as date,
        ws.weight,
        ws.reps,
        ws.weight * ws.reps as volume
      FROM workout_sets ws
      JOIN workout_logs wl ON ws.log_id = wl.id
      WHERE ws.exercise_id = ? AND wl.user_id = ? AND ws.completed_at IS NOT NULL
      ORDER BY ws.completed_at ASC
    `).all(id, userId);
    
    const records = db.prepare(`
      SELECT type, value, date FROM personal_records
      WHERE user_id = ? AND exercise_id = ?
      ORDER BY type, date DESC
    `).all(userId, id);
    
    const groupedRecords = {};
    records.forEach(r => {
      if (!groupedRecords[r.type] || new Date(r.date) > new Date(groupedRecords[r.type].date)) {
        groupedRecords[r.type] = { value: r.value, date: r.date };
      }
    });
    
    res.json({ success: true, data: { exercise, sets, records: groupedRecords } });
  } catch (err) {
    console.error('Error fetching exercise progress:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch progress' });
  }
});

// GET /api/progress/records - Get all personal records
router.get('/records', (req, res) => {
  try {
    const userId = req.user.userId;
    
    const records = db.prepare(`
      SELECT 
        pr.*,
        e.name as exercise_name,
        e.muscle_group
      FROM personal_records pr
      JOIN exercises e ON pr.exercise_id = e.id
      WHERE pr.user_id = ?
      ORDER BY e.name, pr.type, pr.value DESC
    `).all(userId);
    
    const grouped = {};
    records.forEach(r => {
      if (!grouped[r.exercise_id]) {
        grouped[r.exercise_id] = {
          exercise_id: r.exercise_id,
          exercise_name: r.exercise_name,
          muscle_group: r.muscle_group,
          records: {}
        };
      }
      if (!grouped[r.exercise_id].records[r.type] || r.value > grouped[r.exercise_id].records[r.type].value) {
        grouped[r.exercise_id].records[r.type] = { value: r.value, date: r.date };
      }
    });
    
    res.json({ success: true, data: Object.values(grouped) });
  } catch (err) {
    console.error('Error fetching records:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch records' });
  }
});

// GET /api/progress/calendar - Get workout calendar data with streaks
router.get('/calendar', (req, res) => {
  try {
    const { year, month } = req.query;
    const userId = req.user.userId;
    
    const now = new Date();
    const targetYear = year ? parseInt(year) : now.getFullYear();
    const targetMonth = month ? parseInt(month) : now.getMonth() + 1;
    
    const workouts = db.prepare(`
      SELECT DISTINCT date(started_at) as workout_date
      FROM workout_logs
      WHERE user_id = ? AND completed_at IS NOT NULL
      ORDER BY workout_date DESC
    `).all(userId);
    
    const workoutDates = workouts.map(w => w.workout_date);
    
    const monthWorkouts = workoutDates.filter(date => {
      const d = new Date(date + 'T00:00:00');
      return d.getFullYear() === targetYear && (d.getMonth() + 1) === targetMonth;
    });
    
    let streak = 0;
    let checkDate = new Date();
    checkDate.setHours(0, 0, 0, 0);
    
    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0];
      if (workoutDates.includes(dateStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (streak === 0) {
        checkDate.setDate(checkDate.getDate() - 1);
        const prevDateStr = checkDate.toISOString().split('T')[0];
        if (workoutDates.includes(prevDateStr)) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
          continue;
        }
        break;
      } else {
        break;
      }
    }
    
    let longestStreak = 0;
    let currentLongest = 0;
    let prevDate = null;
    
    for (const dateStr of workoutDates) {
      const currentDate = new Date(dateStr + 'T00:00:00');
      
      if (prevDate) {
        const diffDays = Math.round((prevDate - currentDate) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          currentLongest++;
        } else {
          currentLongest = 1;
        }
      } else {
        currentLongest = 1;
      }
      
      longestStreak = Math.max(longestStreak, currentLongest);
      prevDate = currentDate;
    }
    
    res.json({
      success: true,
      data: {
        year: targetYear,
        month: targetMonth,
        workoutDates: monthWorkouts,
        currentStreak: streak,
        longestStreak: longestStreak,
        totalWorkouts: monthWorkouts.length
      }
    });
  } catch (err) {
    console.error('Error fetching calendar data:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch calendar data' });
  }
});

// GET /api/progress/summary - Get monthly summary stats
router.get('/summary', (req, res) => {
  try {
    const { year, month } = req.query;
    const userId = req.user.userId;
    
    const now = new Date();
    const targetYear = year ? parseInt(year) : now.getFullYear();
    const targetMonth = month ? parseInt(month) : now.getMonth() + 1;
    
    const startDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`;
    const endDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-31`;
    
    const stats = db.prepare(`
      SELECT 
        COUNT(DISTINCT wl.id) as workout_count,
        COUNT(DISTINCT date(wl.started_at)) as active_days,
        SUM(ws.weight * ws.reps) as total_volume,
        COUNT(ws.id) as total_sets
      FROM workout_logs wl
      LEFT JOIN workout_sets ws ON wl.id = ws.log_id
      WHERE wl.user_id = ? 
        AND wl.completed_at IS NOT NULL
        AND date(wl.started_at) >= ?
        AND date(wl.started_at) <= ?
    `).get(userId, startDate, endDate);
    
    const dailyStats = db.prepare(`
      SELECT 
        date(wl.started_at) as date,
        COUNT(DISTINCT wl.id) as workouts,
        SUM(ws.weight * ws.reps) as volume
      FROM workout_logs wl
      LEFT JOIN workout_sets ws ON wl.id = ws.log_id
      WHERE wl.user_id = ? 
        AND wl.completed_at IS NOT NULL
        AND date(wl.started_at) >= ?
        AND date(wl.started_at) <= ?
      GROUP BY date(wl.started_at)
      ORDER BY date ASC
    `).all(userId, startDate, endDate);
    
    const topExercises = db.prepare(`
      SELECT 
        e.name,
        SUM(ws.weight * ws.reps) as volume
      FROM workout_sets ws
      JOIN workout_logs wl ON ws.log_id = wl.id
      JOIN exercises e ON ws.exercise_id = e.id
      WHERE wl.user_id = ? 
        AND wl.completed_at IS NOT NULL
        AND date(wl.started_at) >= ?
        AND date(wl.started_at) <= ?
      GROUP BY e.id
      ORDER BY volume DESC
      LIMIT 5
    `).all(userId, startDate, endDate);
    
    res.json({
      success: true,
      data: {
        year: targetYear,
        month: targetMonth,
        summary: {
          workoutCount: stats.workout_count || 0,
          activeDays: stats.active_days || 0,
          totalVolume: stats.total_volume || 0,
          totalSets: stats.total_sets || 0
        },
        daily: dailyStats,
        topExercises
      }
    });
  } catch (err) {
    console.error('Error fetching summary:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch summary' });
  }
});

// POST /api/progress/check-pr - Check and update PRs for a completed set
router.post('/check-pr', (req, res) => {
  try {
    const { exerciseId, weight, reps } = req.body;
    const userId = req.user.userId;
    
    if (!exerciseId || weight === undefined || !reps) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }
    
    const volume = weight * reps;
    const newRecords = [];
    
    const weightPR = db.prepare(`
      SELECT value FROM personal_records
      WHERE user_id = ? AND exercise_id = ? AND type = 'weight'
      ORDER BY value DESC LIMIT 1
    `).get(userId, exerciseId);
    
    if (!weightPR || weight > weightPR.value) {
      db.prepare(`
        INSERT INTO personal_records (user_id, exercise_id, type, value, date)
        VALUES (?, ?, 'weight', ?, datetime('now'))
      `).run(userId, exerciseId, weight);
      newRecords.push({ type: 'weight', value: weight, previous: weightPR?.value });
    }
    
    const repsPR = db.prepare(`
      SELECT value FROM personal_records
      WHERE user_id = ? AND exercise_id = ? AND type = 'reps'
      ORDER BY value DESC LIMIT 1
    `).get(userId, exerciseId);
    
    if (!repsPR || reps > repsPR.value) {
      db.prepare(`
        INSERT INTO personal_records (user_id, exercise_id, type, value, date)
        VALUES (?, ?, 'reps', ?, datetime('now'))
      `).run(userId, exerciseId, reps);
      newRecords.push({ type: 'reps', value: reps, previous: repsPR?.value });
    }
    
    const volumePR = db.prepare(`
      SELECT value FROM personal_records
      WHERE user_id = ? AND exercise_id = ? AND type = 'volume'
      ORDER BY value DESC LIMIT 1
    `).get(userId, exerciseId);
    
    if (!volumePR || volume > volumePR.value) {
      db.prepare(`
        INSERT INTO personal_records (user_id, exercise_id, type, value, date)
        VALUES (?, ?, 'volume', ?, datetime('now'))
      `).run(userId, exerciseId, volume);
      newRecords.push({ type: 'volume', value: volume, previous: volumePR?.value });
    }
    
    res.json({
      success: true,
      data: {
        newRecords,
        isNewPR: newRecords.length > 0
      }
    });
  } catch (err) {
    console.error('Error checking PR:', err);
    res.status(500).json({ success: false, error: 'Failed to check PR' });
  }
});

export default router;