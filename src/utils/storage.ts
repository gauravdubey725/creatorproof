// LocalStorage utility and state persistence layer for CreatorProof

export function loadState<T>(key: string, defaultValue?: T): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null || raw === undefined) {
      return defaultValue !== undefined ? defaultValue : null;
    }
    return JSON.parse(raw) as T;
  } catch (error) {
    console.warn(`[LocalStorage] Failed to load key "${key}":`, error);
    return defaultValue !== undefined ? defaultValue : null;
  }
}

export function saveState<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`[LocalStorage] Failed to save key "${key}":`, error);
  }
}

export function removeState(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`[LocalStorage] Failed to remove key "${key}":`, error);
  }
}

// Storage keys
export const STORAGE_KEYS = {
  USERS: 'mockUsers',
  TOKEN: 'mockToken',
  USER: 'mockUser',
  CONTENT: 'mockContent',
  LICENSES: 'mockLicenses',
  DISPUTES: 'mockDisputes',
  ACTIVITIES: 'mockActivities',
  NOTIFICATIONS: 'mockNotifications',
  THEME: 'creatorproof_theme'
} as const;
