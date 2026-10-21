import { createContext } from 'react';
import { AuthUser, LoginResult, LoginInput, RegisterInput, RegisterResult } from '../types/auth';

export type AuthContextValue = {
    user: AuthUser | null;
    register: (input: RegisterInput) => Promise<RegisterResult>;
    login: (input: LoginInput) => Promise<LoginResult>;
    logout: () => void;
};

export const AuthContext = createContext<AuthContextValue | null>(null);