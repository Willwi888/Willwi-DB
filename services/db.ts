
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Song } from '../types';

export interface GuestbookMessage {
  id: string;
  nickname: string;
  message: string;
  publicConsent: boolean;
  createdAt: string;
  isApproved: boolean;
  isSpam: boolean;
}

interface WillwiDB extends DBSchema {
  songs: {
    key: string;
    value: Song;
    indexes: { 'by-date': string };
  };
  guestbook: {
    key: string;
    value: GuestbookMessage;
    indexes: { 'by-date': string, 'by-approved': number };
  };
}

const DB_NAME = 'willwi-music-db';
const DB_VERSION = 2;

let dbPromise: Promise<IDBPDatabase<WillwiDB>> | null = null;

export const initDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<WillwiDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion, transaction) {
        if (!db.objectStoreNames.contains('songs')) {
          const store = db.createObjectStore('songs', { keyPath: 'id' });
          store.createIndex('by-date', 'releaseDate');
        }
        if (!db.objectStoreNames.contains('guestbook')) {
          const store = db.createObjectStore('guestbook', { keyPath: 'id' });
          store.createIndex('by-date', 'createdAt');
          store.createIndex('by-approved', 'isApproved');
        }
      },
    });
  }
  return dbPromise;
};

export const dbService = {
  async getAllSongs(): Promise<Song[]> {
    try {
        const db = await initDB();
        return await db.getAll('songs');
    } catch (e) { return []; }
  },

  async addSong(song: Song): Promise<void> {
    const db = await initDB();
    await db.put('songs', song);
  },

  async updateSong(song: Song): Promise<void> {
    const db = await initDB();
    await db.put('songs', song);
  },

  async deleteSong(id: string): Promise<void> {
    const db = await initDB();
    await db.delete('songs', id);
  },

  async bulkAdd(songs: Song[]): Promise<void> {
    const db = await initDB();
    const tx = db.transaction('songs', 'readwrite');
    const store = tx.objectStore('songs');
    for (const song of songs) {
        store.put(song);
    }
    await tx.done;
  },

  async clearAllSongs(): Promise<void> {
    const db = await initDB();
    await db.clear('songs');
  },

  async getAllMessages(): Promise<GuestbookMessage[]> {
    try {
        const db = await initDB();
        return await db.getAll('guestbook');
    } catch (e) { return []; }
  },

  async addMessage(msg: GuestbookMessage): Promise<void> {
    const db = await initDB();
    await db.put('guestbook', msg);
  },

  async updateMessage(msg: GuestbookMessage): Promise<void> {
    const db = await initDB();
    await db.put('guestbook', msg);
  },

  async deleteMessage(id: string): Promise<void> {
    const db = await initDB();
    await db.delete('guestbook', id);
  }
};
