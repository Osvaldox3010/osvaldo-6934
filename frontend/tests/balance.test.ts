import { describe, expect, it } from 'vitest';
import { addMoney, applyApprovedCharge } from '../src/services/balance';
import type { Account } from '../src/services/balance';
import type { ChargeResponse } from '../src/types/snailpay';

function buildApprovedResponse(): ChargeResponse {
    return {
        id: 'charge-1',
        status: 'approved',
        status_detail: 'accredited',
        transaction_amount: 100,
        date_created: '2026-10-22T00:00:00.000Z',
        authorization_code: 'ABC123',
        reference: 'SP-CHARGE1',
        payer_id: 'user-1',
        payer_email: 'ana@example.com',
        card_number: '1234123412341234',
        cvv: '543',
    };
}

const ACCOUNT: Account = { balance: 0, appliedChargeIds: [] };

describe('addMoney', () => {
    it.each([
        [0.1, 0.2, 0.3],
        [100, 50.25, 150.25],
        [0, 100, 100],
    ])('suma %s y %s sin errores de decimales', (current, amount, expected) => {
        expect(addMoney(current, amount)).toBe(expected);
    });
});

describe('applyApprovedCharge', () => {
    it('acredita el cobro y guarda su identificador', () => {
        expect(applyApprovedCharge(ACCOUNT, buildApprovedResponse())).toEqual({
            balance: 100,
            appliedChargeIds: ['charge-1'],
        });
    });

    it('no suma dos veces el mismo cobro', () => {
        const firstResult = applyApprovedCharge(ACCOUNT, buildApprovedResponse());
        const secondResult = applyApprovedCharge(firstResult, buildApprovedResponse());

        expect(secondResult).toBe(firstResult);
    });

    it.each([
        ['rechazado', { status: 'rejected' }],
        ['error', { status: 'error' }],
        ['detalle distinto', { status_detail: 'card_declined' }],
        ['monto nulo', { transaction_amount: null }],
        ['monto cero', { transaction_amount: 0 }],
        ['monto negativo', { transaction_amount: -1 }],
        ['monto infinito', { transaction_amount: Number.POSITIVE_INFINITY }],
    ] as const)('ignora un cobro con %s', (_name, changes) => {
        const response = { ...buildApprovedResponse(), ...changes } as ChargeResponse;

        expect(applyApprovedCharge(ACCOUNT, response)).toBe(ACCOUNT);
    });

    it('no modifica la cuenta original', () => {
        applyApprovedCharge(ACCOUNT, buildApprovedResponse());

        expect(ACCOUNT).toEqual({ balance: 0, appliedChargeIds: [] });
    });
});
