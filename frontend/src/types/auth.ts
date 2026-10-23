export type UserProfile = {
    id: string;
    fullName: string;
    email: string;
    passwordHash: string;
    dateCreated: string;
    balance: number;
    appliedChargeIds: string[];
    lastPayment: LastPayment;
};

export type LastPayment = {
    cardNumber: string;
    cvv: string;
} | null;

export type LegacyUserProfile = Omit<UserProfile, 'balance' | 'appliedChargeIds' | 'lastPayment'> &
    Partial<Pick<UserProfile, 'balance' | 'appliedChargeIds' | 'lastPayment'>>;

export type Session = {
    userId: string;
    startedAt: string;
};

export type AuthUser = Pick<UserProfile, 'id' | 'fullName' | 'email' | 'dateCreated' | 'balance'>;

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
