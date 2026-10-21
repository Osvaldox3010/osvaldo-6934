export function isValidFullName(value: unknown): boolean {
    if (typeof value !== 'string') {
        return false;
    }

    const name = value.trim();

    return name.length >= 3 && name.length <= 80 && /^\p{L}[\p{L} .'-]*$/u.test(name);
}

export function isValidEmail(value: unknown): boolean {
    return typeof value === 'string' && value.length < 255 && /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(value);
}

export function isValidPassword(value: unknown): boolean {
    return typeof value === 'string' && value.length >= 8 && value.length <= 128 &&
                            /[A-Z]/.test(value) &&
                            /[a-z]/.test(value) &&
                            /[0-9]/.test(value);
}

export function doPasswordsMatch(password: unknown, confirmation: unknown): boolean{
    return typeof password === 'string' && typeof confirmation === 'string' && password === confirmation;
}
