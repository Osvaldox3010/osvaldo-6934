import type { LegacyUserProfile, UserProfile } from '../types/auth';

function isLastPayment(value: unknown): value is NonNullable<UserProfile['lastPayment']> {
    return (
        typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value) &&
        'cardNumber' in value &&
        typeof value.cardNumber === 'string' &&
        'cvv' in value &&
        typeof value.cvv === 'string'
    );
}

export function isUserProfile(value: unknown): value is LegacyUserProfile {
    if (typeof value !== 'object' || value === null) {
        return false;
    }

    const user = value as Record<string, unknown>;

    return (
        typeof user.id === 'string' &&
        typeof user.fullName === 'string' &&
        typeof user.email === 'string' &&
        typeof user.passwordHash === 'string' &&
        typeof user.dateCreated === 'string' &&
        (user.balance === undefined || (typeof user.balance === 'number' && Number.isFinite(user.balance))) &&
        (user.appliedChargeIds === undefined ||
            (Array.isArray(user.appliedChargeIds) &&
                user.appliedChargeIds.every((id) => typeof id === 'string'))) &&
        (user.lastPayment === undefined ||
            user.lastPayment === null ||
            isLastPayment(user.lastPayment))
    );
}

export function normalizeUserProfile(
    value: unknown,
    fallbackBalance = 0,
): UserProfile | null {
    if (!isUserProfile(value)) {
        return null;
    }

    return {
        ...value,
        balance: value.balance ?? fallbackBalance,
        appliedChargeIds: value.appliedChargeIds ?? [],
        lastPayment: value.lastPayment ?? null,
    };
}
