import Database from 'better-sqlite3';
import fs from 'fs';
import crypto from 'crypto';

fs.mkdirSync('data', { recursive: true });

const db = new Database('./data/app.db');
db.pragma('journal_mode = WAL');

const count = db.prepare('SELECT COUNT(*) as count FROM custom_routines').get();
if (count.count > 0) {
  console.log('Data already seeded, skipping...');
  process.exit(0);
}

// Password hashing helper
const hashPassword = (password) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return salt + ':' + hash;
};

// Generate timestamp helper
const daysAgo = (days, hoursOffset = 0) => {
  return new Date(Date.now() - days * 86400000 + hoursOffset * 3600000).toISOString();
};

const insertAll = db.transaction(() => {
  // Insert users
  const insertUser = db.prepare(
    'INSERT INTO users (email, password_hash, name, created_at) VALUES (?, ?, ?, ?)'
  );

  const users = [
    ['alex.thompson@email.com', hashPassword('password123'), 'Alex Thompson', daysAgo(45)],
    ['maria.santos@email.com', hashPassword('password123'), 'Maria Santos', daysAgo(38)],
    ['j.wilson@email.com', hashPassword('password123'), 'James Wilson', daysAgo(25)],
  ];
  users.forEach(u => insertUser.run(u));

  // Insert template exercises
  const insertTemplateExercise = db.prepare(
    'INSERT INTO template_exercises (template_id, exercise_id, sets, reps) VALUES (?, ?, ?, ?)'
  );

  // Push Day (template 1) - Chest, Shoulders, Triceps
  const pushExercises = [
    [1, 1, 4, 8],   // Bench Press
    [1, 2, 3, 10],  // Incline Bench Press
    [1, 27, 4, 6],  // Overhead Press
    [1, 28, 3, 12], // Lateral Raise
    [1, 38, 3, 12], // Tricep Pushdown
    [1, 39, 3, 10], // Skullcrushers
  ];
  pushExercises.forEach(e => insertTemplateExercise.run(e));

  // Pull Day (template 2) - Back, Biceps
  const pullExercises = [
    [2, 10, 4, 8],  // Pull-ups
    [2, 11, 4, 8],  // Bent-over Row
    [2, 12, 3, 12], // Lat Pulldown
    [2, 13, 3, 12], // Seated Cable Row
    [2, 15, 3, 15], // Face Pulls
    [2, 34, 3, 10], // Barbell Curl
    [2, 35, 3, 12], // Hammer Curl
  ];
  pullExercises.forEach(e => insertTemplateExercise.run(e));

  // Leg Day (template 3) - Legs, Core
  const legExercises = [
    [3, 18, 4, 6],  // Squat
    [3, 19, 4, 10], // Leg Press
    [3, 24, 3, 8],  // Romanian Deadlift
    [3, 20, 3, 12], // Lunges
    [3, 21, 3, 15], // Leg Extension
    [3, 22, 3, 15], // Leg Curl
    [3, 23, 4, 15], // Calf Raises
    [3, 43, 3, 60], // Plank (60 seconds)
  ];
  legExercises.forEach(e => insertTemplateExercise.run(e));

  // Full Body Circuit (template 4) - Mix of exercises
  const circuitExercises = [
    [4, 6, 3, 15],  // Push-ups
    [4, 10, 3, 8],  // Pull-ups
    [4, 18, 3, 10], // Squat
    [4, 50, 3, 10], // Burpees
    [4, 51, 3, 20], // Mountain Climbers
    [4, 54, 3, 15], // Kettlebell Swing
  ];
  circuitExercises.forEach(e => insertTemplateExercise.run(e));

  // Insert custom routines
  const insertRoutine = db.prepare(
    'INSERT INTO custom_routines (user_id, name, created_at) VALUES (?, ?, ?)'
  );

  const routines = [
    [1, 'Powerlifting Program', daysAgo(40)],
    [1, 'Heavy Upper Body', daysAgo(35)],
    [2, 'Full Body Toning', daysAgo(30)],
    [2, 'HIIT Circuit', daysAgo(28)],
    [3, 'Beginner Basics', daysAgo(22)],
    [3, 'Quick 30-Min Workout', daysAgo(18)],
  ];
  routines.forEach(r => insertRoutine.run(r));

  // Insert routine exercises
  const insertRoutineExercise = db.prepare(
    'INSERT INTO routine_exercises (routine_id, exercise_id, order_index, sets, reps, rest_seconds) VALUES (?, ?, ?, ?, ?, ?)'
  );

  // Powerlifting Program (routine 1) - Alex
  const powerlifting = [
    [1, 1, 1, 5, 5, 180],   // Bench Press
    [1, 9, 2, 5, 5, 180],   // Deadlift
    [1, 18, 3, 5, 5, 180],  // Squat
    [1, 27, 4, 5, 5, 120],  // Overhead Press
    [1, 11, 5, 5, 5, 120],  // Bent-over Row
  ];
  powerlifting.forEach(e => insertRoutineExercise.run(e));

  // Heavy Upper Body (routine 2) - Alex
  const heavyUpper = [
    [2, 1, 1, 4, 6, 150],   // Bench Press
    [2, 2, 2, 3, 8, 120],   // Incline Bench Press
    [2, 27, 3, 4, 6, 120],  // Overhead Press
    [2, 11, 4, 4, 8, 120],  // Bent-over Row
    [2, 34, 5, 3, 10, 90],  // Barbell Curl
    [2, 42, 6, 3, 10, 90],  // Close Grip Bench Press
  ];
  heavyUpper.forEach(e => insertRoutineExercise.run(e));

  // Full Body Toning (routine 3) - Maria
  const toning = [
    [3, 18, 1, 3, 12, 90],  // Squat
    [3, 12, 2, 3, 12, 90],  // Lat Pulldown
    [3, 1, 3, 3, 10, 90],   // Bench Press
    [3, 27, 4, 3, 10, 90],  // Overhead Press
    [3, 22, 5, 3, 15, 60],  // Leg Curl
    [3, 28, 6, 3, 15, 60],  // Lateral Raise
    [3, 43, 7, 3, 45, 60],  // Plank
  ];
  toning.forEach(e => insertRoutineExercise.run(e));

  // HIIT Circuit (routine 4) - Maria
  const hiit = [
    [4, 50, 1, 4, 15, 30],  // Burpees
    [4, 6, 2, 4, 20, 30],   // Push-ups
    [4, 51, 3, 4, 20, 30],  // Mountain Climbers
    [4, 20, 4, 4, 12, 30],  // Lunges
    [4, 54, 5, 4, 15, 30],  // Kettlebell Swing
    [4, 53, 6, 4, 12, 30],  // Box Jumps
  ];
  hiit.forEach(e => insertRoutineExercise.run(e));

  // Beginner Basics (routine 5) - James
  const beginner = [
    [5, 6, 1, 3, 10, 90],   // Push-ups
    [5, 19, 2, 3, 12, 90],  // Leg Press
    [5, 12, 3, 3, 10, 90],  // Lat Pulldown
    [5, 21, 4, 3, 12, 60],  // Leg Extension
    [5, 44, 5, 3, 15, 60],  // Crunches
    [5, 46, 6, 3, 20, 60],  // Russian Twists
  ];
  beginner.forEach(e => insertRoutineExercise.run(e));

  // Quick 30-Min Workout (routine 6) - James
  const quickWorkout = [
    [6, 1, 1, 3, 10, 60],   // Bench Press
    [6, 18, 2, 3, 10, 60],  // Squat
    [6, 11, 3, 3, 10, 60],  // Bent-over Row
    [6, 27, 4, 3, 10, 60],  // Overhead Press
  ];
  quickWorkout.forEach(e => insertRoutineExercise.run(e));

  // Insert workout logs
  const insertLog = db.prepare(
    'INSERT INTO workout_logs (user_id, started_at, completed_at, notes) VALUES (?, ?, ?, ?)'
  );

  const logs = [
    // Alex's workouts
    [1, daysAgo(28, 7), daysAgo(28, 8.5), 'Heavy bench day, felt strong'],
    [1, daysAgo(26, 18), daysAgo(26, 19.2), 'Deadlift PR attempt'],
    [1, daysAgo(24, 8), daysAgo(24, 9.3), 'Squat session, depth was good'],
    [1, daysAgo(21, 17), daysAgo(21, 18.4), 'Upper body volume work'],
    [1, daysAgo(19, 7), daysAgo(19, 8.2), 'Quick bench session'],
    [1, daysAgo(17, 18), daysAgo(17, 19.5), 'Heavy deadlifts, grip was failing'],
    [1, daysAgo(14, 8), daysAgo(14, 9.6), 'Leg day, added extra calf work'],
    [1, daysAgo(12, 17), daysAgo(12, 18.3), 'Push day, shoulders feeling fatigued'],
    [1, daysAgo(10, 7), daysAgo(10, 8.1), 'Light bench, recovery week'],
    [1, daysAgo(7, 18), daysAgo(7, 19.4), 'Pull day, new PR on rows'],
    [1, daysAgo(5, 8), daysAgo(5, 9.2), 'Squat session, working on form'],
    [1, daysAgo(3, 17), daysAgo(3, 18.5), 'Upper body power day'],
    [1, daysAgo(1, 8), daysAgo(1, 9.3), 'Full body session, feeling great'],

    // Maria's workouts
    [2, daysAgo(27, 9), daysAgo(27, 10.2), 'Toning workout, increased weights'],
    [2, daysAgo(25, 17), daysAgo(25, 17.8), 'HIIT session, sweaty but good'],
    [2, daysAgo(22, 9), daysAgo(22, 10.4), 'Full body, added new exercises'],
    [2, daysAgo(20, 17), daysAgo(20, 17.7), 'Quick HIIT before dinner'],
    [2, daysAgo(18, 9), daysAgo(18, 10.3), 'Toning day, focus on glutes'],
    [2, daysAgo(15, 17), daysAgo(15, 17.9), 'HIIT with battle ropes'],
    [2, daysAgo(13, 9), daysAgo(13, 10.1), 'Upper body toning'],
    [2, daysAgo(11, 17), daysAgo(11, 17.6), 'Express HIIT circuit'],
    [2, daysAgo(8, 9), daysAgo(8, 10.5), 'Leg day toning, sore already'],
    [2, daysAgo(6, 17), daysAgo(6, 17.8), 'HIIT and core finisher'],
    [2, daysAgo(4, 9), daysAgo(4, 10.2), 'Full body, hit all muscle groups'],
    [2, daysAgo(2, 17), daysAgo(2, 17.5), 'Quick HIIT, 30 minutes flat'],
    [2, daysAgo(0, 9), daysAgo(0, 10.3), 'Morning toning session'],

    // James's workouts
    [3, daysAgo(20, 10), daysAgo(20, 11.1), 'First gym session, learning the ropes'],
    [3, daysAgo(18, 16), daysAgo(18, 16.9), 'Beginner workout, feeling sore'],
    [3, daysAgo(15, 10), daysAgo(15, 11.2), 'Second week, getting the hang of it'],
    [3, daysAgo(13, 16), daysAgo(13, 16.8), 'Quick workout, focused on form'],
    [3, daysAgo(10, 10), daysAgo(10, 11), 'Still learning, but feeling stronger'],
    [3, daysAgo(8, 16), daysAgo(8, 16.7), '30-minute express workout'],
    [3, daysAgo(5, 10), daysAgo(5, 11.3), 'Increasing weights slightly'],
    [3, daysAgo(3, 16), daysAgo(3, 16.9), 'Good session, no pain'],
    [3, daysAgo(1, 10), daysAgo(1, 11.1), 'Weekend workout, feeling motivated'],
  ];
  logs.forEach(l => insertLog.run(l));

  // Insert workout sets
  const insertSet = db.prepare(
    'INSERT INTO workout_sets (log_id, exercise_id, set_number, weight, reps, completed_at) VALUES (?, ?, ?, ?, ?, ?)'
  );

  // Alex's sets (user 1) - logs 1-13
  // Log 1: Bench day
  const alexSets = [
    // Log 1: Heavy bench
    [1, 1, 1, 135.0, 5, daysAgo(28, 7.1)],
    [1, 1, 2, 185.0, 5, daysAgo(28, 7.2)],
    [1, 1, 3, 205.0, 4, daysAgo(28, 7.3)],
    [1, 1, 4, 225.0, 3, daysAgo(28, 7.5)],
    [1, 27, 1, 95.0, 6, daysAgo(28, 7.7)],
    [1, 27, 2, 115.0, 5, daysAgo(28, 7.9)],
    [1, 27, 3, 115.0, 5, daysAgo(28, 8.1)],
    [1, 27, 4, 115.0, 4, daysAgo(28, 8.3)],

    // Log 2: Deadlift PR
    [2, 9, 1, 225.0, 5, daysAgo(26, 18.1)],
    [2, 9, 2, 275.0, 5, daysAgo(26, 18.2)],
    [2, 9, 3, 315.0, 3, daysAgo(26, 18.4)],
    [2, 9, 4, 365.0, 1, daysAgo(26, 18.6)],  // PR!
    [2, 11, 1, 135.0, 8, daysAgo(26, 18.8)],
    [2, 11, 2, 155.0, 8, daysAgo(26, 19.0)],
    [2, 11, 3, 155.0, 7, daysAgo(26, 19.1)],

    // Log 3: Squat
    [3, 18, 1, 135.0, 8, daysAgo(24, 8.1)],
    [3, 18, 2, 185.0, 6, daysAgo(24, 8.2)],
    [3, 18, 3, 225.0, 5, daysAgo(24, 8.4)],
    [3, 18, 4, 255.0, 4, daysAgo(24, 8.6)],
    [3, 24, 1, 135.0, 8, daysAgo(24, 8.8)],
    [3, 24, 2, 155.0, 8, daysAgo(24, 9.0)],
    [3, 24, 3, 175.0, 6, daysAgo(24, 9.1)],

    // Log 4: Upper body volume
    [4, 1, 1, 185.0, 8, daysAgo(21, 17.1)],
    [4, 1, 2, 185.0, 7, daysAgo(21, 17.3)],
    [4, 1, 3, 185.0, 7, daysAgo(21, 17.5)],
    [4, 1, 4, 185.0, 6, daysAgo(21, 17.7)],
    [4, 2, 1, 155.0, 10, daysAgo(21, 17.9)],
    [4, 2, 2, 155.0, 10, daysAgo(21, 18.1)],
    [4, 2, 3, 155.0, 9, daysAgo(21, 18.3)],

    // Log 5: Quick bench
    [5, 1, 1, 135.0, 8, daysAgo(19, 7.1)],
    [5, 1, 2, 185.0, 6, daysAgo(19, 7.2)],
    [5, 1, 3, 205.0, 5, daysAgo(19, 7.4)],

    // Log 6: Heavy deadlifts
    [6, 9, 1, 225.0, 5, daysAgo(17, 18.1)],
    [6, 9, 2, 275.0, 3, daysAgo(17, 18.3)],
    [6, 9, 3, 315.0, 3, daysAgo(17, 18.5)],
    [6, 9, 4, 350.0, 2, daysAgo(17, 18.7)],
    [6, 9, 5, 350.0, 2, daysAgo(17, 18.9)],
    [6, 15, 1, 45.0, 15, daysAgo(17, 19.1)],
    [6, 15, 2, 50.0, 15, daysAgo(17, 19.2)],
    [6, 15, 3, 50.0, 12, daysAgo(17, 19.3)],

    // Log 7: Leg day
    [7, 18, 1, 135.0, 10, daysAgo(14, 8.1)],
    [7, 18, 2, 185.0, 8, daysAgo(14, 8.3)],
    [7, 18, 3, 225.0, 6, daysAgo(14, 8.5)],
    [7, 18, 4, 245.0, 5, daysAgo(14, 8.7)],
    [7, 23, 1, null, 20, daysAgo(14, 8.9)],
    [7, 23, 2, null, 20, daysAgo(14, 9.1)],
    [7, 23, 3, null, 20, daysAgo(14, 9.3)],
    [7, 23, 4, null, 20, daysAgo(14, 9.4)],

    // Log 8: Push day
    [8, 1, 1, 185.0, 6, daysAgo(12, 17.1)],
    [8, 1, 2, 205.0, 5, daysAgo(12, 17.3)],
    [8, 1, 3, 205.0, 4, daysAgo(12, 17.5)],
    [8, 27, 1, 115.0, 6, daysAgo(12, 17.7)],
    [8, 27, 2, 115.0, 5, daysAgo(12, 17.9)],
    [8, 27, 3, 115.0, 5, daysAgo(12, 18.1)],
    [8, 38, 1, 55.0, 12, daysAgo(12, 18.3)],
    [8, 38, 2, 55.0, 12, daysAgo(12, 18.4)],

    // Log 9: Light bench
    [9, 1, 1, 135.0, 10, daysAgo(10, 7.1)],
    [9, 1, 2, 155.0, 8, daysAgo(10, 7.3)],

    // Log 10: Pull day PR
    [10, 11, 1, 155.0, 8, daysAgo(7, 18.1)],
    [10, 11, 2, 175.0, 6, daysAgo(7, 18.3)],
    [10, 11, 3, 185.0, 5, daysAgo(7, 18.5)],  // Row PR!
    [10, 10, 1, null, 8, daysAgo(7, 18.7)],
    [10, 10, 2, null, 7, daysAgo(7, 18.9)],
    [10, 10, 3, null, 6, daysAgo(7, 19.1)],

    // Log 11: Squat form work
    [11, 18, 1, 135.0, 8, daysAgo(5, 8.1)],
    [11, 18, 2, 185.0, 6, daysAgo(5, 8.3)],
    [11, 18, 3, 205.0, 5, daysAgo(5, 8.5)],

    // Log 12: Upper power
    [12, 1, 1, 185.0, 5, daysAgo(3, 17.1)],
    [12, 1, 2, 205.0, 4, daysAgo(3, 17.3)],
    [12, 1, 3, 225.0, 3, daysAgo(3, 17.5)],
    [12, 1, 4, 225.0, 2, daysAgo(3, 17.7)],
    [12, 27, 1, 95.0, 6, daysAgo(3, 17.9)],
    [12, 27, 2, 115.0, 5, daysAgo(3, 18.1)],
    [12, 27, 3, 115.0, 5, daysAgo(3, 18.3)],
    [12, 34, 1, 65.0, 10, daysAgo(3, 18.5)],

    // Log 13: Full body
    [13, 1, 1, 185.0, 6, daysAgo(1, 8.1)],
    [13, 1, 2, 185.0, 6, daysAgo(1, 8.3)],
    [13, 18, 1, 185.0, 6, daysAgo(1, 8.5)],
    [13, 18, 2, 205.0, 5, daysAgo(1, 8.7)],
    [13, 11, 1, 155.0, 8, daysAgo(1, 8.9)],
    [13, 11, 2, 155.0, 7, daysAgo(1, 9.1)],
  ];

  // Maria's sets (user 2) - logs 14-26
  const mariaSets = [
    // Log 14: Toning workout
    [14, 18, 1, 65.0, 12, daysAgo(27, 9.1)],
    [14, 18, 2, 75.0, 12, daysAgo(27, 9.3)],
    [14, 18, 3, 75.0, 10, daysAgo(27, 9.5)],
    [14, 12, 1, 55.0, 12, daysAgo(27, 9.7)],
    [14, 12, 2, 60.0, 12, daysAgo(27, 9.9)],
    [14, 12, 3, 60.0, 10, daysAgo(27, 10.1)],

    // Log 15: HIIT
    [15, 50, 1, null, 12, daysAgo(25, 17.1)],
    [15, 50, 2, null, 10, daysAgo(25, 17.2)],
    [15, 6, 1, null, 15, daysAgo(25, 17.3)],
    [15, 6, 2, null, 12, daysAgo(25, 17.4)],
    [15, 51, 1, null, 20, daysAgo(25, 17.5)],
    [15, 51, 2, null, 20, daysAgo(25, 17.6)],

    // Log 16: Full body
    [16, 1, 1, 45.0, 12, daysAgo(22, 9.1)],
    [16, 1, 2, 50.0, 10, daysAgo(22, 9.3)],
    [16, 1, 3, 50.0, 10, daysAgo(22, 9.5)],
    [16, 27, 1, 35.0, 10, daysAgo(22, 9.7)],
    [16, 27, 2, 40.0, 8, daysAgo(22, 9.9)],

    // Log 17: Quick HIIT
    [17, 50, 1, null, 15, daysAgo(20, 17.1)],
    [17, 51, 1, null, 20, daysAgo(20, 17.2)],
    [17, 54, 1, 16.0, 15, daysAgo(20, 17.3)],
    [17, 54, 2, 16.0, 15, daysAgo(20, 17.5)],

    // Log 18: Toning
    [18, 19, 1, 120.0, 15, daysAgo(18, 9.1)],
    [18, 19, 2, 140.0, 12, daysAgo(18, 9.3)],
    [18, 19, 3, 140.0, 12, daysAgo(18, 9.5)],
    [18, 22, 1, 40.0, 15, daysAgo(18, 9.7)],
    [18, 22, 2, 45.0, 12, daysAgo(18, 9.8)],

    // Log 19: HIIT battle ropes
    [19, 55, 1, null, 30, daysAgo(15, 17.1)],
    [19, 55, 2, null, 30, daysAgo(15, 17.3)],
    [19, 50, 1, null, 10, daysAgo(15, 17.4)],
    [19, 53, 1, null, 10, daysAgo(15, 17.6)],

    // Log 20: Upper toning
    [20, 28, 1, 10.0, 15, daysAgo(13, 9.1)],
    [20, 28, 2, 12.5, 15, daysAgo(13, 9.3)],
    [20, 28, 3, 12.5, 12, daysAgo(13, 9.5)],
    [20, 34, 1, 15.0, 12, daysAgo(13, 9.7)],
    [20, 34, 2, 17.5, 10, daysAgo(13, 9.8)],

    // Log 21: Express HIIT
    [21, 50, 1, null, 12, daysAgo(11, 17.1)],
    [21, 6, 1, null, 15, daysAgo(11, 17.2)],
    [21, 51, 1, null, 20, daysAgo(11, 17.3)],

    // Log 22: Leg day
    [22, 18, 1, 65.0, 12, daysAgo(8, 9.1)],
    [22, 18, 2, 75.0, 12, daysAgo(8, 9.3)],
    [22, 18, 3, 85.0, 10, daysAgo(8, 9.5)],
    [22, 20, 1, 20.0, 12, daysAgo(8, 9.7)],
    [22, 20, 2, 20.0, 10, daysAgo(8, 9.9)],

    // Log 23: HIIT core
    [23, 50, 1, null, 10, daysAgo(6, 17.1)],
    [23, 51, 1, null, 20, daysAgo(6, 17.2)],
    [23, 44, 1, null, 20, daysAgo(6, 17.3)],
    [23, 46, 1, null, 20, daysAgo(6, 17.4)],

    // Log 24: Full body
    [24, 18, 1, 75.0, 12, daysAgo(4, 9.1)],
    [24, 18, 2, 85.0, 10, daysAgo(4, 9.3)],
    [24, 12, 1, 60.0, 12, daysAgo(4, 9.5)],
    [24, 12, 2, 60.0, 10, daysAgo(4, 9.7)],
    [24, 1, 1, 50.0, 10, daysAgo(4, 9.9)],

    // Log 25: Quick HIIT
    [25, 50, 1, null, 15, daysAgo(2, 17.1)],
    [25, 6, 1, null, 15, daysAgo(2, 17.2)],
    [25, 54, 1, 16.0, 15, daysAgo(2, 17.3)],

    // Log 26: Morning toning
    [26, 28, 1, 12.5, 15, daysAgo(0, 9.1)],
    [26, 28, 2, 12.5, 12, daysAgo(0, 9.3)],
    [26, 1, 1, 50.0, 10, daysAgo(0, 9.5)],
    [26, 1, 2, 50.0, 10, daysAgo(0, 9.7)],
    [26, 18, 1, 75.0, 12, daysAgo(0, 9.9)],
    [26, 18, 2, 75.0, 10, daysAgo(0, 10.1)],
  ];

  // James's sets (user 3) - logs 27-35
  const jamesSets = [
    // Log 27: First session
    [27, 6, 1, null, 8, daysAgo(20, 10.1)],
    [27, 6, 2, null, 6, daysAgo(20, 10.3)],
    [27, 6, 3, null, 5, daysAgo(20, 10.5)],
    [27, 19, 1, 60.0, 12, daysAgo(20, 10.7)],
    [27, 19, 2, 60.0, 10, daysAgo(20, 10.9)],

    // Log 28: Beginner
    [28, 12, 1, 35.0, 10, daysAgo(18, 16.1)],
    [28, 12, 2, 40.0, 10, daysAgo(18, 16.3)],
    [28, 12, 3, 40.0, 8, daysAgo(18, 16.5)],
    [28, 21, 1, 30.0, 12, daysAgo(18, 16.7)],
    [28, 21, 2, 30.0, 10, daysAgo(18, 16.8)],

    // Log 29: Week 2
    [29, 6, 1, null, 10, daysAgo(15, 10.1)],
    [29, 6, 2, null, 8, daysAgo(15, 10.3)],
    [29, 6, 3, null, 8, daysAgo(15, 10.5)],
    [29, 18, 1, 45.0, 10, daysAgo(15, 10.7)],
    [29, 18, 2, 45.0, 8, daysAgo(15, 10.9)],
    [29, 18, 3, 45.0, 8, daysAgo(15, 11.0)],

    // Log 30: Form focus
    [30, 1, 1, 45.0, 10, daysAgo(13, 16.1)],
    [30, 1, 2, 45.0, 10, daysAgo(13, 16.3)],
    [30, 27, 1, 25.0, 10, daysAgo(13, 16.5)],
    [30, 27, 2, 25.0, 8, daysAgo(13, 16.7)],

    // Log 31: Getting stronger
    [31, 6, 1, null, 12, daysAgo(10, 10.1)],
    [31, 6, 2, null, 10, daysAgo(10, 10.3)],
    [31, 6, 3, null, 10, daysAgo(10, 10.5)],
    [31, 12, 1, 45.0, 12, daysAgo(10, 10.7)],
    [31, 12, 2, 50.0, 10, daysAgo(10, 10.9)],

    // Log 32: Express
    [32, 1, 1, 50.0, 10, daysAgo(8, 16.1)],
    [32, 1, 2, 50.0, 8, daysAgo(8, 16.3)],
    [32, 18, 1, 50.0, 10, daysAgo(8, 16.5)],
    [32, 18, 2, 50.0, 8, daysAgo(8, 16.7)],

    // Log 33: Weights up
    [33, 1, 1, 55.0, 10, daysAgo(5, 10.1)],
    [33, 1, 2, 55.0, 10, daysAgo(5, 10.3)],
    [33, 1, 3, 55.0, 8, daysAgo(5, 10.5)],
    [33, 19, 1, 80.0, 12, daysAgo(5, 10.7)],
    [33, 19, 2, 80.0, 10, daysAgo(5, 10.9)],

    // Log 34: Good session
    [34, 12, 1, 50.0, 12, daysAgo(3, 16.1)],
    [34, 12, 2, 55.0, 10, daysAgo(3, 16.3)],
    [34, 6, 1, null, 12, daysAgo(3, 16.5)],
    [34, 6, 2, null, 12, daysAgo(3, 16.7)],

    // Log 35: Weekend
    [35, 1, 1, 55.0, 10, daysAgo(1, 10.1)],
    [35, 1, 2, 55.0, 10, daysAgo(1, 10.3)],
    [35, 18, 1, 50.0, 10, daysAgo(1, 10.5)],
    [35, 18, 2, 55.0, 10, daysAgo(1, 10.7)],
    [35, 27, 1, 30.0, 10, daysAgo(1, 10.9)],
    [35, 27, 2, 30.0, 10, daysAgo(1, 11.0)],
  ];

  [...alexSets, ...mariaSets, ...jamesSets].forEach(s => insertSet.run(s));

  // Insert personal records
  const insertRecord = db.prepare(
    'INSERT INTO personal_records (user_id, exercise_id, type, value, date) VALUES (?, ?, ?, ?, ?)'
  );

  const records = [
    // Alex's PRs
    [1, 1, 'weight', 225.0, daysAgo(3, 17.5)],     // Bench Press
    [1, 1, 'volume', 1350.0, daysAgo(21, 17.7)],    // Bench volume PR
    [1, 9, 'weight', 365.0, daysAgo(26, 18.6)],     // Deadlift PR
    [1, 18, 'weight', 255.0, daysAgo(14, 8.7)],     // Squat PR
    [1, 27, 'weight', 115.0, daysAgo(12, 17.9)],    // OHP PR
    [1, 11, 'weight', 185.0, daysAgo(7, 18.5)],     // Row PR
    [1, 10, 'reps', 8, daysAgo(7, 18.7)],           // Pull-up reps PR
    [1, 34, 'weight', 65.0, daysAgo(3, 18.5)],      // Curl PR

    // Maria's PRs
    [2, 18, 'weight', 85.0, daysAgo(8, 9.5)],       // Squat PR
    [2, 1, 'weight', 50.0, daysAgo(4, 9.9)],        // Bench PR
    [2, 54, 'weight', 16.0, daysAgo(15, 17.3)],     // KB Swing PR
    [2, 12, 'weight', 60.0, daysAgo(4, 9.7)],       // Lat Pulldown PR
    [2, 50, 'reps', 15, daysAgo(2, 17.1)],          // Burpees PR
    [2, 28, 'weight', 12.5, daysAgo(0, 9.3)],       // Lateral Raise PR

    // James's PRs
    [3, 1, 'weight', 55.0, daysAgo(5, 10.5)],       // Bench PR
    [3, 6, 'reps', 12, daysAgo(10, 10.5)],          // Push-up reps PR
    [3, 18, 'weight', 55.0, daysAgo(1, 10.7)],      // Squat PR
    [3, 12, 'weight', 55.0, daysAgo(3, 16.3)],      // Lat Pulldown PR
    [3, 27, 'weight', 30.0, daysAgo(1, 10.9)],      // OHP PR
  ];
  records.forEach(r => insertRecord.run(r));
});

