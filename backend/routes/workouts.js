import express from 'express';
import { db } from '../db.js';
import { authMiddleware } from '../auth.js';

const router = express.Router();

router.use(authMiddleware);

// POST /api/workouts/start - Start a new workout session
router.post('/start', (req, res) => {
  try {
    const { routineId } = req.body;
    const userId = req.user.userId;
    
    const result = db.prepare(
      'INSERT INTO workout_logs (user_id, started_at) VALUES (?, datetime("now"))'
    ).run(userId);
    
    const logId = result.lastInsertRowid;
    const workoutLog = db.prepare('SELECT * FROM workout_logs WHERE id = ?').get(logId);
    
    res.json({ success: true, data: workoutLog });
  } catch (err) {
    console.error('Error starting workout:', err);
    res.status(500).json({ success: false, error: 'Failed to start workout' });
  }
});

// GET /api/workouts - Get workout history
router.get('/', (req, res) => {
  try {
    const userId = req.user.userId;
    const { limit = 20 } = req.query;
    
    const workouts = db.prepare(`
      SELECT 
        wl.*,
        COUNT(ws.id) as set_count,
        SUM(ws.weight * ws.reps) as total_volume
      FROM workout_logs wl
      LEFT JOIN workout_sets ws ON wl.id = ws.log_id
      WHERE wl.user_id = ?
      GROUP BY wl.id
      ORDER BY wl.started_at DESC
      LIMIT ?
    `).all(userId, limit);
    
    res.json({ success: true, data: workouts });
  } catch (err) {
    console.error('Error fetching workouts:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch workouts' });
  }
});

// GET /api/workouts/active - Get current active workout (incomplete)
router.get('/active', (req, res) => {
  try {
    const userId = req.user.userId;
    
    const workout = db.prepare(
      'SELECT * FROM workout_logs WHERE user_id = ? AND completed_at IS NULL ORDER BY started_at DESC LIMIT 1'
    ).get(userId);
    
    if (!workout) {
      return res.json({ success: true, data: null });
    }
    
    const sets = db.prepare(`
      SELECT 
        ws.*,
        e.name as exercise_name,
        e.muscle_group
      FROM workout_sets ws
      JOIN exercises e ON ws.exercise_id = e.id
      WHERE ws.log_id = ?
      ORDER BY ws.completed_at ASC
    `).all(workout.id);
    
    const groupedSets = {};
    sets.forEach(set => {
      if (!groupedSets[set.exercise_id]) {
        groupedSets[set.exercise_id] = {
          exercise_id: set.exercise_id,
          exercise_name: set.exercise_name,
          muscle_group: set.muscle_group,
          sets: []
        };
      }
      groupedSets[set.exercise_id].sets.push({
        id: set.id,
        set_number: set.set_number,
        weight: set.weight,
        reps: set.reps,
        completed_at: set.completed_at
      });
    });
    
    res.json({ success: true, data: { ...workout, exercises: Object.values(groupedSets) } });
  } catch (err) {
    console.error('Error fetching active workout:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch active workout' });
  }
});

// GET /api/workouts/:id - Get single workout with all sets
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    
    const workout = db.prepare(
      'SELECT * FROM workout_logs WHERE id = ? AND user_id = ?'
    ).get(id, userId);
    
    if (!workout) {
      return res.status(404).json({ success: false, error: 'Workout not found' });
    }
    
    const sets = db.prepare(`
      SELECT 
        ws.*,
        e.name as exercise_name,
        e.muscle_group
      FROM workout_sets ws
      JOIN exercises e ON ws.exercise_id = e.id
      WHERE ws.log_id = ?
      ORDER BY ws.completed_at ASC
    `).all(id);
    
    const groupedSets = {};
    sets.forEach(set => {
      if (!groupedSets[set.exercise_id]) {
        groupedSets[set.exercise_id] = {
          exercise_id: set.exercise_id,
          exercise_name: set.exercise_name,
          muscle_group: set.muscle_group,
          sets: []
        };
      }
      groupedSets[set.exercise_id].sets.push({
        id: set.id,
        set_number: set.set_number,
        weight: set.weight,
        reps: set.reps,
        completed_at: set.completed_at
      });
    });
    
    res.json({ success: true, data: { ...workout, exercises: Object.values(groupedSets) } });
  } catch (err) {
    console.error('Error fetching workout:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch workout' });
  }
});

// POST /api/workouts/:logId/sets - Log a completed set
router.post('/:logId/sets', (req, res) => {
  try {
    const { logId } = req.params;
    const userId = req.user.userId;
    const { exerciseId, setNumber, weight, reps } = req.body;
    
    const workout = db.prepare(
      'SELECT * FROM workout_logs WHERE id = ? AND user_id = ?'
    ).get(logId, userId);
    
    if (!workout) {
      return res.status(404).json({ success: false, error: 'Workout not found' });
    }
    
    if (!exerciseId || !setNumber || weight === undefined || reps === undefined) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }
    
    const result = db.prepare(`
      INSERT INTO workout_sets (log_id, exercise_id, set_number, weight, reps, completed_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `).run(logId, exerciseId, setNumber, weight, reps);
    
    const loggedSet = db.prepare('SELECT * FROM workout_sets WHERE id = ?').get(result.lastInsertRowid);
    
    res.json({ success: true, data: loggedSet });
  } catch (err) {
    console.error('Error logging set:', err);
    res.status(500).json({ success: false, error: 'Failed to log set' });
  }
});

// PUT /api/workouts/:logId/complete - Mark workout as completed
router.put('/:logId/complete', (req, res) => {
  try {
    const { logId } = req.params;
    const userId = req.user.userId;
    const { notes } = req.body;
    
    const workout = db.prepare(
      'SELECT * FROM workout_logs WHERE id = ? AND user_id = ?'
    ).get(logId, userId);
    
    if (!workout) {
      return res.status(404).json({ success: false, error: 'Workout not found' });
    }
    
    db.prepare(
      'UPDATE workout_logs SET completed_at = datetime("now"), notes = ? WHERE id = ?'
    ).run(notes || null, logId);
    
    const completedWorkout = db.prepare('SELECT * FROM workout_logs WHERE id = ?').get(logId);
    
    res.json({ success: true, data: completedWorkout });
  } catch (err) {
    console.error('Error completing workout:', err);
    res.status(500).json({ success: false, error: 'Failed to complete workout' });
  }
});

// DELETE /api/workouts/:logId - Cancel/delete workout session
router.delete('/:logId', (req, res) => {
  try {
    const { logId } = req.params;
    const userId = req.user.userId;
    
    const workout = db.prepare(
      'SELECT * FROM workout_logs WHERE id = ? AND user_id = ?'
    ).get(logId, userId);
    
    if (!workout) {
      return res.status(404).json({ success: false, error: 'Workout not found' });
    }
    
    db.prepare('DELETE FROM workout_logs WHERE id = ?').run(logId);
    
    res.json({ success: true, data: { message: 'Workout deleted' } });
  } catch (err) {
    console.error('Error deleting workout:', err);
    res.status(500).json({ success: false, error: 'Failed to delete workout' });
  }
});

export default router;