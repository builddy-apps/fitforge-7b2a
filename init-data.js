import Database from 'better-sqlite3';
import fs from 'fs';
import crypto from 'crypto';

// Ensure data directory exists
fs.mkdirSync('data', { recursive: true });

const db = new Database('./data/app.db');
db.pragma('journal_mode = WAL');

// Check if already seeded
const count = db.prepare('SELECT COUNT(*) as count FROM users').get();
if (count.count > 0) {
  console.log('Data already seeded, skipping...');
  process.exit(0);
}

// Password hashing helper
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return salt + ':' + hash;
}

const insertAll = db.transaction(() => {
  // Insert demo users
  const insertUser = db.prepare(
    'INSERT INTO users (email, password_hash, name, created_at) VALUES (?, ?, ?, ?)'
  );

  const now = Date.now();
  const users = [
    {
      email: 'marcus.johnson@email.com',
      password: hashPassword('password123'),
      name: 'Marcus Johnson',
      created_at: new Date(now - 45 * 86400000).toISOString()
    },
    {
      email: 'sarah.chen@email.com',
      password: hashPassword('password123'),
      name: 'Sarah Chen',
      created_at: new Date(now - 30 * 86400000).toISOString()
    },
    {
      email: 'alex.rivera@email.com',
      password: hashPassword('password123'),
      name: 'Alex Rivera',
      created_at: new Date(now - 20 * 86400000).toISOString()
    }
  ];

  for (const u of users) {
    insertUser.run(u.email, u.password, u.name, u.created_at);
  }

  // Insert template exercises (template_id 1-4, exercise_id from seeded exercises)
  const insertTemplateExercise = db.prepare(
    'INSERT INTO template_exercises (template_id, exercise_id, sets, reps) VALUES (?, ?, ?, ?)'
  );

  // Template 1: Push Day (exercises 1-7, 26-33)
  const pushExercises = [
    { exercise_id: 1, sets: 4, reps: 8 },   // Bench Press
    { exercise_id: 2, sets: 3, reps: 10 },   // Incline Bench Press
    { exercise_id: 27, sets: 4, reps: 8 },   // Overhead Press
    { exercise_id: 28, sets: 3, reps: 12 },  // Lateral Raise
    { exercise_id: 38, sets: 3, reps: 12 },  // Tricep Pushdown
    { exercise_id: 7, sets: 3, reps: 10 }    // Dips
  ];

  // Template 2: Pull Day (exercises 9-17)
  const pullExercises = [
    { exercise_id: 10, sets: 4, reps: 8 },   // Pull-ups
    { exercise_id: 11, sets: 4, reps: 8 },   // Bent-over Row
    { exercise_id: 12, sets: 3, reps: 10 },  // Lat Pulldown
    { exercise_id: 15, sets: 3, reps: 15 },  // Face Pulls
    { exercise_id: 34, sets: 3, reps: 10 },  // Barbell Curl
    { exercise_id: 35, sets: 3, reps: 12 }   // Hammer Curl
  ];

  // Template 3: Leg Day (exercises 18-26)
  const legExercises = [
    { exercise_id: 18, sets: 4, reps: 8 },   // Squat
    { exercise_id: 19, sets: 3, reps: 12 },  // Leg Press
    { exercise_id: 24, sets: 3, reps: 10 },  // Romanian Deadlift
    { exercise_id: 21, sets: 3, reps: 12 },  // Leg Extension
    { exercise_id: 22, sets: 3, reps: 12 },  // Leg Curl
    { exercise_id: 23, sets: 4, reps: 15 }   // Calf Raises
  ];

  // Template 4: Full Body Circuit (various)
  const circuitExercises = [
    { exercise_id: 6, sets: 3, reps: 15 },   // Push-ups
    { exercise_id: 10, sets: 3, reps: 10 },  // Pull-ups
    { exercise_id: 18, sets: 3, reps: 12 },  // Squat
    { exercise_id: 49, sets: 3, reps: 10 },  // Burpees
    { exercise_id: 53, sets: 3, reps: 15 },  // Kettlebell Swing
    { exercise_id: 50, sets: 3, reps: 20 }   // Mountain Climbers
  ];

  for (const ex of pushExercises) {
    insertTemplateExercise.run(1, ex.exercise_id, ex.sets, ex.reps);
  }
  for (const ex of pullExercises) {
    insertTemplateExercise.run(2, ex.exercise_id, ex.sets, ex.reps);
  }
  for (const ex of legExercises) {
    insertTemplateExercise.run(3, ex.exercise_id, ex.sets, ex.reps);
  }
  for (const ex of circuitExercises) {
    insertTemplateExercise.run(4, ex.exercise_id, ex.sets, ex.reps);
  }

  // Insert custom routines for users
  const insertRoutine = db.prepare(
    'INSERT INTO custom_routines (user_id, name, created_at) VALUES (?, ?, ?)'
  );
  const insertRoutineExercise = db.prepare(
    'INSERT INTO routine_exercises (routine_id, exercise_id, order_index, sets, reps, rest_seconds) VALUES (?, ?, ?, ?, ?, ?)'
  );

  // Marcus's routines
  insertRoutine.run(1, 'Upper Body Power', new Date(now - 40 * 86400000).toISOString());
  const marcusUpperExercises = [
    { exercise_id: 1, sets: 5, reps: 5, rest: 180 },   // Bench Press
    { exercise_id: 27, sets: 5, reps: 5, rest: 180 },   // Overhead Press
    { exercise_id: 11, sets: 4, reps: 6, rest: 120 },   // Bent-over Row
    { exercise_id: 10, sets: 4, reps: 8, rest: 120 }    // Pull-ups
  ];
  for (let i = 0; i < marcusUpperExercises.length; i++) {
    const ex = marcusUpperExercises[i];
    insertRoutineExercise.run(1, ex.exercise_id, i, ex.sets, ex.reps, ex.rest);
  }

  insertRoutine.run(1, 'Leg Destroyer', new Date(now - 38 * 86400000).toISOString());
  const marcusLegExercises = [
    { exercise_id: 18, sets: 5, reps: 5, rest: 180 },   // Squat
    { exercise_id: 19, sets: 4, reps: 10, rest: 120 },   // Leg Press
    { exercise_id: 24, sets: 3, reps: 8, rest: 120 },    // Romanian Deadlift
    { exercise_id: 26, sets: 3, reps: 10, rest: 90 },    // Bulgarian Split Squat
    { exercise_id: 23, sets: 4, reps: 15, rest: 60 }     // Calf Raises
  ];
  for (let i = 0; i < marcusLegExercises.length; i++) {
    const ex = marcusLegExercises[i];
    insertRoutineExercise.run(2, ex.exercise_id, i, ex.sets, ex.reps, ex.rest);
  }

  // Sarah's routines
  insertRoutine.run(2, 'Tone & Sculpt', new Date(now - 25 * 86400000).toISOString());
  const sarahToneExercises = [
    { exercise_id: 4, sets: 3, reps: 12, rest: 60 },    // Dumbbell Flyes
    { exercise_id: 28, sets: 3, reps: 15, rest: 45 },   // Lateral Raise
    { exercise_id: 29, sets: 3, reps: 12, rest: 45 },   // Front Raise
    { exercise_id: 30, sets: 3, reps: 15, rest: 45 },   // Rear Delt Fly
    { exercise_id: 43, sets: 3, reps: 60, rest: 45 }    // Plank
  ];
  for (let i = 0; i < sarahToneExercises.length; i++) {
    const ex = sarahToneExercises[i];
    insertRoutineExercise.run(3, ex.exercise_id, i, ex.sets, ex.reps, ex.rest);
  }

  insertRoutine.run(2, 'HIIT Blast', new Date(now - 22 * 86400000).toISOString());
  const sarahHIITExercises = [
    { exercise_id: 49, sets: 4, reps: 10, rest: 30 },   // Burpees
    { exercise_id: 50, sets: 4, reps: 20, rest: 30 },   // Mountain Climbers
    { exercise_id: 51, sets: 4, reps: 50, rest: 30 },   // Jump Rope
    { exercise_id: 52, sets: 4, reps: 10, rest: 30 },   // Box Jumps
    { exercise_id: 6, sets: 4, reps: 15, rest: 30 }     // Push-ups
  ];
  for (let i = 0; i < sarahHIITExercises.length; i++) {
    const ex = sarahHIITExercises[i];
    insertRoutineExercise.run(4, ex.exercise_id, i, ex.sets, ex.reps, ex.rest);
  }

  // Alex's routines
  insertRoutine.run(3, 'Beginner Full Body', new Date(now - 18 * 86400000).toISOString());
  const alexBeginnerExercises = [
    { exercise_id: 6, sets: 3, reps: 10, rest: 90 },    // Push-ups
    { exercise_id: 12, sets: 3, reps: 10, rest: 90 },   // Lat Pulldown
    { exercise_id: 19, sets: 3, reps: 10, rest: 90 },   // Leg Press
    { exercise_id: 21, sets: 2, reps: 12, rest: 60 },   // Leg Extension
    { exercise_id: 34, sets: 2, reps: 12, rest: 60 },   // Barbell Curl
    { exercise_id: 38, sets: 2, reps: 12, rest: 60 }    // Tricep Pushdown
  ];
  for (let i = 0; i < alexBeginnerExercises.length; i++) {
    const ex = alexBeginnerExercises[i];
    insertRoutineExercise.run(5, ex.exercise_id, i, ex.sets, ex.reps, ex.rest);
  }

  // Insert workout logs
  const insertLog = db.prepare(
    'INSERT INTO workout_logs (user_id, started_at, completed_at, notes) VALUES (?, ?, ?, ?)'
  );
  const insertSet = db.prepare(
    'INSERT INTO workout_sets (log_id, exercise_id, set_number, weight, reps, completed_at) VALUES (?, ?, ?, ?, ?, ?)'
  );

  // Marcus's workout history
  const marcusWorkouts = [
    {
      started: now - 28 * 86400000,
      duration: 62 * 60000,
      notes: 'Great push session, hit a new PR on bench!',
      exercises: [
        { id: 1, sets: [{ weight: 185, reps: 5 }, { weight: 185, reps: 5 }, { weight: 185, reps: 5 }, { weight: 190, reps: 4 }] },
        { id: 2, sets: [{ weight: 135, reps: 8 }, { weight: 135, reps: 8 }, { weight: 140, reps: 7 }] },
        { id: 27, sets: [{ weight: 115, reps: 6 }, { weight: 115, reps: 6 }, { weight: 115, reps: 5 }, { weight: 115, reps: 5 }] },
        { id: 38, sets: [{ weight: 70, reps: 12 }, { weight: 70, reps: 12 }, { weight: 75, reps: 10 }] }
      ]
    },
    {
      started: now - 26 * 86400000,
      duration: 55 * 60000,
      notes: 'Leg day was brutal but satisfying',
      exercises: [
        { id: 18, sets: [{ weight: 275, reps: 5 }, { weight: 275, reps: 5 }, { weight: 280, reps: 4 }, { weight: 280, reps: 4 }] },
        { id: 19, sets: [{ weight: 360, reps: 10 }, { weight: 360, reps: 10 }, { weight: 380, reps: 8 }] },
        { id: 24, sets: [{ weight: 185, reps: 8 }, { weight: 185, reps: 8 }, { weight: 195, reps: 7 }] },
        { id: 23, sets: [{ weight: 135, reps: 15 }, { weight: 135, reps: 15 }, { weight: 145, reps: 12 }] }
      ]
    },
    {
      started: now - 24 * 86400000,
      duration: 58 * 60000,
      notes: 'Pull day, feeling stronger on rows',
      exercises: [
        { id: 10, sets: [{ weight: 0, reps: 8 }, { weight: 0, reps: 8 }, { weight: 0, reps: 7 }, { weight: 0, reps: 6 }] },
        { id: 11, sets: [{ weight: 155, reps: 8 }, { weight: 155, reps: 8 }, { weight: 160, reps: 7 }, { weight: 160, reps: 6 }] },
        { id: 12, sets: [{ weight: 130, reps: 10 }, { weight: 130, reps: 10 }, { weight: 140, reps: 8 }] },
        { id: 34, sets: [{ weight: 75, reps: 10 }, { weight: 75, reps: 10 }, { weight: 80, reps: 8 }] }
      ]
    },
    {
      started: now - 21 * 86400000,
      duration: 65 * 60000,
      notes: 'Upper body power, new OHP PR!',
      exercises: [
        { id: 27, sets: [{ weight: 120, reps: 5 }, { weight: 120, reps: 5 }, { weight: 125, reps: 4 }, { weight: 125, reps: 4 }] },
        { id: 1, sets: [{ weight: 190, reps: 5 }, { weight: 190, reps: 5 }, { weight: 195, reps: 4 }, { weight: 195, reps: 3 }] },
        { id: 11, sets: [{ weight: 165, reps: 6 }, { weight: 165, reps: 6 }, { weight: 165, reps: 5 }, { weight: 170, reps: 4 }] },
        { id: 10, sets: [{ weight: 0, reps: 9 }, { weight: 0, reps: 8 }, { weight: 0, reps: 7 }, { weight: 0, reps: 6 }] }
      ]
    },
    {
      started: now - 18 * 86400000,
      duration: 60 * 60000,
      notes: null,
      exercises: [
        { id: 18, sets: [{ weight: 285, reps: 5 }, { weight: 285, reps: 4 }, { weight: 285, reps: 4 }, { weight: 290, reps: 3 }] },
        { id: 19, sets: [{ weight: 380, reps: 10 }, { weight: 400, reps: 8 }, { weight: 400, reps: 7 }] },
        { id: 26, sets: [{ weight: 50, reps: 10 }, { weight: 50, reps: 10 }, { weight: 55, reps: 8 }] },
        { id: 22, sets: [{ weight: 90, reps: 12 }, { weight: 90, reps: 12 }, { weight: 95, reps: 10 }] }
      ]
    },
    {
      started: now - 15 * 86400000,
      duration: 50 * 60000,
      notes: 'Quick push session before work',
      exercises: [
        { id: 1, sets: [{ weight: 195, reps: 5 }, { weight: 195, reps: 4 }, { weight: 200, reps: 3 }] },
        { id: 2, sets: [{ weight: 145, reps: 8 }, { weight: 145, reps: 7 }, { weight: 145, reps: 7 }] },
        { id: 28, sets: [{ weight: 25, reps: 12 }, { weight: 25, reps: 12 }, { weight: 30, reps: 10 }] },
        { id: 7, sets: [{ weight: 0, reps: 10 }, { weight: 0, reps: 10 }, { weight: 0, reps: 8 }] }
      ]
    },
    {
      started: now - 12 * 86400000,
      duration: 70 * 60000,
      notes: 'Long pull session with extra volume',
      exercises: [
        { id: 10, sets: [{ weight: 0, reps: 10 }, { weight: 0, reps: 9 }, { weight: 0, reps: 8 }, { weight: 0, reps: 7 }] },
        { id: 11, sets: [{ weight: 170, reps: 6 }, { weight: 170, reps: 6 }, { weight: 175, reps: 5 }, { weight: 175, reps: 5 }] },
        { id: 14, sets: [{ weight: 135, reps: 10 }, { weight: 145, reps: 8 }, { weight: 145, reps: 8 }] },
        { id: 35, sets: [{ weight: 35, reps: 12 }, { weight: 35, reps: 12 }, { weight: 40, reps: 10 }] },
        { id: 15, sets: [{ weight: 40, reps: 15 }, { weight: 40, reps: 15 }, { weight: 45, reps: 12 }] }
      ]
    },
    {
      started: now - 9 * 86400000,
      duration: 55 * 60000,
      notes: 'Leg day, squats feeling heavy',
      exercises: [
        { id: 18, sets: [{ weight: 290, reps: 4 }, { weight: 290, reps: 4 }, { weight: 295, reps: 3 }] },
        { id: 25, sets: [{ weight: 270, reps: 10 }, { weight: 270, reps: 10 }, { weight: 280, reps: 8 }] },
        { id: 24, sets: [{ weight: 195, reps: 8 }, { weight: 195, reps: 8 }, { weight: 205, reps: 6 }] },
        { id: 21, sets: [{ weight: 110, reps: 12 }, { weight: 110, reps: 12 }, { weight: 115, reps: 10 }] }
      ]
    },
    {
      started: now - 5 * 86400000,
      duration: 45 * 60000,
      notes: 'Arm day focused',
      exercises: [
        { id: 34, sets: [{ weight: 85, reps: 10 }, { weight: 85, reps: 10 }, { weight: 90, reps: 8 }] },
        { id: 35, sets: [{ weight: 40, reps: 12 }, { weight: 40, reps: 12 }, { weight: 45, reps: 10 }] },
        { id: 39, sets: [{ weight: 65, reps: 10 }, { weight: 65, reps: 10 }, { weight: 70, reps: 8 }] },
        { id: 41, sets: [{ weight: 0, reps: 12 }, { weight: 0, reps: 12 }, { weight: 0, reps: 10 }] },
        { id: 42, sets: [{ weight: 135, reps: 10 }, { weight: 135, reps: 10 }, { weight: 145, reps: 8 }] }
      ]
    },
    {
      started: now - 2 * 86400000,
      duration: 60 * 60000,
      notes: 'Push day, finally hit 2 plates on bench!',
      exercises: [
        { id: 1, sets: [{ weight: 200, reps: 4 }, { weight: 200, reps: 4 }, { weight: 205, reps: 3 }, { weight: 205, reps: 3 }] },
        { id: 2, sets: [{ weight: 145, reps: 8 }, { weight: 145, reps: 8 }, { weight: 150, reps: 7 }] },
        { id: 27, sets: [{ weight: 125, reps: 5 }, { weight: 125, reps: 5 }, { weight: 130, reps: 4 }] },
        { id: 28, sets: [{ weight: 30, reps: 12 }, { weight: 30, reps: 12 }, { weight: 30, reps: 10 }] },
        { id: 38, sets: [{ weight: 75, reps: 12 }, { weight: 75, reps: 12 }, { weight: 80, reps: 10 }] }
      ]
    }
  ];

  // Sarah's workout history
  const sarahWorkouts = [
    {
      started: now - 22 * 86400000,
      duration: 40 * 60000,
      notes: 'First time trying this routine',
      exercises: [
        { id: 4, sets: [{ weight: 20, reps: 12 }, { weight: 20, reps: 12 }, { weight: 22.5, reps: 10 }] },
        { id: 28, sets: [{ weight: 12.5, reps: 15 }, { weight: 12.5, reps: 15 }, { weight: 15, reps: 12 }] },
        { id: 29, sets: [{ weight: 10, reps: 12 }, { weight: 10, reps: 12 }, { weight: 12.5, reps: 10 }] },
        { id: 30, sets: [{ weight: 10, reps: 15 }, { weight: 10, reps: 15 }, { weight: 12.5, reps: 12 }] },
        { id: 43, sets: [{ weight: 0, reps: 45 }, { weight: 0, reps: 50 }, { weight: 0, reps: 40 }] }
      ]
    },
    {
      started: now - 19 * 86400000,
      duration: 30 * 60000,
      notes: 'HIIT is no joke! Great cardio',
      exercises: [
        { id: 49, sets: [{ weight: 0, reps: 10 }, { weight: 0, reps: 10 }, { weight: 0, reps: 8 }, { weight: 0, reps: 8 }] },
        { id: 50, sets: [{ weight: 0, reps: 20 }, { weight: 0, reps: 20 }, { weight: 0, reps: 18 }, { weight: 0, reps: 15 }] },
        { id: 51, sets: [{ weight: 0, reps: 50 }, { weight: 0, reps: 45 }, { weight: 0, reps: 40 }, { weight: 0, reps: 35 }] },
        { id: 6, sets: [{ weight: 0, reps: 12 }, { weight: 0, reps: 12 }, { weight: 0, reps: 10 }, { weight: 0, reps: 10 }] }
      ]
    },
    {
      started: now - 16 * 86400000,
      duration: 45 * 60000,
      notes: 'Full body day',
      exercises: [
        { id: 18, sets: [{ weight: 95, reps: 10 }, { weight: 95, reps: 10 }, { weight: 100, reps: 8 }] },
        { id: 12, sets: [{ weight: 70, reps: 10 }, { weight: 70, reps: 10 }, { weight: 75, reps: 8 }] },
        { id: 6, sets: [{ weight: 0, reps: 15 }, { weight: 0, reps: 12 }, { weight: 0, reps: 12 }] },
        { id: 22, sets: [{ weight: 50, reps: 12 }, { weight: 50, reps: 12 }, { weight: 55, reps: 10 }] },
        { id: 46, sets: [{ weight: 0, reps: 20 }, { weight: 0, reps: 20 }, { weight: 0, reps: 18 }] }
      ]
    },
    {
      started: now - 13 * 86400000,
      duration: 35 * 60000,
      notes: 'Quick arm and shoulder session',
      exercises: [
        { id: 34, sets: [{ weight: 25, reps: 12 }, { weight: 25, reps: 12 }, { weight: 30, reps: 10 }] },
        { id: 35, sets: [{ weight: 15, reps: 12 }, { weight: 15, reps: 12 }, { weight: 17.5, reps: 10 }] },
        { id: 38, sets: [{ weight: 30, reps: 12 }, { weight: 30, reps: 12 }, { weight: 35, reps: 10 }] },
        { id: 28, sets: [{ weight: 12.5, reps: 15 }, { weight: 12.5, reps: 15 }, { weight: 15, reps: 12 }] }
      ]
    },
    {
      started: now - 10 * 86400000,
      duration: 25 * 60000,
      notes: 'Short but intense HIIT',
      exercises: [
        { id: 49, sets: [{ weight: 0, reps: 12 }, { weight: 0, reps: 10 }, { weight: 0, reps: 10 }] },
        { id: 52, sets: [{ weight: 0, reps: 10 }, { weight: 0, reps: 10 }, { weight: 0, reps: 8 }] },
        { id: 53, sets: [{ weight: 16, reps: 15 }, { weight: 16, reps: 15 }, { weight: 16, reps: 12 }] },
        { id: 50, sets: [{ weight: 0, reps: 20 }, { weight: 0, reps: 20 }, { weight: 0, reps: 18 }] }
      ]
    },
    {
      started: now - 7 * 86400000,
      duration: 40 * 60000,
      notes: 'Tone & sculpt day, feeling the burn',
      exercises: [
        { id: 4, sets: [{ weight: 22.5, reps: 12 }, { weight: 22.5, reps: 12 }, { weight: 25, reps: 10 }] },
        { id: 28, sets: [{ weight: 15, reps: 15 }, { weight: 15, reps: 15 }, { weight: 15, reps: 12 }] },
        { id: 29, sets: [{ weight: 12.5, reps: 12 }, { weight: 12.5, reps: 12 }, { weight: 15, reps: 10 }] },
        { id: 30, sets: [{ weight: 12.5, reps: 15 }, { weight: 12.5, reps: 15 }, { weight: 15, reps: 12 }] },
        { id: 43, sets: [{ weight: 0, reps: 50 }, { weight: 0, reps: 55 }, { weight: 0, reps: 45 }] }
      ]
    },
    {
      started: now - 3 * 86400000,
      duration: 30 * 60000,
      notes: null,
      exercises: [
        { id: 18, sets: [{ weight: 100, reps: 10 }, { weight: 100, reps: 10 }, { weight: 105, reps: 8 }] },
        { id: 19, sets: [{ weight: 150, reps: 12 }, { weight: 150, reps: 12 }, { weight: 160, reps: 10 }] },
        { id: 21, sets: [{ weight: 55, reps: 12 }, { weight: 55, reps: 12 }, { weight: 60, reps: 10 }] },
        { id: 23, sets: [{ weight: 70, reps: 15 }, { weight: 70, reps: 15 }, { weight: 75, reps: 12 }] }
      ]
    }
  ];

  // Alex's workout history
  const alexWorkouts = [
    {
      started: now - 15 * 86400000,
      duration: 50 * 60000,
      notes: 'First gym session in months',
      exercises: [
        { id: 6, sets: [{ weight: 0, reps: 8 }, { weight: 0, reps: 8 }, { weight: 0, reps: 7 }] },
        { id: 12, sets: [{ weight: 60, reps: 10 }, { weight: 60, reps: 10 }, { weight: 60, reps: 8 }] },
        { id: 19, sets: [{ weight: 180, reps: 10 }, { weight: 180, reps: 10 }, { weight: 180, reps: 8 }] },
        { id: 34, sets: [{ weight: 20, reps: 12 }, { weight: 20, reps: 12 }, { weight: 20, reps: 10 }] },
        { id: 38, sets: [{ weight: 25, reps: 12 }, { weight: 25, reps: 12 }, { weight: 25, reps: 10 }] }
      ]
    },
    {
      started: now - 12 * 86400000,
      duration: 45 * 60000,
      notes: 'Getting back into it',
      exercises: [
        { id: 18, sets: [{ weight: 135, reps: 8 }, { weight: 135, reps: 8 }, { weight: 135, reps: 7 }] },
        { id: 12, sets: [{ weight: 65, reps: 10 }, { weight: 65, reps: 10 }, { weight: 65, reps: 9 }] },
        { id: 21, sets: [{ weight: 50, reps: 12 }, { weight: 50, reps: 12 }, { weight: 50, reps: 10 }] },
        { id: 22, sets: [{ weight: 45, reps: 12 }, { weight: 45, reps: 12 }, { weight: 45, reps: 10 }] }
      ]
    },
    {
      started: now - 8 * 86400000,
      duration: 55 * 60000,
      notes: 'Feeling stronger already',
      exercises: [
        { id: 6, sets: [{ weight: 0, reps: 10 }, { weight: 0, reps: 10 }, { weight: 0, reps: 8 }] },
        { id: 11, sets: [{ weight: 85, reps: 8 }, { weight: 85, reps: 8 }, { weight: 90, reps: 7 }] },
        { id: 19, sets: [{ weight: 200, reps: 10 }, { weight: 200, reps: 10 }, { weight: 210, reps: 8 }] },
        { id: 34, sets: [{ weight: 25, reps: 12 }, { weight: 25, reps: 12 }, { weight: 30, reps: 10 }] },
        { id: 38, sets: [{ weight: 30, reps: 12 }, { weight: 30, reps: 12 }, { weight: 35, reps: 10 }] }
      ]
    },
    {
      started: now - 4 * 86400000,
      duration: 50 * 60000,
      notes: null,
      exercises: [
        { id: 1, sets: [{ weight: 115, reps: 8 }, { weight: 115, reps: 8 }, { weight: 120, reps: 7 }] },
        { id: 27, sets: [{ weight: 65, reps: 8 }, { weight: 65, reps: 8 }, { weight: 70, reps: 7 }] },
        { id: 12, sets: [{ weight: 70, reps: 10 }, { weight: 70, reps: 10 }, { weight: 75, reps: 8 }] },
        { id: 35, sets: [{ weight: 15, reps: 12 }, { weight: 15, reps: 12 }, { weight: 17.5, reps: 10 }] },
        { id: 40, sets: [{ weight: 0, reps: 10 }, { weight: 0, reps: 10 }, { weight: 0, reps: 8 }] }
      ]
    },
    {
      started: now - 1 * 86400000,
      duration: 40 * 60000,
      notes: 'Quick full body',
      exercises: [
        { id: 18, sets: [{ weight: 145, reps: 8 }, { weight: 145, reps: 8 }, { weight: 150, reps: 7 }] },
        { id: 6, sets: [{ weight: 0, reps: 12 }, { weight: 0, reps: 10 }, { weight: 0, reps: 10 }] },
        { id: 19, sets: [{ weight: 210, reps: 10 }, { weight: 210, reps: 10 }, { weight: 220, reps: 8 }] },
        { id: 44, sets: [{ weight: 0, reps: 20 }, { weight: 0, reps: 20 }, { weight: 0, reps: 18 }] }
      ]
    }
  ];

  // Insert all workouts
  function insertWorkout(userId, workout) {
    const startedAt = new Date(workout.started).toISOString();
    const completedAt = new Date(workout.started + workout.duration).toISOString();
    
    const result = insertLog.run(userId, startedAt, completedAt, workout.notes);
    const logId = result.lastInsertRowid;

    for (const exercise of workout.exercises) {
      for (let i = 0; i < exercise.sets.length; i++) {
        const set = exercise.sets[i];
        const setCompletedAt = new Date(workout.started + (i + 1) * 5 * 60000).toISOString();
        insertSet.run(logId, exercise.id, i + 1, set.weight, set.reps, setCompletedAt);
      }
    }
    return logId;
  }

  for (const w of marcusWorkouts) insertWorkout(1, w);
  for (const w of sarahWorkouts) insertWorkout(2, w);
  for (const w of alexWorkouts) insertWorkout(3, w);

  // Insert personal records
  const insertPR = db.prepare(
    'INSERT INTO personal_records (user_id, exercise_id, type, value, date) VALUES (?, ?, ?, ?, ?)'
  );

  // Marcus's PRs
  const marcusPRs = [
    { exercise_id: 1, type: 'weight', value: 205, date: now - 2 * 86400000 },   // Bench Press
    { exercise_id: 1, type: 'reps', value: 5, date: now - 5 * 86400000 },
    { exercise_id: 1, type: 'volume', value: 3690, date: now - 2 * 86400000 },
    { exercise_id: 27, type: 'weight', value: 130, date: now - 2 * 86400000 },  // OHP
    { exercise_id: 18, type: 'weight', value: 295, date: now - 9 * 86400000 },  // Squat
    { exercise_id: 18, type: 'volume', value: 5850, date: now - 18 * 86400000 },
    { exercise_id: 11, type: 'weight', value: 175, date: now - 12 * 86400000 }, // Row
    { exercise_id: 34, type: 'weight', value: 90, date: now - 5 * 86400000 },   // Curl
    { exercise_id: 10, type: 'reps', value: 10, date: now - 12 * 86400000 },    // Pull-ups
    { exercise_id: 19, type: 'weight', value: 400, date: now - 18 * 86400000 }, // Leg Press
    { exercise_id: 39, type: 'weight', value: 70, date: now - 5 * 86400000 },   // Skullcrushers
    { exercise_id: 42, type: 'weight', value: 145, date: now - 5 * 86400000 }   // Close Grip Bench
  ];

  for (const pr of marcusPRs) {
    insertPR.run(1, pr.exercise_id, pr.type, pr.value, new Date(pr.date).toISOString());
  }

  // Sarah's PRs
  const sarahPRs = [
    { exercise_id: 18, type: 'weight', value: 105, date: now - 3 * 86400000 },  // Squat
    { exercise_id: 19, type: 'weight', value: 160, date: now - 3 * 86400000 },  // Leg Press
    { exercise_id: 12, type: 'weight', value: 75, date: now - 16 * 86400000 },  // Lat Pulldown
    { exercise_id: 34, type: 'weight', value: 30, date: now - 13 * 86400000 },  // Curl
    { exercise_id: 28, type: 'weight', value: 15, date: now - 7 * 86400000 },   // Lateral Raise
    { exercise_id: 49, type: 'reps', value: 12, date: now - 10 * 86400000 },    // Burpees
    { exercise_id: 53, type: 'weight', value: 16, date: now - 10 * 86400000 },  // Kettlebell Swing
    { exercise_id: 4, type: 'weight', value: 25, date: now - 7 * 86400000 },    // Flyes
    { exercise_id: 43, type: 'reps', value: 55, date: now - 7 * 86400000 }      // Plank (seconds)
  ];

  for (const pr of sarahPRs) {
    insertPR.run(2, pr.exercise_id, pr.type, pr.value, new Date(pr.date).toISOString());
  }

  // Alex's PRs
  const alexPRs = [
    { exercise_id: 18, type: 'weight', value: 150, date: now - 1 * 86400000 },  // Squat
    { exercise_id: 19, type: 'weight', value: 220, date: now - 1 * 86400000 },  // Leg Press
    { exercise_id: 1, type: 'weight', value: 120, date: now - 4 * 86400000 },   // Bench Press
    { exercise_id: 27, type: 'weight', value: 70, date: now - 4 * 86400000 },   // OHP
    { exercise_id: 11, type: 'weight', value: 90, date: now - 8 * 86400000 },   // Row
    { exercise_id: 6, type: 'reps', value: 12, date: now - 1 * 86400000 },      // Push-ups
    { exercise_id: 12, type: 'weight', value: 75, date: now - 4 * 86400000 },   // Lat Pulldown
    { exercise_id: 34, type: 'weight', value: 30, date: now - 4 * 86400000 },   // Curl
    { exercise_id: 38, type: 'weight', value: 35, date: now - 4 * 86400000 }    // Tricep Pushdown
  ];

  for (const pr of alexPRs) {
    insertPR.run(3, pr.exercise_id, pr.type, pr.value, new Date(pr.date).toISOString());
  }
});

insertAll();

// Get final counts for summary
const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
const routineCount = db.prepare('SELECT COUNT(*) as count FROM custom_routines').get().count;
const routineExCount = db.prepare('SELECT COUNT(*) as count FROM routine_exercises').get().count;
const templateExCount = db.prepare('SELECT COUNT(*) as count FROM template_exercises').get().count;
const logCount = db.prepare('SELECT COUNT(*) as count FROM workout_logs').get().count;
const setCount = db.prepare('SELECT COUNT(*) as count FROM workout_sets').get().count;
const prCount = db.prepare('SELECT COUNT(*) as count FROM personal_records').get().count;

db.close();

console.log('===========================================');
console.log('FitForge Database Seeded Successfully!');
console.log('===========================================');
console.log(`Seeded: ${userCount} users, ${routineCount} custom routines, ${routineExCount} routine exercises`);
console.log(`        ${templateExCount} template exercises, ${logCount} workout logs`);
console.log(`        ${setCount} workout sets, ${prCount} personal records`);
console.log('');
console.log('Demo users:');
console.log('  marcus.johnson@email.com / password123');
console.log('  sarah.chen@email.com / password123');
console.log('  alex.rivera@email.com / password123');
console.log('===========================================');