insertAll();

const summary = {
  users: db.prepare('SELECT COUNT(*) as count FROM users').get().count,
  exercises: db.prepare('SELECT COUNT(*) as count FROM exercises').get().count,
  workout_templates: db.prepare('SELECT COUNT(*) as count FROM workout_templates').get().count,
  template_exercises: db.prepare('SELECT COUNT(*) as count FROM template_exercises').get().count,
  custom_routines: db.prepare('SELECT COUNT(*) as count FROM custom_routines').get().count,
  routine_exercises: db.prepare('SELECT COUNT(*) as count FROM routine_exercises').get().count,
  workout_logs: db.prepare('SELECT COUNT(*) as count FROM workout_logs').get().count,
  workout_sets: db.prepare('SELECT COUNT(*) as count FROM workout_sets').get().count,
  personal_records: db.prepare('SELECT COUNT(*) as count FROM personal_records').get().count,
};

console.log('\n========================================');
console.log('  FitForge Database Seeded Successfully');
console.log('========================================');
console.log(`Users:              ${summary.users}`);
console.log(`Exercises:          ${summary.exercises}`);
console.log(`Workout Templates:  ${summary.workout_templates}`);
console.log(`Template Exercises: ${summary.template_exercises}`);
console.log(`Custom Routines:    ${summary.custom_routines}`);
console.log(`Routine Exercises:  ${summary.routine_exercises}`);
console.log(`Workout Logs:       ${summary.workout_logs}`);
console.log(`Workout Sets:       ${summary.workout_sets}`);
console.log(`Personal Records:   ${summary.personal_records}`);
console.log('========================================');
console.log('\nDemo users:');
console.log('  alex.thompson@email.com / password123  (Powerlifter)');
console.log('  maria.santos@email.com / password123    (General Fitness)');
console.log('  j.wilson@email.com / password123        (Beginner)');
console.log('');

db.close();