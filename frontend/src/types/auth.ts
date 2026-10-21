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
    | { ok: false; reason: RegisterFailureReason };

export type LoginResult =
    | { ok: true; user: AuthUser }
    | { ok: false; reason: LoginFailureReason };

export type RegisterFailureReason = 'invalid_input' | 'account_exists' | 'storage_failed';

export type LoginFailureReason = 'invalid_credentials' | 'storage_failed';

export type RegisterFormValues = {
    fullName: string;
    email: string;
    password: string;
    confirmation: string;
};
export type LoginFormValues = {
    email: string;
    password: string;
};


export type RegisterFormErrors = {
    fullName?: string;
    email?: string;
    password?: string;
    confirmation?: string;
};


export type LoginFormErrors = {
    email?: string;
    password?: string;
};

