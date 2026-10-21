import { useState } from 'react';
import type { ReactNode } from 'react';
import type { AuthUser, LoginInput, LoginResult, RegisterInput, RegisterResult } from '../types/auth';
import {
    loginUser,
    logoutUser,
    readCurrentUser,
    registerUser,
} from '../services/auth.service';
import { AuthContext } from './auth-context';
import { DEFAULT_HASH_PARAMS, HashParams } from '../services/password.service';

type AuthProviderProps = {
    children: ReactNode;
    hashParams?: HashParams;
};

export function AuthProvider({ children, hashParams = DEFAULT_HASH_PARAMS }: AuthProviderProps) {
    const [user, setUser] = useState<AuthUser | null>(readCurrentUser);

    async function register(input: RegisterInput): Promise<RegisterResult> {
        const result = await registerUser(input, hashParams);

        if (result.ok) {
            setUser(result.user);
        }

        return result;
    }

    async function login(input: LoginInput): Promise<LoginResult> {
        const result = await loginUser(input);

        if (result.ok) {
            setUser(result.user);
        }

        return result;
    }

    function logout() {
        logoutUser();
        setUser(null);
    }

    return (
        <AuthContext.Provider value = {{ user, register, login, logout }}>
            { children }
        </AuthContext.Provider>
    );
};