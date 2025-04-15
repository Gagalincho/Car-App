import * as SQLite from 'expo-sqlite';

let db = null;

export const initDatabase = async () => {
  try {
    if (db !== null) {
      console.log('Database already initialized');
      return;
    }

    // Use openDatabaseAsync for SDK 52
    db = await SQLite.openDatabaseAsync('car_journal.db');
    console.log('DB Initialized');

    // Use execAsync for bulk operations
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS fuel_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        kilometers REAL NOT NULL,
        liters REAL NOT NULL,
        price_per_liter REAL NOT NULL,
        total_cost REAL NOT NULL,
        notes TEXT
      );

      CREATE TABLE IF NOT EXISTS repairs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        description TEXT NOT NULL,
        cost REAL NOT NULL,
        notes TEXT
      );

      CREATE TABLE IF NOT EXISTS maintenance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        type TEXT NOT NULL,
        description TEXT NOT NULL,
        next_due_date TEXT,
        next_due_km REAL,
        notes TEXT
      );
    `);

    console.log('All tables created successfully');
    return true;
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
};

export const executeQuery = async (sql, params = []) => {
  try {
    if (!db) {
      throw new Error('Database not initialized');
    }
    return await db.runAsync(sql, params);
  } catch (error) {
    console.error('SQL Error:', error);
    throw error;
  }
};

export const executeSelectQuery = async (sql, params = []) => {
  try {
    if (!db) {
      throw new Error('Database not initialized');
    }
    return await db.getAllAsync(sql, params);
  } catch (error) {
    console.error('Select Query Error:', error);
    throw error;
  }
};