const PREFIX = 'et:';

export function loadFromStorage<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch (e) {
    console.warn(`Storage write failed for "${key}":`, e);
  }
}

export function clearStorage(key: string): void {
  localStorage.removeItem(PREFIX + key);
}
