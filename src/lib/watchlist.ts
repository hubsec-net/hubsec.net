const STORAGE_KEY = 'hubsec_watchlist';

export interface WatchedAddress {
  address: string;
  chain: string;
  label?: string;
  addedAt: number;
  lastBalance?: string;
  lastTxTimestamp?: number;
  lastCheckedAt?: number;
  newActivity?: boolean;
}

function loadAll(): WatchedAddress[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveAll(list: WatchedAddress[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function getWatchlist(): WatchedAddress[] {
  return loadAll().sort((a, b) => b.addedAt - a.addedAt);
}

export function isWatched(address: string): boolean {
  return loadAll().some(w => w.address.toLowerCase() === address.toLowerCase());
}

export function addToWatchlist(address: string, chain: string, label?: string): void {
  const list = loadAll();
  if (list.some(w => w.address.toLowerCase() === address.toLowerCase())) return;
  list.push({
    address: address.toLowerCase(),
    chain,
    label,
    addedAt: Date.now(),
  });
  saveAll(list);
}

export function removeFromWatchlist(address: string): void {
  const list = loadAll().filter(w => w.address.toLowerCase() !== address.toLowerCase());
  saveAll(list);
}

export function updateWatchedAddress(address: string, updates: Partial<WatchedAddress>): void {
  const list = loadAll();
  const item = list.find(w => w.address.toLowerCase() === address.toLowerCase());
  if (item) {
    Object.assign(item, updates);
    saveAll(list);
  }
}

export function clearNewActivity(address: string): void {
  updateWatchedAddress(address, { newActivity: false });
}

export function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return Promise.resolve('denied' as NotificationPermission);
  }
  return Notification.requestPermission();
}

export function sendNotification(title: string, body: string): void {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/favicon.ico' });
  }
}
