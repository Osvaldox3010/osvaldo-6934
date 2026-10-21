export type UserProfile = {
    id: string;
    fullName: string;
    email: string;
    passwordHash: string;
    dateCreated: string;
};

export type Session = {
    userId: string;
    dateOpened: string;
};

export type AuthUser = Omit<UserProfile, 'passwordHash'>;

export type RegisterInput = {
    fullName: string;
    email: string;
    password: string;
};

export type LoginInput = {
    email: string;
    password: string;
};

export type RegisterResult =
    | { ok: true; user: AuthUser }
    | { ok: false; reason: 'invalid_input' | 'account_exists' | 'storage_failed' };

export type LoginResult =
    | { ok: true; user: AuthUser }
    | { ok: false; reason: 'invalid_credentials' | 'storage_failed' };
