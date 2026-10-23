import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    creditUserBalance,
    readCurrentUser,
} from '../src/services/auth.service';
import { STORAGE_KEYS } from '../src/services/storage.service';
import type { ChargeResponse } from '../src/types/snailpay';

const PROFILE = {
    id: 'user-1',
    fullName: 'Ana Pérez',
    email: 'ana@example.com',
    passwordHash: 'hash',
    dateCreated: '2026-10-22T00:00:00.000Z',
};

function saveUserWithoutRechargeFields() {
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify({
        ...PROFILE,
        balance: 0,
    }));
    localStorage.setItem(STORAGE_KEYS.balance, JSON.stringify(0));
    localStorage.setItem(STORAGE_KEYS.session, JSON.stringify({
        userId: PROFILE.id,
        startedAt: '2026-10-22T00:00:00.000Z',
    }));
}

function buildApprovedResponse(): ChargeResponse {
    return {
        id: 'charge-1',
        status: 'approved',
        status_detail: 'accredited',
        transaction_amount: 100,
        date_created: '2026-10-22T00:00:00.000Z',
        authorization_code: 'ABC123',
        reference: 'SP-CHARGE1',
        payer_id: PROFILE.id,
        payer_email: PROFILE.email,
        card_number: '1234123412341234',
        cvv: '543',
    };
}

describe('creditUserBalance', () => {
    beforeEach(() => {
        localStorage.clear();
        saveUserWithoutRechargeFields();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('migra usuarios existentes al leerlos', () => {
        expect(readCurrentUser()?.balance).toBe(0);

        const savedProfile = JSON.parse(localStorage.getItem(STORAGE_KEYS.user) ?? '{}');
        expect(savedProfile.appliedChargeIds).toEqual([]);
        expect(savedProfile.lastPayment).toBeNull();
    });

    it('guarda el saldo nuevo y los datos de pago aprobados', () => {
        expect(creditUserBalance(buildApprovedResponse())).toBe(100);

        const savedProfile = JSON.parse(localStorage.getItem(STORAGE_KEYS.user) ?? '{}');
        expect(savedProfile.balance).toBe(100);
        expect(savedProfile.appliedChargeIds).toEqual(['charge-1']);
        expect(savedProfile.lastPayment).toEqual({
            cardNumber: '1234123412341234',
            cvv: '543',
        });
        expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.balance) ?? 'null')).toBe(100);
    });

    it('no aplica dos veces el mismo cobro', () => {
        creditUserBalance(buildApprovedResponse());

        expect(creditUserBalance(buildApprovedResponse())).toBeNull();
        expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.user) ?? '{}').balance).toBe(100);
    });

    it('no cambia el saldo para una respuesta rechazada', () => {
        const response = { ...buildApprovedResponse(), status: 'rejected' as const };

        expect(creditUserBalance(response)).toBeNull();
        expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.user) ?? '{}').balance).toBe(0);
    });

    it('lanza un error explícito si no puede guardar el usuario', () => {
        readCurrentUser();
        const originalSetItem = Storage.prototype.setItem;
        vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key, value) {
            if (key === STORAGE_KEYS.user) {
                throw new Error('Storage is full');
            }
            originalSetItem.call(this, key, value);
        });

        expect(() => creditUserBalance(buildApprovedResponse())).toThrow(
            'No se pudo guardar el saldo del usuario.',
        );
    });
});
