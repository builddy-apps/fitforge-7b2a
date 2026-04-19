import express from 'express';
import { db } from '../db.js';
import { authMiddleware } from '../auth.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', (req, res) => {
  try {
    const userId = req.user.userId;
    
    const routines = db.prepare(`
      SELECT 
        cr.id,
        cr.name,
        cr.created_at,
        COUNT(re.id) as exercise_count
      FROM custom_routines cr
      LEFT JOIN routine_exercises re ON cr.id = re.routine_id
      WHERE cr.user_id = ?
      GROUP BY cr.id
      ORDER BY cr.created_at DESC
    `).all(userId);
    
    res.json({ success: true, data: routines });
  } catch (err) {
    console.error('Error fetching routines:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch routines' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    
    const routine = db.prepare(
      'SELECT * FROM custom_routines WHERE id = ? AND user_id = ?'
    ).get(id, userId);
    
    if (!routine) {
      return res.status(404).json({ success: false, error: 'Routine not found' });
    }
    
    const exercises = db.prepare(`
      SELECT 
        re.id,
        re.exercise_id,
        re.order_index,
        re.sets,
        re.reps,
        re.rest_seconds,
        e.name,
        e.muscle_group,
        e.equipment
      FROM routine_exercises re
      JOIN exercises e ON re.exercise_id = e.id
      WHERE re.routine_id = ?
      ORDER BY re.order_index ASC
    `).all(id);
    
    res.json({ success: true, data: { ...routine, exercises } });
  } catch (err) {
    console.error('Error fetching routine:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch routine' });
  }
});

router.post('/', (req, res) => {
  try {
    const { name, exercises } = req.body;
    const userId = req.user.userId;
    
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Routine name is required' });
    }
    
    if (!Array.isArray(exercises) || exercises.length === 0) {
      return res.status(400).json({ success: false, error: 'At least one exercise is required' });
    }
    
    for (const ex of exercises) {
      if (!ex.exercise_id || typeof ex.exercise_id !== 'number') {
        return res.status(400).json({ success: false, error: 'Invalid exercise_id' });
      }
      if (!ex.sets || typeof ex.sets !== 'number' || ex.sets < 1) {
        return res.status(400).json({ success: false, error: 'Invalid sets value' });
      }
      if (!ex.reps || typeof ex.reps !== 'number' || ex.reps < 1) {
        return res.status(400).json({ success: false, error: 'Invalid reps value' });
      }
      if (typeof ex.rest_seconds !== 'number' || ex.rest_seconds < 0) {
        return res.status(400).json({ success: false, error: 'Invalid rest_seconds value' });
      }
    }
    
    const result = db.prepare(
      'INSERT INTO custom_routines (user_id, name) VALUES (?, ?)'
    ).run(userId, name.trim());
    
    const routineId = result.lastInsertRowid;
    
    const insertExercise = db.prepare(`
      INSERT INTO routine_exercises 
      (routine_id, exercise_id, order_index, sets, reps, rest_seconds)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    const insertMany = db.transaction((exs) => {
      for (let i = 0; i < exs.length; i++) {
        const ex = exs[i];
        insertExercise.run(routineId, ex.exercise_id, i, ex.sets, ex.reps, ex.rest_seconds || 60);
      }
    });
    
    insertMany(exercises);
    
    const createdRoutine = db.prepare(`
      SELECT 
        cr.id,
        cr.name,
        cr.created_at,
        COUNT(re.id) as exercise_count
      FROM custom_routines cr
      LEFT JOIN routine_exercises re ON cr.id = re.routine_id
      WHERE cr.id = ?
      GROUP BY cr.id
    `).get(routineId);
    
    res.status(201).json({ success: true, data: createdRoutine });
  } catch (err) {
    console.error('Error creating routine:', err);
    res.status(500).json({ success: false, error: 'Failed to create routine' });
  }
});

router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, exercises } = req.body;
    const userId = req.user.userId;
    
    const routine = db.prepare(
      'SELECT id FROM custom_routines WHERE id = ? AND user_id = ?'
    ).get(id, userId);
    
    if (!routine) {
      return res.status(404).json({ success: false, error: 'Routine not found' });
    }
    
    if (name && typeof name === 'string' && name.trim().length > 0) {
      db.prepare('UPDATE custom_routines SET name = ? WHERE id = ?').run(name.trim(), id);
    }
    
    if (Array.isArray(exercises)) {
      db.prepare('DELETE FROM routine_exercises WHERE routine_id = ?').run(id);
      
      const insertExercise = db.prepare(`
        INSERT INTO routine_exercises 
        (routine_id, exercise_id, order_index, sets, reps, rest_seconds)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      
      const insertMany = db.transaction((exs) => {
        for (let i = 0; i < exs.length; i++) {
          const ex = exs[i];
          insertExercise.run(id, ex.exercise_id, i, ex.sets, ex.reps, ex.rest_seconds || 60);
        }
      });
      
      insertMany(exercises);
    }
    
    const updatedRoutine = db.prepare(`
      SELECT 
        cr.id,
        cr.name,
        cr.created_at,
        COUNT(re.id) as exercise_count
      FROM custom_routines cr
      LEFT JOIN routine_exercises re ON cr.id = re.routine_id
      WHERE cr.id = ?
      GROUP BY cr.id
    `).get(id);
    
    res.json({ success: true, data: updatedRoutine });
  } catch (err) {
    console.error('Error updating routine:', err);
    res.status(500).json({ success: false, error: 'Failed to update routine' });
  }
});

router.put('/:id/reorder', (req, res) => {
  try {
    const { id } = req.params;
    const { exerciseIds } = req.body;
    const userId = req.user.userId;
    
    const routine = db.prepare(
      'SELECT id FROM custom_routines WHERE id = ? AND user_id = ?'
    ).get(id, userId);
    
    if (!routine) {
      return res.status(404).json({ success: false, error: 'Routine not found' });
    }
    
    if (!Array.isArray(exerciseIds)) {
      return res.status(400).json({ success: false, error: 'exerciseIds array is required' });
    }
    
    const updateOrder = db.prepare(`
      UPDATE routine_exercises
      SET order_index = ?
      WHERE id = ? AND routine_id = ?
    `);
    
    const updateMany = db.transaction((ids) => {
      for (let i = 0; i < ids.length; i++) {
        updateOrder.run(i, ids[i], id);
      }
    });
    
    updateMany(exerciseIds);
    
    res.json({ success: true, data: { message: 'Exercises reordered' } });
  } catch (err) {
    console.error('Error reordering exercises:', err);
    res.status(500).json({ success: false, error: 'Failed to reorder exercises' });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    
    const routine = db.prepare(
      'SELECT id FROM custom_routines WHERE id = ? AND user_id = ?'
    ).get(id, userId);
    
    if (!routine) {
      return res.status(404).json({ success: false, error: 'Routine not found' });
    }
    
    db.prepare('DELETE FROM custom_routines WHERE id = ?').run(id);
    
    res.json({ success: true, data: { message: 'Routine deleted' } });
  } catch (err) {
    console.error('Error deleting routine:', err);
    res.status(500).json({ success: false, error: 'Failed to delete routine' });
  }
});

export default router;