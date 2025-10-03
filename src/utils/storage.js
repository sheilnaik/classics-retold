import { openDB } from 'idb';

const DB_NAME = 'retold-classics-db';
const DB_VERSION = 1;

// Initialize the database
export async function initDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Store for reading progress
      if (!db.objectStoreNames.contains('progress')) {
        db.createObjectStore('progress', { keyPath: 'bookId' });
      }
      
      // Store for user preferences
      if (!db.objectStoreNames.contains('preferences')) {
        db.createObjectStore('preferences', { keyPath: 'key' });
      }
      
      // Store for pinned books
      if (!db.objectStoreNames.contains('pinned')) {
        db.createObjectStore('pinned', { keyPath: 'bookId' });
      }
    },
  });
}

// Progress functions
export async function getProgress(bookId) {
  const db = await initDB();
  return db.get('progress', bookId);
}

export async function saveProgress(bookId, progressData) {
  const db = await initDB();
  const data = {
    bookId,
    ...progressData,
    lastRead: new Date().toISOString()
  };
  return db.put('progress', data);
}

export async function getAllProgress() {
  const db = await initDB();
  return db.getAll('progress');
}

// Preference functions
export async function getPreference(key) {
  const db = await initDB();
  const result = await db.get('preferences', key);
  return result?.value;
}

export async function savePreference(key, value) {
  const db = await initDB();
  return db.put('preferences', { key, value });
}

// Pinned books functions
export async function getPinnedBooks() {
  const db = await initDB();
  const pinned = await db.getAll('pinned');
  return pinned.map(item => item.bookId);
}

export async function togglePinBook(bookId) {
  const db = await initDB();
  const existing = await db.get('pinned', bookId);
  
  if (existing) {
    await db.delete('pinned', bookId);
    return false; // unpinned
  } else {
    await db.put('pinned', { bookId, pinnedAt: new Date().toISOString() });
    return true; // pinned
  }
}

export async function isBookPinned(bookId) {
  const db = await initDB();
  const result = await db.get('pinned', bookId);
  return !!result;
}

// Calculate book completion percentage
export function calculateCompletion(progress, totalChapters) {
  if (!progress || !progress.completed) return 0;
  return Math.round((progress.completed.length / totalChapters) * 100);
}
