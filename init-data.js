import Database from 'better-sqlite3';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(path.join(dataDir, 'app.db'));
db.pragma('journal_mode = WAL');

// Check if data already seeded
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

// Date helper
function daysAgo(days) {
  return new Date(Date.now() - days * 86400000).toISOString();
}

// Get exercise IDs by name
function getExerciseId(name) {
  const row = db.prepare('SELECT id FROM exercises WHERE name = ?').get(name);
  return row ? row.id : null;
}

const insertAll = db.transaction(() => {
  // ==================== USERS ====================
  const insertUser = db.prepare(
    'INSERT INTO users (email, password_hash, name, created_at) VALUES (?, ?, ?, ?)'
  );

  const password123 = hashPassword('password123');
  const passwordDemo = hashPassword('demo1234');

  insertUser.run('sarah.chen@email.com', password123, 'Sarah Chen', daysAgo(45));
  insertUser.run('m.johnson@email.com', password123, 'Marcus Johnson', daysAgo(30));
  insertUser.run('elena.r@email.com', passwordDemo, 'Elena Rodriguez', daysAgo(20));

  // ==================== TEMPLATE EXERCISES ====================
  const insertTemplateExercise = db.prepare(
    'INSERT INTO template_exercises (template_id, exercise_id, sets, reps) VALUES (?, ?, ?, ?)'
  );

  // Get template IDs
  const pushDay = db.prepare("SELECT id FROM workout_templates WHERE name = 'Push Day'").get().id;
  const pullDay = db.prepare("SELECT id FROM workout_templates WHERE name = 'Pull Day'").get().id;
  const legDay = db.prepare("SELECT id FROM workout_templates WHERE name = 'Leg Day'").get().id;
  const fullBody = db.prepare("SELECT id FROM workout_templates WHERE name = 'Full Body Circuit'").get().id;

  // Push Day exercises
  insertTemplateExercise.run(pushDay, getExerciseId('Bench Press'), 4, 8);
  insertTemplateExercise.run(pushDay, getExerciseId('Overhead Press'), 3, 10);
  insertTemplateExercise.run(pushDay, getExerciseId('Incline Bench Press'), 3, 10);
  insertTemplateExercise.run(pushDay, getExerciseId('Lateral Raise'), 3, 12);
  insertTemplateExercise.run(pushDay, getExerciseId('Tricep Pushdown'), 3, 12);

  // Pull Day exercises
  insertTemplateExercise.run(pullDay, getExerciseId('Deadlift'), 3, 5);
  insertTemplateExercise.run(pullDay, getExerciseId('Pull-ups'), 4, 8);
  insertTemplateExercise.run(pullDay, getExerciseId('Bent-over Row'), 3, 10);
  insertTemplateExercise.run(pullDay, getExerciseId('Face Pulls'), 3, 15);
  insertTemplateExercise.run(pullDay, getExerciseId('Barbell Curl'), 3, 12);

  // Leg Day exercises
  insertTemplateExercise.run(legDay, getExerciseId('Squat'), 4, 8);
  insertTemplateExercise.run(legDay, getExerciseId('Leg Press'), 3, 12);
  insertTemplateExercise.run(legDay, getExerciseId('Romanian Deadlift'), 3, 10);
  insertTemplateExercise.run(legDay, getExerciseId('Leg Extension'), 3, 12);
  insertTemplateExercise.run(legDay, getExerciseId('Leg Curl'), 3, 12);
  insertTemplateExercise.run(legDay, getExerciseId('Calf Raises'), 4, 15);

  // Full Body Circuit exercises
  insertTemplateExercise.run(fullBody, getExerciseId('Burpees'), 3, 10);
  insertTemplateExercise.run(fullBody, getExerciseId('Kettlebell Swing'), 3, 15);
  insertTemplateExercise.run(fullBody, getExerciseId('Mountain Climbers'), 3, 20);
  insertTemplateExercise.run(fullBody, getExerciseId('Box Jumps'), 3, 10);

  // ==================== CUSTOM ROUTINES ====================
  const insertRoutine = db.prepare(
    'INSERT INTO custom_routines (user_id, name, created_at) VALUES (?, ?, ?)'
  );
  const insertRoutineExercise = db.prepare(
    'INSERT INTO routine_exercises (routine_id, exercise_id, order_index, sets, reps, rest_seconds) VALUES (?, ?, ?, ?, ?, ?)'
  );

  // User 1 routines (Sarah)
  const sarahRoutine1 = insertRoutine.run(1, 'Upper Body Power', daysAgo(25)).lastInsertRowid;
  insertRoutineExercise.run(sarahRoutine1, getExerciseId('Bench Press'), 0, 4, 8, 120);
  insertRoutineExercise.run(sarahRoutine1, getExerciseId('Overhead Press'), 1, 3, 10, 90);
  insertRoutineExercise.run(sarahRoutine1, getExerciseId('Barbell Curl'), 2, 3, 12, 60);
  insertRoutineExercise.run(sarahRoutine1, getExerciseId('Tricep Pushdown'), 3, 3, 12, 60);

  const sarahRoutine2 = insertRoutine.run(1, 'Leg Day Blast', daysAgo(22)).lastInsertRowid;
  insertRoutineExercise.run(sarahRoutine2, getExerciseId('Squat'), 0, 4, 8, 120);
  insertRoutineExercise.run(sarahRoutine2, getExerciseId('Leg Press'), 1, 3, 12, 90);
  insertRoutineExercise.run(sarahRoutine2, getExerciseId('Romanian Deadlift'), 2, 3, 10, 90);
  insertRoutineExercise.run(sarahRoutine2, getExerciseId('Calf Raises'), 3, 4, 15, 45);

  // User 2 routines (Marcus)
  const marcusRoutine1 = insertRoutine.run(2, 'Back Attack', daysAgo(18)).lastInsertRowid;
  insertRoutineExercise.run(marcusRoutine1, getExerciseId('Pull-ups'), 0, 4, 8, 90);
  insertRoutineExercise.run(marcusRoutine1, getExerciseId('Bent-over Row'), 1, 4, 8, 90);
  insertRoutineExercise.run(marcusRoutine1, getExerciseId('Lat Pulldown'), 2, 3, 12, 60);
  insertRoutineExercise.run(marcusRoutine1, getExerciseId('Face Pulls'), 3, 3, 15, 45);
  insertRoutineExercise.run(marcusRoutine1, getExerciseId('Barbell Shrug'), 4, 3, 12, 60);

  const marcusRoutine2 = insertRoutine.run(2, 'Arm Day', daysAgo(15)).lastInsertRowid;
  insertRoutineExercise.run(marcusRoutine2, getExerciseId('Barbell Curl'), 0, 4, 10, 60);
  insertRoutineExercise.run(marcusRoutine2, getExerciseId('Hammer Curl'), 1, 3, 12, 60);
  insertRoutineExercise.run(marcusRoutine2, getExerciseId('Skullcrushers'), 2, 4, 10, 60);
  insertRoutineExercise.run(marcusRoutine2, getExerciseId('Tricep Pushdown'), 3, 3, 15, 60);

  // User 3 routines (Elena)
  const elenaRoutine1 = insertRoutine.run(3, 'Full Body HIIT', daysAgo(12)).lastInsertRowid;
  insertRoutineExercise.run(elenaRoutine1, getExerciseId('Burpees'), 0, 3, 10, 30);
  insertRoutineExercise.run(elenaRoutine1, getExerciseId('Mountain Climbers'), 1, 3, 20, 30);
  insertRoutineExercise.run(elenaRoutine1, getExerciseId('Kettlebell Swing'), 2, 3, 15, 45);
  insertRoutineExercise.run(elenaRoutine1, getExerciseId('Box Jumps'), 3, 3, 10, 45);

  const elenaRoutine2 = insertRoutine.run(3, 'Core Crusher', daysAgo(8)).lastInsertRowid;
  insertRoutineExercise.run(elenaRoutine2, getExerciseId('Plank'), 0, 3, 60, 30);
  insertRoutineExercise.run(elenaRoutine2, getExerciseId('Leg Raises'), 1, 3, 15, 30);
  insertRoutineExercise.run(elenaRoutine2, getExerciseId('Russian Twists'), 2, 3, 20, 30);
  insertRoutineExercise.run(elenaRoutine2, getExerciseId('Bicycle Crunches'), 3, 3, 20, 30);

  // ==================== WORKOUT LOGS ====================
  const insertWorkoutLog = db.prepare(
    'INSERT INTO workout_logs (user_id, started_at, completed_at, notes) VALUES (?, ?, ?, ?)'
  );

  // Sarah's workouts
  const sarahWorkouts = [
    { start: 28, end: 28, notes: 'Great upper body session, felt strong on bench' },
    { start: 25, end: 25, notes: 'Leg day, squats felt heavy but completed all sets' },
    { start: 21, end: 21, notes: 'Quick push session before work' },
    { start: 18, end: 18, notes: 'Pull day with extra back work' },
    { start: 14, end: 14, notes: 'Upper body power routine, new PR on OHP' },
    { start: 11, end: 11, notes: 'Leg day blast, added extra calf work' },
    { start: 7, end: 7, notes: 'Full upper body session' },
    { start: 4, end: 4, notes: 'Leg day, working on depth for squats' },
    { start: 2, end: 2, notes: 'Push session, bench press improvements' },
    { start: 1, end: 1, notes: 'Morning full body circuit' }
  ];

  const sarahLogs = [];
  for (const w of sarahWorkouts) {
    const startedAt = daysAgo(w.start);
    const completedAt = new Date(new Date(startedAt).getTime() + 45 * 60000).toISOString();
    const logId = insertWorkoutLog.run(1, startedAt, completedAt, w.notes).lastInsertRowid;
    sarahLogs.push(logId);
  }

  // Marcus's workouts
  const marcusWorkouts = [
    { start: 24, end: 24, notes: 'Back attack session, pulled heavy on deadlifts' },
    { start: 20, end: 20, notes: 'Arm day pump, great bicep focus' },
    { start: 16, end: 16, notes: 'Heavy back training' },
    { start: 13, end: 13, notes: 'Arm day with drop sets' },
    { start: 9, end: 9, notes: 'Back and rear delts, feeling wide' },
    { start: 6, end: 6, notes: 'Quick arm session' },
    { start: 3, end: 3, notes: 'Back attack, hit PR on rows' }
  ];

  const marcusLogs = [];
  for (const w of marcusWorkouts) {
    const startedAt = daysAgo(w.start);
    const completedAt = new Date(new Date(startedAt).getTime() + 50 * 60000).toISOString();
    const logId = insertWorkoutLog.run(2, startedAt, completedAt, w.notes).lastInsertRowid;
    marcusLogs.push(logId);
  }

  // Elena's workouts
  const elenaWorkouts = [
    { start: 15, end: 15, notes: 'HIIT session, heart rate through the roof' },
    { start: 11, end: 11, notes: 'Core crusher, abs on fire' },
    { start: 8, end: 8, notes: 'Full body conditioning work' },
    { start: 5, end: 5, notes: 'Morning HIIT session' },
    { start: 2, end: 2, notes: 'Core and cardio circuit' }
  ];

  const elenaLogs = [];
  for (const w of elenaWorkouts) {
    const startedAt = daysAgo(w.start);
    const completedAt = new Date(new Date(startedAt).getTime() + 35 * 60000).toISOString();
    const logId = insertWorkoutLog.run(3, startedAt, completedAt, w.notes).lastInsertRowid;
    elenaLogs.push(logId);
  }

  // ==================== WORKOUT SETS ====================
  const insertWorkoutSet = db.prepare(
    'INSERT INTO workout_sets (log_id, exercise_id, set_number, weight, reps, completed_at) VALUES (?, ?, ?, ?, ?, ?)'
  );

  // Sarah's sets - Upper Body Power style workouts
  const benchPressId = getExerciseId('Bench Press');
  const overheadPressId = getExerciseId('Overhead Press');
  const barbellCurlId = getExerciseId('Barbell Curl');
  const tricepPushdownId = getExerciseId('Tricep Pushdown');
  const squatId = getExerciseId('Squat');
  const legPressId = getExerciseId('Leg Press');
  const rdlId = getExerciseId('Romanian Deadlift');
  const calfRaiseId = getExerciseId('Calf Raises');
  const latPulldownId = getExerciseId('Lat Pulldown');
  const seatedRowId = getExerciseId('Seated Cable Row');
  const lateralRaiseId = getExerciseId('Lateral Raise');

  // Sarah workout 1 - Upper body
  const baseTime1 = new Date(daysAgo(28));
  let setMinutes = 5;
  [[benchPressId, 95, 8], [benchPressId, 105, 7], [benchPressId, 105, 6], [benchPressId, 100, 7],
   [overheadPressId, 55, 10], [overheadPressId, 60, 8], [overheadPressId, 60, 7],
   [barbellCurlId, 45, 12], [barbellCurlId, 45, 11], [barbellCurlId, 45, 10],
   [tricepPushdownId, 40, 12], [tricepPushdownId, 45, 11], [tricepPushdownId, 45, 10]
  ].forEach(([exId, weight, reps], idx) => {
    const completedAt = new Date(baseTime1.getTime() + (setMinutes + idx * 3.5) * 60000).toISOString();
    insertWorkoutSet.run(sarahLogs[0], exId, idx + 1, weight, reps, completedAt);
  });

  // Sarah workout 2 - Leg day
  const baseTime2 = new Date(daysAgo(25));
  [[squatId, 135, 8], [squatId, 155, 7], [squatId, 155, 6], [squatId, 155, 6],
   [legPressId, 270, 12], [legPressId, 290, 10], [legPressId, 290, 9],
   [rdlId, 135, 10], [rdlId, 145, 9], [rdlId, 145, 8],
   [calfRaiseId, 90, 15], [calfRaiseId, 100, 15], [calfRaiseId, 100, 14], [calfRaiseId, 100, 13]
  ].forEach(([exId, weight, reps], idx) => {
    const completedAt = new Date(baseTime2.getTime() + (5 + idx * 3.5) * 60000).toISOString();
    insertWorkoutSet.run(sarahLogs[1], exId, idx + 1, weight, reps, completedAt);
  });

  // Sarah workout 3 - Push session
  const baseTime3 = new Date(daysAgo(21));
  [[benchPressId, 105, 8], [benchPressId, 115, 7], [benchPressId, 115, 6],
   [overheadPressId, 60, 10], [overheadPressId, 65, 8], [overheadPressId, 65, 7],
   [lateralRaiseId, 15, 12], [lateralRaiseId, 15, 12], [lateralRaiseId, 15, 11],
   [tricepPushdownId, 45, 12], [tricepPushdownId, 45, 12], [tricepPushdownId, 50, 10]
  ].forEach(([exId, weight, reps], idx) => {
    const completedAt = new Date(baseTime3.getTime() + (5 + idx * 3.5) * 60000).toISOString();
    insertWorkoutSet.run(sarahLogs[2], exId, idx + 1, weight, reps, completedAt);
  });

  // Sarah workout 4 - Pull day
  const baseTime4 = new Date(daysAgo(18));
  const pullUpId = getExerciseId('Pull-ups');
  const facePullId = getExerciseId('Face Pulls');
  [[pullUpId, 0, 8], [pullUpId, 10, 7], [pullUpId, 10, 6], [pullUpId, 10, 5],
   [seatedRowId, 90, 10], [seatedRowId, 95, 9], [seatedRowId, 95, 8],
   [latPulldownId, 80, 12], [latPulldownId, 85, 10], [latPulldownId, 85, 9],
   [facePullId, 25, 15], [facePullId, 25, 15], [facePullId, 25, 14]
  ].forEach(([exId, weight, reps], idx) => {
    const completedAt = new Date(baseTime4.getTime() + (5 + idx * 3.5) * 60000).toISOString();
    insertWorkoutSet.run(sarahLogs[3], exId, idx + 1, weight, reps, completedAt);
  });

  // Sarah workout 5 - Upper body with OHP PR
  const baseTime5 = new Date(daysAgo(14));
  [[benchPressId, 110, 8], [benchPressId, 120, 6], [benchPressId, 120, 5], [benchPressId, 115, 7],
   [overheadPressId, 65, 10], [overheadPressId, 70, 8], [overheadPressId, 70, 7],
   [barbellCurlId, 50, 12], [barbellCurlId, 50, 11], [barbellCurlId, 50, 10],
   [tricepPushdownId, 50, 12], [tricepPushdownId, 50, 11], [tricepPushdownId, 50, 10]
  ].forEach(([exId, weight, reps], idx) => {
    const completedAt = new Date(baseTime5.getTime() + (5 + idx * 3.5) * 60000).toISOString();
    insertWorkoutSet.run(sarahLogs[4], exId, idx + 1, weight, reps, completedAt);
  });

  // Sarah workout 6 - Leg day blast
  const baseTime6 = new Date(daysAgo(11));
  [[squatId, 155, 8], [squatId, 165, 7], [squatId, 175, 6], [squatId, 175, 5],
   [legPressId, 290, 12], [legPressId, 310, 10], [legPressId, 310, 9],
   [rdlId, 145, 10], [rdlId, 155, 9], [rdlId, 155, 8],
   [calfRaiseId, 100, 15], [calfRaiseId, 110, 15], [calfRaiseId, 110, 14], [calfRaiseId, 110, 13]
  ].forEach(([exId, weight, reps], idx) => {
    const completedAt = new Date(baseTime6.getTime() + (5 + idx * 3.5) * 60000).toISOString();
    insertWorkoutSet.run(sarahLogs[5], exId, idx + 1, weight, reps, completedAt);
  });

  // Sarah workout 7 - Upper body
  const baseTime7 = new Date(daysAgo(7));
  [[benchPressId, 115, 8], [benchPressId, 125, 6], [benchPressId, 125, 5],
   [overheadPressId, 65, 10], [overheadPressId, 70, 8], [overheadPressId, 70, 7],
   [barbellCurlId, 50, 12], [barbellCurlId, 50, 11],
   [tricepPushdownId, 50, 12], [tricepPushdownId, 55, 10], [tricepPushdownId, 55, 9]
  ].forEach(([exId, weight, reps], idx) => {
    const completedAt = new Date(baseTime7.getTime() + (5 + idx * 3.5) * 60000).toISOString();
    insertWorkoutSet.run(sarahLogs[6], exId, idx + 1, weight, reps, completedAt);
  });

  // Sarah workout 8 - Leg day
  const baseTime8 = new Date(daysAgo(4));
  [[squatId, 165, 8], [squatId, 175, 7], [squatId, 185, 5], [squatId, 185, 5],
   [legPressId, 310, 12], [legPressId, 330, 10], [legPressId, 330, 9],
   [rdlId, 155, 10], [rdlId, 165, 8], [rdlId, 165, 7]
  ].forEach(([exId, weight, reps], idx) => {
    const completedAt = new Date(baseTime8.getTime() + (5 + idx * 3.5) * 60000).toISOString();
    insertWorkoutSet.run(sarahLogs[7], exId, idx + 1, weight, reps, completedAt);
  });

  // Sarah workout 9 - Push session
  const baseTime9 = new Date(daysAgo(2));
  [[benchPressId, 120, 8], [benchPressId, 130, 6], [benchPressId, 130, 5],
   [overheadPressId, 70, 10], [overheadPressId, 75, 8], [overheadPressId, 75, 7],
   [lateralRaiseId, 17.5, 12], [lateralRaiseId, 17.5, 11], [lateralRaiseId, 17.5, 10],
   [tricepPushdownId, 55, 12], [tricepPushdownId, 55, 11], [tricepPushdownId, 55, 10]
  ].forEach(([exId, weight, reps], idx) => {
    const completedAt = new Date(baseTime9.getTime() + (5 + idx * 3.5) * 60000).toISOString();
    insertWorkoutSet.run(sarahLogs[8], exId, idx + 1, weight, reps, completedAt);
  });

  // Sarah workout 10 - Full body circuit
  const baseTime10 = new Date(daysAgo(1));
  const burpeeId = getExerciseId('Burpees');
  const kbSwingId = getExerciseId('Kettlebell Swing');
  const mtClimberId = getExerciseId('Mountain Climbers');
  const boxJumpId = getExerciseId('Box Jumps');
  [[burpeeId, 0, 10], [burpeeId, 0, 9], [burpeeId, 0, 8],
   [kbSwingId, 35, 15], [kbSwingId, 35, 14], [kbSwingId, 35, 13],
   [mtClimberId, 0, 20], [mtClimberId, 0, 18], [mtClimberId, 0, 17],
   [boxJumpId, 0, 10], [boxJumpId, 0, 9], [boxJumpId, 0, 8]
  ].forEach(([exId, weight, reps], idx) => {
    const completedAt = new Date(baseTime10.getTime() + (5 + idx * 3) * 60000).toISOString();
    insertWorkoutSet.run(sarahLogs[9], exId, idx + 1, weight, reps, completedAt);
  });

  // Marcus's sets - Back and Arm focused
  const deadliftId = getExerciseId('Deadlift');
  const bentOverRowId = getExerciseId('Bent-over Row');
  const hammerCurlId = getExerciseId('Hammer Curl');
  const skullcrusherId = getExerciseId('Skullcrushers');

  // Marcus workout 1 - Back attack
  const mbaseTime1 = new Date(daysAgo(24));
  [[deadliftId, 225, 5], [deadliftId, 275, 3], [deadliftId, 295, 2], [deadliftId, 315, 1],
   [pullUpId, 25, 8], [pullUpId, 25, 7], [pullUpId, 25, 6], [pullUpId, 25, 5],
   [bentOverRowId, 155, 10], [bentOverRowId, 165, 8], [bentOverRowId, 165, 7],
   [facePullId, 30, 15], [facePullId, 30, 15], [facePullId, 30, 14],
   [getExerciseId('Barbell Shrug'), 185, 12], [getExerciseId('Barbell Shrug'), 185, 12], [getExerciseId('Barbell Shrug'), 185, 11]
  ].forEach(([exId, weight, reps], idx) => {
    const completedAt = new Date(mbaseTime1.getTime() + (5 + idx * 3.5) * 60000).toISOString();
    insertWorkoutSet.run(marcusLogs[0], exId, idx + 1, weight, reps, completedAt);
  });

  // Marcus workout 2 - Arm day
  const mbaseTime2 = new Date(daysAgo(20));
  [[barbellCurlId, 75, 10], [barbellCurlId, 80, 9], [barbellCurlId, 80, 8], [barbellCurlId, 80, 7],
   [hammerCurlId, 35, 12], [hammerCurlId, 35, 12], [hammerCurlId, 35, 11],
   [skullcrusherId, 85, 10], [skullcrusherId, 85, 9], [skullcrusherId, 85, 8], [skullcrusherId, 85, 7],
   [tricepPushdownId, 60, 15], [tricepPushdownId, 60, 14], [tricepPushdownId, 65, 12]
  ].forEach(([exId, weight, reps], idx) => {
    const completedAt = new Date(mbaseTime2.getTime() + (5 + idx * 3.5) * 60000).toISOString();
    insertWorkoutSet.run(marcusLogs[1], exId, idx + 1, weight, reps, completedAt);
  });

  // Marcus workout 3 - Heavy back
  const mbaseTime3 = new Date(daysAgo(16));
  [[deadliftId, 275, 5], [deadliftId, 315, 3], [deadliftId, 335, 2], [deadliftId, 345, 1],
   [bentOverRowId, 165, 10], [bentOverRowId, 175, 8], [bentOverRowId, 175, 7],
   [latPulldownId, 130, 12], [latPulldownId, 140, 10], [latPulldownId, 140, 9],
   [seatedRowId, 150, 10], [seatedRowId, 155, 9], [seatedRowId, 155, 8]
  ].forEach(([exId, weight, reps], idx) => {
    const completedAt = new Date(mbaseTime3.getTime() + (5 + idx * 3.5) * 60000).toISOString();
    insertWorkoutSet.run(marcusLogs[2], exId, idx + 1, weight, reps, completedAt);
  });

  // Marcus workout 4 - Arm day with drop sets
  const mbaseTime4 = new Date(daysAgo(13));
  [[barbellCurlId, 80, 10], [barbellCurlId, 85, 8], [barbellCurlId, 85, 7], [barbellCurlId, 85, 6],
   [hammerCurlId, 40, 12], [hammerCurlId, 40, 11], [hammerCurlId, 40, 10],
   [skullcrusherId, 90, 10], [skullcrusherId, 90, 9], [skullcrusherId, 90, 8],
   [tricepPushdownId, 65, 15], [tricepPushdownId, 65, 14], [tricepPushdownId, 65, 12]
  ].forEach(([exId, weight, reps], idx) => {
    const completedAt = new Date(mbaseTime4.getTime() + (5 + idx * 3.5) * 60000).toISOString();
    insertWorkoutSet.run(marcusLogs[3], exId, idx + 1, weight, reps, completedAt);
  });

  // Marcus workout 5 - Back and rear delts
  const mbaseTime5 = new Date(daysAgo(9));
  [[pullUpId, 25, 9], [pullUpId, 25, 8], [pullUpId, 25, 7], [pullUpId, 25, 6],
   [bentOverRowId, 175, 10], [bentOverRowId, 185, 8], [bentOverRowId, 185, 7],
   [facePullId, 35, 15], [facePullId, 35, 15], [facePullId, 35, 14],
   [getExerciseId('Rear Delt Fly'), 20, 15], [getExerciseId('Rear Delt Fly'), 20, 15], [getExerciseId('Rear Delt Fly'), 20, 14]
  ].forEach(([exId, weight, reps], idx) => {
    const completedAt = new Date(mbaseTime5.getTime() + (5 + idx * 3.5) * 60000).toISOString();
    insertWorkoutSet.run(marcusLogs[4], exId, idx + 1, weight, reps, completedAt);
  });

  // Marcus workout 6 - Quick arm session
  const mbaseTime6 = new Date(daysAgo(6));
  [[barbellCurlId, 85, 10], [barbellCurlId, 85, 9], [barbellCurlId, 85, 8],
   [hammerCurlId, 40, 12], [hammerCurlId, 40, 11],
   [tricepPushdownId, 65, 15], [tricepPushdownId, 70, 12], [tricepPushdownId, 70, 11]
  ].forEach(([exId, weight, reps], idx) => {
    const completedAt = new Date(mbaseTime6.getTime() + (5 + idx * 3.5) * 60000).toISOString();
    insertWorkoutSet.run(marcusLogs[5], exId, idx + 1, weight, reps, completedAt);
  });

  // Marcus workout 7 - Back attack with PR
  const mbaseTime7 = new Date(daysAgo(3));
  [[deadliftId, 315, 5], [deadliftId, 345, 3], [deadliftId, 365, 2], [deadliftId, 375, 1],
   [bentOverRowId, 185, 10], [bentOverRowId, 195, 8], [bentOverRowId, 195, 7], [bentOverRowId, 195, 7],
   [pullUpId, 25, 10], [pullUpId, 25, 9], [pullUpId, 25, 8], [pullUpId, 25, 7],
   [facePullId, 35, 15], [facePullId, 35, 15], [facePullId, 35, 15]
  ].forEach(([exId, weight, reps], idx) => {
    const completedAt = new Date(mbaseTime7.getTime() + (5 + idx * 3.5) * 60000).toISOString();
    insertWorkoutSet.run(marcusLogs[6], exId, idx + 1, weight, reps, completedAt);
  });

  // Elena's sets - HIIT and Core focused
  const plankId = getExerciseId('Plank');
  const legRaiseId = getExerciseId('Leg Raises');
  const russianTwistId = getExerciseId('Russian Twists');
  const bicycleCrunchId = getExerciseId('Bicycle Crunches');

  // Elena workout 1 - HIIT session
  const ebaseTime1 = new Date(daysAgo(15));
  [[burpeeId, 0, 10], [burpeeId, 0, 9], [burpeeId, 0, 8],
   [mtClimberId, 0, 20], [mtClimberId, 0, 18], [mtClimberId, 0, 17],
   [kbSwingId, 26, 15], [kbSwingId, 26, 14], [kbSwingId, 26, 13],
   [boxJumpId, 0, 10], [boxJumpId, 0, 9], [boxJumpId, 0, 8]
  ].forEach(([exId, weight, reps], idx) => {
    const completedAt = new Date(ebaseTime1.getTime() + (3 + idx * 3) * 60000).toISOString();
    insertWorkoutSet.run(elenaLogs[0], exId, idx + 1, weight, reps, completedAt);
  });

  // Elena workout 2 - Core crusher
  const ebaseTime2 = new Date(daysAgo(11));
  [[plankId, 0, 60], [plankId, 0, 55], [plankId, 0, 50],
   [legRaiseId, 0, 15], [legRaiseId, 0, 14], [legRaiseId, 0, 13],
   [russianTwistId, 10, 20], [russianTwistId, 10, 20], [russianTwistId, 10, 18],
   [bicycleCrunchId, 0, 20], [bicycleCrunchId, 0, 20], [bicycleCrunchId, 0, 18]
  ].forEach(([exId, weight, reps], idx) => {
    const completedAt = new Date(ebaseTime2.getTime() + (3 + idx * 2.5) * 60000).toISOString();
    insertWorkoutSet.run(elenaLogs[1], exId, idx + 1, weight, reps, completedAt);
  });

  // Elena workout 3 - Full body conditioning
  const ebaseTime3 = new Date(daysAgo(8));
  [[burpeeId, 0, 12], [burpeeId, 0, 10], [burpeeId, 0, 9],
   [kbSwingId, 35, 15], [kbSwingId, 35, 14], [kbSwingId, 35, 13],
   [mtClimberId, 0, 22], [mtClimberId, 0, 20], [mtClimberId, 0, 18],
   [boxJumpId, 0, 12], [boxJumpId, 0, 10], [boxJumpId, 0, 9]
  ].forEach(([exId, weight, reps], idx) => {
    const completedAt = new Date(ebaseTime3.getTime() + (3 + idx * 3) * 60000).toISOString();
    insertWorkoutSet.run(elenaLogs[2], exId, idx + 1, weight, reps, completedAt);
  });

  // Elena workout 4 - Morning HIIT
  const ebaseTime4 = new Date(daysAgo(5));
  [[burpeeId, 0, 10], [burpeeId, 0, 10], [burpeeId, 0, 9],
   [mtClimberId, 0, 20], [mtClimberId, 0, 20], [mtClimberId, 0, 18],
   [kbSwingId, 26, 15], [kbSwingId, 26, 15], [kbSwingId, 26, 14]
  ].forEach(([exId, weight, reps], idx) => {
    const completedAt = new Date(ebaseTime4.getTime() + (3 + idx * 3) * 60000).toISOString();
    insertWorkoutSet.run(elenaLogs[3], exId, idx + 1, weight, reps, completedAt);
  });

  // Elena workout 5 - Core and cardio
  const ebaseTime5 = new Date(daysAgo(2));
  [[plankId, 0, 65], [plankId, 0, 60], [plankId, 0, 55],
   [legRaiseId, 0, 16], [legRaiseId, 0, 15], [legRaiseId, 0, 14],
   [russianTwistId, 15, 20], [russianTwistId, 15, 20], [russianTwistId, 15, 18],
   [burpeeId, 0, 12], [burpeeId, 0, 10], [burpeeId, 0, 9]
  ].forEach(([exId, weight, reps], idx) => {
    const completedAt = new Date(ebaseTime5.getTime() + (3 + idx * 2.5) * 60000).toISOString();
    insertWorkoutSet.run(elenaLogs[4], exId, idx + 1, weight, reps, completedAt);
  });

  // ==================== PERSONAL RECORDS ====================
  const insertPR = db.prepare(
    'INSERT INTO personal_records (user_id, exercise_id, type, value, date) VALUES (?, ?, ?, ?, ?)'
  );

  // Sarah's PRs
  insertPR.run(1, benchPressId, 'weight', 130, daysAgo(2));
  insertPR.run(1, overheadPressId, 'weight', 75, daysAgo(2));
  insertPR.run(1, squatId, 'weight', 185, daysAgo(4));
  insertPR.run(1, deadliftId, 'weight', 205, daysAgo(10));
  insertPR.run(1, barbellCurlId, 'weight', 50, daysAgo(7));
  insertPR.run(1, legPressId, 'weight', 330, daysAgo(4));
  insertPR.run(1, benchPressId, 'reps', 8, daysAgo(14));
  insertPR.run(1, squatId, 'volume', 4440, daysAgo(4)); // 185x8x3

  // Marcus's PRs
  insertPR.run(2, deadliftId, 'weight', 375, daysAgo(3));
  insertPR.run(2, bentOverRowId, 'weight', 195, daysAgo(3));
  insertPR.run(2, pullUpId, 'weight', 25, daysAgo(9));
  insertPR.run(2, barbellCurlId, 'weight', 85, daysAgo(6));
  insertPR.run(2, skullcrusherId, 'weight', 90, daysAgo(13));
  insertPR.run(2, deadliftId, 'volume', 1980, daysAgo(3));
  insertPR.run(2, pullUpId, 'reps', 10, daysAgo(3));

  // Elena's PRs
  insertPR.run(3, burpeeId, 'reps', 12, daysAgo(2));
  insertPR.run(3, plankId, 'reps', 65, daysAgo(2)); // seconds as reps
  insertPR.run(3, kbSwingId, 'weight', 35, daysAgo(8));
  insertPR.run(3, boxJumpId, 'reps', 12, daysAgo(8));
  insertPR.run(3, legRaiseId, 'reps', 16, daysAgo(2));
  insertPR.run(3, russianTwistId, 'weight', 15, daysAgo(2));

});

insertAll();

// Get final counts
const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
const routineCount = db.prepare('SELECT COUNT(*) as count FROM custom_routines').get().count;
const logCount = db.prepare('SELECT COUNT(*) as count FROM workout_logs').get().count;
const setCount = db.prepare('SELECT COUNT(*) as count FROM workout_sets').get().count;
const prCount = db.prepare('SELECT COUNT(*) as count FROM personal_records').get().count;
const templateExCount = db.prepare('SELECT COUNT(*) as count FROM template_exercises').get().count;

db.close();

console.log(`
✓ FitForge database seeded successfully!
  
  Seeded:
  - ${userCount} users
  - ${templateExCount} template exercises
  - ${routineCount} custom routines
  - ${logCount} workout logs
  - ${setCount} workout sets
  - ${prCount} personal records

  Demo users:
  - sarah.chen@email.com / password123
  - m.johnson@email.com / password123
  - elena.r@email.com / demo1234
`);