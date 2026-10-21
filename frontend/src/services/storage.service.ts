export const STORAGE_KEYS = {
    user: 'snailRace.user',
    session: 'snailRace.session',
    balance: 'snailRace.balance',
} as const;

export type StorageKey =
    (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

export function readItem(key: StorageKey): unknown {
    try {
        const text = window.localStorage.getItem(key);

        if (text === null) {
            return null;
        }

        return JSON.parse(text);
    } catch {
        return null;
    }
}

export function writeItem(key: StorageKey, value: unknown): boolean {
    try {
        window.localStorage.setItem(key, JSON.stringify(value));

        return true;
    } catch {
        return false;
    }
}

export function removeItem(key: string): void {
    try {
        window.localStorage.removeItem(key);
    } catch {
        return;
    }
}
