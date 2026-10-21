import { argon2id, argon2Verify } from 'hash-wasm';

export type HashParams = {
    memorySize: number;
    iterations: number;
    parallelism: number;
};

export const DEFAULT_HASH_PARAMS: HashParams = {
    memorySize: 19456,
    iterations: 2,
    parallelism: 1,
};

const SALT_LENGTH = 16;
const HASH_LENGTH = 32;

export async function hashPassword(password: string, params: HashParams = DEFAULT_HASH_PARAMS): Promise<string> {

    const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));

    return await argon2id({
        password,
        salt,
        parallelism: params.parallelism,
        iterations: params.iterations,
        memorySize: params.memorySize,
        hashLength: HASH_LENGTH,
        outputType: 'encoded',
    });
}

export async function verifyPassword(password: string, encodedHash: string): Promise<boolean> {

    try {
        return await argon2Verify({
            password,
            hash: encodedHash,
        });
    } catch {
        return false;
    }
}
