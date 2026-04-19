import express from 'express';
import { db } from '../db.js';

const router = express.Router();

// GET /api/exercises - Get all exercises, optional muscle_group filter
router.get('/', (req, res) => {
  try {
    const { muscle_group } = req.query;
    
    let query = 'SELECT * FROM exercises';
    const params = [];
    
    if (muscle_group) {
      query += ' WHERE muscle_group = ?';
      params.push(muscle_group);
    }
    
    query += ' ORDER BY muscle_group, name';
    
    const exercises = db.prepare(query).all(...params);
    
    res.json({ success: true, data: exercises });
  } catch (err) {
    console.error('Error fetching exercises:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch exercises' });
  }
});

// GET /api/exercises/search?q=query - Search exercises by name
router.get('/search', (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ success: false, error: 'Search query is required' });
    }
    
    const exercises = db.prepare(
      'SELECT * FROM exercises WHERE name LIKE ? ORDER BY name'
    ).all(`%${q}%`);
    
    res.json({ success: true, data: exercises });
  } catch (err) {
    console.error('Error searching exercises:', err);
    res.status(500).json({ success: false, error: 'Failed to search exercises' });
  }
});

// GET /api/exercises/muscle-groups - Get all distinct muscle groups
router.get('/muscle-groups', (req, res) => {
  try {
    const groups = db.prepare(
      'SELECT DISTINCT muscle_group FROM exercises ORDER BY muscle_group'
    ).all();
    
    res.json({ success: true, data: groups.map(g => g.muscle_group) });
  } catch (err) {
    console.error('Error fetching muscle groups:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch muscle groups' });
  }
});

// GET /api/exercises/:id - Get single exercise by ID
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    const exercise = db.prepare('SELECT * FROM exercises WHERE id = ?').get(id);
    
    if (!exercise) {
      return res.status(404).json({ success: false, error: 'Exercise not found' });
    }
    
    res.json({ success: true, data: exercise });
  } catch (err) {
    console.error('Error fetching exercise:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch exercise' });
  }
});

// GET /api/exercises/templates - Get pre-built workout templates by goal category
router.get('/templates', (req, res) => {
  try {
    const { goal, include_exercises } = req.query;
    
    let query = 'SELECT * FROM workout_templates';
    const params = [];
    
    if (goal) {
      query += ' WHERE goal = ?';
      params.push(goal);
    }
    
    query += ' ORDER BY created_at';
    
    const templates = db.prepare(query).all(...params);
    
    if (include_exercises === 'true') {
      const result = templates.map(template => {
        const exercises = db.prepare(`
          SELECT te.*, e.name, e.muscle_group, e.difficulty, e.equipment
          FROM template_exercises te
          JOIN exercises e ON te.exercise_id = e.id
          WHERE te.template_id = ?
          ORDER BY te.id
        `).all(template.id);
        
        return { ...template, exercises };
      });
      
      res.json({ success: true, data: result });
    } else {
      res.json({ success: true, data: templates });
    }
  } catch (err) {
    console.error('Error fetching templates:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch templates' });
  }
});

export default router;