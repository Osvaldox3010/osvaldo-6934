import { UserProfile, Session } from '../types/auth';

export function isUserProfile(value: unknown): value is UserProfile {
    if (typeof value !== 'object' || value === null) {
        return false;
    }

    const user = value as Record <string, unknown>;

    return (
        typeof user.id === 'string' &&
        typeof user.fullName === 'string' &&
        typeof user.email === 'string' &&
        typeof user.passwordHash === 'string' &&
        typeof user.dateCreated === 'string'
    );
}

export function isSession(value: unknown): value is Session {
    if (typeof value !== 'object' || value === null) {
        return false;
    }

    const session = value as Record<string, unknown>;

    return (
        typeof session.userId === 'string' &&
        typeof session.startedAt === 'string'
    );
}