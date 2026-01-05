
import { Project, Folder, Resource, ClaimRecord } from '../types';

const DB_NAME = 'NexusResourceDB';
const DB_VERSION = 1;

const STORES = {
    PROJECTS: 'projects',
    FOLDERS: 'folders',
    RESOURCES: 'resources',
    CLAIMS: 'claims',
};

export const initDB = (): Promise<void> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => {
            console.error('IndexedDB error:', event);
            reject('Failed to open database');
        };

        request.onsuccess = () => {
            resolve();
        };

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;

            if (!db.objectStoreNames.contains(STORES.PROJECTS)) {
                db.createObjectStore(STORES.PROJECTS, { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains(STORES.FOLDERS)) {
                db.createObjectStore(STORES.FOLDERS, { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains(STORES.RESOURCES)) {
                db.createObjectStore(STORES.RESOURCES, { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains(STORES.CLAIMS)) {
                db.createObjectStore(STORES.CLAIMS, { keyPath: 'id' });
            }
        };
    });
};

const getDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onerror = () => reject('Failed to open DB');
        request.onsuccess = () => resolve(request.result);
    });
};

export const getAll = async <T>(storeName: string): Promise<T[]> => {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result as T[]);
        request.onerror = () => reject(request.error);
    });
};

export const add = async <T>(storeName: string, item: T): Promise<T> => {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.add(item);

        request.onsuccess = () => resolve(item);
        request.onerror = () => reject(request.error);
    });
};

export const update = async <T>(storeName: string, item: T): Promise<T> => {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.put(item); // put updates if key exists

        request.onsuccess = () => resolve(item);
        request.onerror = () => reject(request.error);
    });
};


export const remove = async (storeName: string, id: string): Promise<void> => {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

// Seed utility
export const seedDatabase = async (
    projects: Project[],
    folders: Folder[],
    resources: Resource[]
) => {
    const db = await getDB();

    // Check if empty
    const currentProjects = await getAll<Project>(STORES.PROJECTS);
    if (currentProjects.length > 0) return; // Already seeded

    const tx = db.transaction([STORES.PROJECTS, STORES.FOLDERS, STORES.RESOURCES], 'readwrite');

    projects.forEach(p => tx.objectStore(STORES.PROJECTS).add(p));
    folders.forEach(f => tx.objectStore(STORES.FOLDERS).add(f));
    resources.forEach(r => tx.objectStore(STORES.RESOURCES).add(r));

    return new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
};

export const StorageService = {
    STORES,
    initDB,
    getAll,
    add,
    update,
    remove,
    seedDatabase
};
