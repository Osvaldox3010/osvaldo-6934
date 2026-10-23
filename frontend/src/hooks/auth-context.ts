import { createContext } from 'react';
import type { AuthUser, LoginInput, LoginResult, RegisterInput, RegisterResult } from '../types/auth';
import type { ChargeResponse } from '../types/snailpay';

export type AuthContextValue = {
    user: AuthUser | null;
    balance: number;
    register: (input: RegisterInput) => Promise<RegisterResult>;
    login: (input: LoginInput) => Promise<LoginResult>;
    logout: () => void;
    creditBalance: (response: ChargeResponse) => number | null;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
