import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { loadConfig } from '../src/config';

function clearSnailPayVariables(): void {
    delete process.env.SNAILPAY_FORCE_DOWN;
    delete process.env.SNAILPAY_TIMEOUT_DELAY_MS;
}

describe('loadConfig', () => {
    beforeEach(() => {
        clearSnailPayVariables();
    });

    afterEach(() => {
        clearSnailPayVariables();
    });

    it('usa los valores por defecto cuando no hay variables de entorno', () => {
        expect(loadConfig()).toEqual({ forceDown: false, timeoutDelayMs: 6000 });
    });

    it('activa forceDown cuando la variable vale true', () => {
        process.env.SNAILPAY_FORCE_DOWN = 'true';

        expect(loadConfig().forceDown).toBe(true);
    });

    it('desactiva forceDown cuando la variable vale false', () => {
        process.env.SNAILPAY_FORCE_DOWN = 'false';

        expect(loadConfig().forceDown).toBe(false);
    });

    it('desactiva forceDown con cualquier otro valor', () => {
        process.env.SNAILPAY_FORCE_DOWN = 'yes';

        expect(loadConfig().forceDown).toBe(false);
    });

    it('usa el retraso indicado en la variable', () => {
        process.env.SNAILPAY_TIMEOUT_DELAY_MS = '250';

        expect(loadConfig().timeoutDelayMs).toBe(250);
    });

    it('acepta un retraso de cero', () => {
        process.env.SNAILPAY_TIMEOUT_DELAY_MS = '0';

        expect(loadConfig().timeoutDelayMs).toBe(0);
    });

    it('vuelve al valor por defecto cuando el retraso no es un número', () => {
        process.env.SNAILPAY_TIMEOUT_DELAY_MS = 'abc';

        expect(loadConfig().timeoutDelayMs).toBe(6000);
    });

    it('vuelve al valor por defecto cuando el retraso es negativo', () => {
        process.env.SNAILPAY_TIMEOUT_DELAY_MS = '-5';

        expect(loadConfig().timeoutDelayMs).toBe(6000);
    });
});
