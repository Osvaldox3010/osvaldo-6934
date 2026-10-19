import type { SnailPayConfig } from "./types/snailpay";

// Lee la configuración de SnailPay desde las variables de entorno.
export function loadConfig(): SnailPayConfig {
    const forceDown = process.env.SNAILPAY_FORCE_DOWN === 'true';

    const parsedDelay = Number(process.env.SNAILPAY_TIMEOUT_DELAY_MS ?? 6000);

    const timeoutDelayMs =  Number.isFinite(parsedDelay) && parsedDelay >= 0
        ? parsedDelay
        : 6000;

    return {
        forceDown,
        timeoutDelayMs,
    };
}
