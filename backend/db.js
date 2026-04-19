import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(path.join(dataDir, 'app.db'));
db.pragma('journal_mode = WAL');

const schema = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS exercises (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  muscle_group TEXT NOT NULL,
  difficulty TEXT,
  description TEXT,
  equipment TEXT
);

CREATE TABLE IF NOT EXISTS workout_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  goal TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS template_exercises (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  template_id INTEGER NOT NULL,
  exercise_id INTEGER NOT NULL,
  sets INTEGER,
  reps INTEGER,
  FOREIGN KEY (template_id) REFERENCES workout_templates(id) ON DELETE CASCADE,
  FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS custom_routines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS routine_exercises (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  routine_id INTEGER NOT NULL,
  exercise_id INTEGER NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  sets INTEGER,
  reps INTEGER,
  rest_seconds INTEGER DEFAULT 60,
  FOREIGN KEY (routine_id) REFERENCES custom_routines(id) ON DELETE CASCADE,
  FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS workout_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  started_at TEXT DEFAULT (datetime('now')),
  completed_at TEXT,
  notes TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS workout_sets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  log_id INTEGER NOT NULL,
  exercise_id INTEGER NOT NULL,
  set_number INTEGER NOT NULL,
  weight REAL,
  reps INTEGER,
  completed_at TEXT,
  FOREIGN KEY (log_id) REFERENCES workout_logs(id) ON DELETE CASCADE,
  FOREIGN KEY (exercise_id) REFERENCES exercises(id)
);

CREATE TABLE IF NOT EXISTS personal_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  exercise_id INTEGER NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('weight', 'reps', 'volume')),
  value REAL NOT NULL,
  date TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
);
`;

db.exec(schema);

const count = db.prepare('SELECT COUNT(*) as count FROM exercises').get().count;
if (count === 0) {
  const exercises = [
    ['Bench Press', 'Chest', 'Intermediate', 'Classic compound chest builder', 'Barbell'],
    ['Incline Bench Press', 'Chest', 'Intermediate', 'Targets upper chest fibers', 'Barbell'],
    ['Decline Bench Press', 'Chest', 'Intermediate', 'Targets lower chest fibers', 'Barbell'],
    ['Dumbbell Flyes', 'Chest', 'Beginner', 'Isolation stretch for chest', 'Dumbbells'],
    ['Cable Crossover', 'Chest', 'Beginner', 'Constant tension chest exercise', 'Cable Machine'],
    ['Push-ups', 'Chest', 'Beginner', 'Bodyweight chest movement', 'Bodyweight'],
    ['Dips', 'Chest', 'Advanced', 'Bodyweight chest/triceps movement', 'Parallel Bars'],
    ['Pec Deck', 'Chest', 'Beginner', 'Machine flye variation', 'Machine'],
    ['Deadlift', 'Back', 'Advanced', 'Posterior chain developer', 'Barbell'],
    ['Pull-ups', 'Back', 'Advanced', 'Vertical pulling movement', 'Pull-up Bar'],
    ['Bent-over Row', 'Back', 'Intermediate', 'Horizontal rowing movement', 'Barbell'],
    ['Lat Pulldown', 'Back', 'Beginner', 'Machine assisted pull movement', 'Cable Machine'],
    ['Seated Cable Row', 'Back', 'Beginner', 'Supported horizontal row', 'Cable Machine'],
    ['T-Bar Row', 'Back', 'Intermediate', 'Landmine row variation', 'T-Bar'],
    ['Face Pulls', 'Back', 'Beginner', 'Rear delt and trap isolation', 'Cable Machine'],
    ['Chin-ups', 'Back', 'Intermediate', 'Supinated grip pull', 'Pull-up Bar'],
    ['Barbell Shrug', 'Back', 'Beginner', 'Trap isolation', 'Barbell'],
    ['Squat', 'Legs', 'Intermediate', 'King of leg exercises', 'Barbell'],
    ['Leg Press', 'Legs', 'Beginner', 'Machine supported squat', 'Leg Press'],
    ['Lunges', 'Legs', 'Beginner', 'Unilateral leg movement', 'Dumbbells'],
    ['Leg Extension', 'Legs', 'Beginner', 'Quadricep isolation', 'Machine'],
    ['Leg Curl', 'Legs', 'Beginner', 'Hamstring isolation', 'Machine'],
    ['Calf Raises', 'Legs', 'Beginner', 'Calf isolation', 'Machine'],
    ['Romanian Deadlift', 'Legs', 'Intermediate', 'Hamstring focused hinge', 'Barbell'],
    ['Hack Squat', 'Legs', 'Intermediate', 'Machine squat variation', 'Machine'],
    ['Bulgarian Split Squat', 'Legs', 'Intermediate', 'Unilateral quad builder', 'Dumbbells/Bench'],
    ['Overhead Press', 'Shoulders', 'Intermediate', 'Vertical pushing movement', 'Barbell'],
    ['Lateral Raise', 'Shoulders', 'Beginner', 'Side delt isolation', 'Dumbbells'],
    ['Front Raise', 'Shoulders', 'Beginner', 'Front delt isolation', 'Dumbbells'],
    ['Rear Delt Fly', 'Shoulders', 'Beginner', 'Rear delt isolation', 'Dumbbells'],
    ['Shrugs', 'Shoulders', 'Beginner', 'Upper trap isolation', 'Dumbbells'],
    ['Arnold Press', 'Shoulders', 'Intermediate', 'Rotational press', 'Dumbbells'],
    ['Upright Row', 'Shoulders', 'Beginner', 'Shoulder and trap builder', 'Barbell'],
    ['Barbell Curl', 'Arms', 'Beginner', 'Bicep mass builder', 'Barbell'],
    ['Hammer Curl', 'Arms', 'Beginner', 'Brachialis builder', 'Dumbbells'],
    ['Preacher Curl', 'Arms', 'Beginner', 'Isolated bicep curl', 'EZ Bar'],
    ['Concentration Curl', 'Arms', 'Beginner', 'Peak bicep focus', 'Dumbbell'],
    ['Tricep Pushdown', 'Arms', 'Beginner', 'Tricep isolation', 'Cable Machine'],
    ['Skullcrushers', 'Arms', 'Intermediate', 'Overhead tricep extension', 'EZ Bar'],
    ['Overhead Tricep Extension', 'Arms', 'Beginner', 'Long head tricep focus', 'Dumbbell'],
    ['Tricep Dips', 'Arms', 'Intermediate', 'Bodyweight triceps', 'Bench'],
    ['Close Grip Bench Press', 'Arms', 'Intermediate', 'Compound tricep movement', 'Barbell'],
    ['Plank', 'Core', 'Beginner', 'Isometric core stability', 'Bodyweight'],
    ['Crunches', 'Core', 'Beginner', 'Abdominal flexion', 'Bodyweight'],
    ['Leg Raises', 'Core', 'Intermediate', 'Lower ab focus', 'Bodyweight'],
    ['Russian Twists', 'Core', 'Beginner', 'Rotational core work', 'Bodyweight'],
    ['Hanging Leg Raise', 'Core', 'Advanced', 'Gymnastic ab movement', 'Pull-up Bar'],
    ['Bicycle Crunches', 'Core', 'Beginner', 'Dynamic ab movement', 'Bodyweight'],
    ['Weighted Sit-ups', 'Core', 'Intermediate', 'Weighted ab flexion', 'Weight/Plate'],
    ['Burpees', 'Cardio', 'Advanced', 'Full body conditioning', 'Bodyweight'],
    ['Mountain Climbers', 'Cardio', 'Intermediate', 'Dynamic cardio movement', 'Bodyweight'],
    ['Jump Rope', 'Cardio', 'Intermediate', 'Coordination and conditioning', 'Jump Rope'],
    ['Box Jumps', 'Cardio', 'Intermediate', 'Plyometric leg power', 'Plyo Box'],
    ['Kettlebell Swing', 'Full Body', 'Intermediate', 'Hip hinge conditioning', 'Kettlebell'],
    ['Battle Ropes', 'Full Body', 'Intermediate', 'High intensity conditioning', 'Ropes']
  ];

  const insert = db.prepare('INSERT INTO exercises (name, muscle_group, difficulty, description, equipment) VALUES (?, ?, ?, ?, ?)');
  const insertMany = db.transaction((data) => {
    for (const item of data) insert.run(item);
  });
  insertMany(exercises);

  const templates = [
    ['Push Day', 'Strength'],
    ['Pull Day', 'Strength'],
    ['Leg Day', 'Strength'],
    ['Full Body Circuit', 'Endurance']
  ];
  const insertTpl = db.prepare('INSERT INTO workout_templates (name, goal) VALUES (?, ?)');
  const insertManyTpl = db.transaction((data) => {
    for (const item of data) insertTpl.run(item);
  });
  insertManyTpl(templates);
}

export default db;