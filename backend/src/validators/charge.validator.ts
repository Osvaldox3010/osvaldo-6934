// Comprueba que el CVV tenga exactamente tres dígitos.
export function isValidCvv(value: unknown): boolean {
    return typeof value === 'string' && /^\d{3}$/.test(value);
}

// Comprueba que el número de tarjeta tenga exactamente 16 dígitos.
export function isValidCard(value: unknown): boolean {
    return typeof value === 'string' && /^\d{16}$/.test(value);
}

// Comprueba el formato MM/YY y que el mes esté entre 01 y 12.
export function isValidExpirationFormat(value: unknown): boolean {
    return typeof value === 'string' && /^(0[1-9]|1[0-2])\/(\d{2})$/.test(value);
}

// Indica si la tarjeta ya venció, comparando el año y mes en UTC.
export function isExpired(expirationDate: string, now: Date): boolean {
    const [month, year] = expirationDate.split('/').map(Number);

    const expirationYear = 2000 + (year ?? 0);
    const expirationMonth = month ?? 0;
    const currentMonth = now.getUTCMonth() + 1;
    const currentYear = now.getUTCFullYear();

    if (expirationYear < currentYear) {
        return true;
    }

    if (expirationYear === currentYear && expirationMonth < currentMonth) {
        return true;
    }

    return false;
}

// Valida el nombre después de quitar espacios al inicio y al final.
export function isValidFullName(value: unknown): boolean {
    if (typeof value !== 'string') {
        return false;
    }

    const name = value.trim();

    return name.length >= 3 && name.length <= 80 && /^\p{L}[\p{L} .'-]*$/u.test(name);
}

// Comprueba que el monto esté dentro del rango y use hasta dos decimales.
export function isValidAmount(value: unknown): boolean {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
        return false;
    }

    const scaled = value * 100;

    const hasValidDecimals = Math.abs(scaled - Math.round(scaled)) < 1e-6;

    return hasValidDecimals && value > 0 && value <= 100000;
}

// Comprueba que el identificador del pagador use caracteres permitidos.
export function isValidPayerId(value: unknown): boolean {
    return typeof value === 'string' && /^[A-Za-z0-9-]{1,100}$/.test(value);
}

// Valida el formato y la longitud del correo del pagador.
export function isValidPayerEmail(value: unknown): boolean {
    return typeof value === 'string' && value.length < 255 && /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(value);
}