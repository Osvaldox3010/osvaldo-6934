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
import { normalizeUserProfile } from '../validators/stored-data.validator';
import { isValidEmail, isValidFullName, isValidPassword } from '../validators/register.validator';
import { applyApprovedCharge } from './balance';
import type { ChargeResponse } from '../types/snailpay';

function normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
}

function toAuthUser(profile: UserProfile): AuthUser {
    return {
        id: profile.id,
        fullName: profile.fullName,
        email: profile.email,
        dateCreated: profile.dateCreated,
        balance: profile.balance,
    };
}

function readStoredUserProfile(): { profile: UserProfile | null; storageFailed: boolean } {
    const stored = readItem(STORAGE_KEYS.user);
    const savedBalance = readItem(STORAGE_KEYS.balance);
    const fallbackBalance =
        typeof savedBalance === 'number' && Number.isFinite(savedBalance) ? savedBalance : 0;
    const profile = normalizeUserProfile(stored, fallbackBalance);

    if (profile === null) {
        return { profile: null, storageFailed: false };
    }

    const needsMigration =
        !Object.prototype.hasOwnProperty.call(stored, 'balance') ||
        !Object.prototype.hasOwnProperty.call(stored, 'appliedChargeIds') ||
        !Object.prototype.hasOwnProperty.call(stored, 'lastPayment');

    if (needsMigration && !writeItem(STORAGE_KEYS.user, profile)) {
        return { profile: null, storageFailed: true };
    }

    return { profile, storageFailed: false };
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

    const storedUser = readStoredUserProfile();
    if (storedUser.storageFailed) {
        return { ok: false, reason: 'storage_failed' };
    }
    if (storedUser.profile !== null) {
        return { ok: false, reason: 'account_exists' };
    }

    const date = new Date().toISOString();

    const profile: UserProfile = {
        id: crypto.randomUUID(),
        fullName: input.fullName.trim(),
        email: normalizeEmail(input.email),
        passwordHash: await hashPassword(input.password, params),
        dateCreated: date,
        balance: 0,
        appliedChargeIds: [],
        lastPayment: null,
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

    const storedUserResult = readStoredUserProfile();
    const storedUser = storedUserResult.profile;

    if (storedUserResult.storageFailed) {
        return { ok: false, reason: 'storage_failed' };
    }

    if (storedUser === null || normalizeEmail(input.email) !== storedUser.email) {
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
    const storedUserResult = readStoredUserProfile();
    const storedUser = storedUserResult.profile;

    if (
        storedUser === null ||
        storedUserResult.storageFailed ||
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

export function readCurrentBalance(): number {
    return readStoredUserProfile().profile?.balance ?? 0;
}

export function creditUserBalance(response: ChargeResponse): number | null {
    const stored = readStoredUserProfile();

    if (stored.storageFailed) {
        throw new Error('No se pudo leer el saldo guardado.');
    }

    const profile = stored.profile;

    if (profile === null || readCurrentUser() === null) {
        throw new Error('No hay una sesión activa para guardar el saldo.');
    }

    const account = { balance: profile.balance, appliedChargeIds: profile.appliedChargeIds };
    const updatedAccount = applyApprovedCharge(account, response);

    if (updatedAccount.appliedChargeIds.length === account.appliedChargeIds.length) {
        return null;
    }

    const updatedProfile: UserProfile = {
        ...profile,
        balance: updatedAccount.balance,
        appliedChargeIds: updatedAccount.appliedChargeIds,
        lastPayment:
            typeof response.card_number === 'string' && typeof response.cvv === 'string'
                ? { cardNumber: response.card_number, cvv: response.cvv }
                : null,
    };

    if (!writeItem(STORAGE_KEYS.user, updatedProfile)) {
        throw new Error('No se pudo guardar el saldo del usuario.');
    }

    if (!writeItem(STORAGE_KEYS.balance, updatedProfile.balance)) {
        const userRestored = writeItem(STORAGE_KEYS.user, profile);
        if (!userRestored) {
            throw new Error('No se pudo guardar ni restaurar el saldo del usuario.');
        }
        throw new Error('No se pudo guardar el saldo.');
    }

    return updatedProfile.balance;
}
