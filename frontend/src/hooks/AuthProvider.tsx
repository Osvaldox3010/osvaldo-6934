import { useState } from 'react';
import type { ReactNode } from 'react';
import type { AuthUser, LoginInput, LoginResult, RegisterInput, RegisterResult } from '../types/auth';
import {
    loginUser,
    logoutUser,
    readCurrentUser,
    registerUser,
    creditUserBalance,
} from '../services/auth.service';
import { AuthContext } from './auth-context';
import { DEFAULT_HASH_PARAMS, HashParams } from '../services/password.service';
import type { ChargeResponse } from '../types/snailpay';

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

    function creditBalance(response: ChargeResponse): number | null {
        const balance = creditUserBalance(response);

        if (balance !== null) {
            setUser((currentUser) => currentUser === null
                ? currentUser
                : { ...currentUser, balance });
        }

        return balance;
    }

    return (
        <AuthContext.Provider value={{ user, balance: user?.balance ?? 0, register, login, logout, creditBalance }}>
            { children }
        </AuthContext.Provider>
    );
}