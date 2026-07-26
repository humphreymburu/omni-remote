import { OfflineMediaItem } from '../types';

const DB_NAME = 'OmniRemoteDB';
const DB_VERSION = 1;
const STORE_MEDIA = 'offline_media';
const STORE_CONFIG = 'user_config';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_MEDIA)) {
        db.createObjectStore(STORE_MEDIA, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_CONFIG)) {
        db.createObjectStore(STORE_CONFIG, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveOfflineMedia(item: OfflineMediaItem): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_MEDIA, 'readwrite');
    const store = tx.objectStore(STORE_MEDIA);
    const req = store.put(item);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getAllOfflineMedia(): Promise<OfflineMediaItem[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_MEDIA, 'readonly');
    const store = tx.objectStore(STORE_MEDIA);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteOfflineMedia(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_MEDIA, 'readwrite');
    const store = tx.objectStore(STORE_MEDIA);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function saveLocalConfig(key: string, value: any): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_CONFIG, 'readwrite');
    const store = tx.objectStore(STORE_CONFIG);
    const req = store.put({ key, value, updatedAt: new Date().toISOString() });
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getLocalConfig<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_CONFIG, 'readonly');
      const store = tx.objectStore(STORE_CONFIG);
      const req = store.get(key);
      req.onsuccess = () => {
        if (req.result && req.result.value !== undefined) {
          resolve(req.result.value);
        } else {
          resolve(defaultValue);
        }
      };
      req.onerror = () => resolve(defaultValue);
    });
  } catch (err) {
    return defaultValue;
  }
}
