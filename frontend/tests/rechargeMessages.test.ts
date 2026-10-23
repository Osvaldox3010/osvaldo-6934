import { describe, expect, it } from 'vitest';
import { STATUS_DETAIL_MESSAGES } from '../src/services/rechargeMessages';

describe('STATUS_DETAIL_MESSAGES', () => {
    it('tiene un mensaje no vacío para cada código', () => {
        for (const message of Object.values(STATUS_DETAIL_MESSAGES)) {
            expect(message.trim()).not.toBe('');
        }
    });

    it('contiene los 14 mensajes del catálogo', () => {
        expect(Object.keys(STATUS_DETAIL_MESSAGES)).toHaveLength(14);
    });

    it('usa el mensaje indicado para una recarga aprobada', () => {
        expect(STATUS_DETAIL_MESSAGES.accredited).toBe('La recarga fue aprobada.');
    });
});
