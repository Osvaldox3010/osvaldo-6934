import type {
    AuthUser,
    LoginInput,
    LoginResult,
    RegisterInput,
    RegisterResult,
    UserProfile,
} from '../types/auth';
import { readItem, removeItem, STORAGE_KEYS, writeItem } from './storage.service';
import { DEFAULT_HASH_PARAMS, hashPassword, verifyPassword } from './password.service';
import type { HashParams } from './password.service';
import { isUserProfile } from '../validators/stored-data.validator';
import { isValidEmail, isValidFullName, isValidPassword } from '../validators/register.validator';

function normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
}

function toAuthUser(profile: UserProfile): AuthUser {
    return {
        id: profile.id,
        fullName: profile.fullName,
        email: profile.email,
        dateCreated: profile.dateCreated,
    };
}

export async function registerUser(
    input: RegisterInput,
    params: HashParams = DEFAULT_HASH_PARAMS,
): Promise<RegisterResult> {
    if (
        typeof input !== 'object' ||
        input === null ||
        !isValidFullName(input.fullName) ||
        !isValidEmail(normalizeEmail(input.email)) ||
        !isValidPassword(input.password)
    ) {
        return { ok: false, reason: 'invalid_input' };
    }

    if (isUserProfile(readItem(STORAGE_KEYS.user))) {
        return { ok: false, reason: 'account_exists' };
    }

    const date = new Date().toISOString();

    const profile: UserProfile = {
        id: crypto.randomUUID(),
        fullName: input.fullName.trim(),
        email: normalizeEmail(input.email),
        passwordHash: await hashPassword(input.password, params),
        dateCreated: date 
    };
    const session = {
        userId: profile.id,
        startedAt: date 
    };

    const userSaved = writeItem(STORAGE_KEYS.user, profile);
    const sessionSaved = writeItem(STORAGE_KEYS.session, session);
    const balanceSaved = writeItem(STORAGE_KEYS.balance, 0);

    if (!userSaved || !sessionSaved || !balanceSaved) {
        removeItem(STORAGE_KEYS.user);
        removeItem(STORAGE_KEYS.session);
        removeItem(STORAGE_KEYS.balance);
        return { ok: false, reason: 'storage_failed' };
    }

    return { ok: true, user: toAuthUser(profile) };
}

export async function loginUser(input: LoginInput): Promise<LoginResult> {
    if (
        typeof input !== 'object' ||
        input === null ||
        typeof input.email !== 'string' ||
        typeof input.password !== 'string'
    ) {
        return { ok: false, reason: 'invalid_credentials' };
    }

    const storedUser = readItem(STORAGE_KEYS.user);

    if (!isUserProfile(storedUser) || normalizeEmail(input.email) !== storedUser.email) {
        return { ok: false, reason: 'invalid_credentials' };
    }

    if (!(await verifyPassword(input.password, storedUser.passwordHash))) {
        return { ok: false, reason: 'invalid_credentials' };
    }

    const date = new Date().toISOString();

    const session = {
        userId: storedUser.id,
        startedAt: date 
    };

    if (!writeItem(STORAGE_KEYS.session, session)) {
        return { ok: false, reason: 'storage_failed' };
    }

    return { ok: true, user: toAuthUser(storedUser) };
}

export function logoutUser(): void {
    removeItem(STORAGE_KEYS.session);
}

export function readCurrentUser(): AuthUser | null {
    const session = readItem(STORAGE_KEYS.session);
    const storedUser = readItem(STORAGE_KEYS.user);

    if (
        !isUserProfile(storedUser) ||
        typeof session !== 'object' ||
        session === null ||
        Array.isArray(session) ||
        !('userId' in session) ||
        !('startedAt' in session) ||
        typeof session.userId !== 'string' ||
        typeof session.startedAt !== 'string' ||
        session.userId !== storedUser.id
    ) {
        return null;
    }

    return toAuthUser(storedUser);
}
