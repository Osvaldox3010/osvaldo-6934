import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useRecharge } from '../src/hooks/useRecharge';
import { chargeCard } from '../src/services/snailpayClient';
import { BALANCE_SAVE_ERROR_MESSAGE } from '../src/services/rechargeMessages';
import type { ChargeResponse, RechargeResult } from '../src/types/snailpay';
import type { RechargeFormValues } from '../src/validators/recharge.validator';

vi.mock('../src/services/snailpayClient', async (importOriginal) => {
    const original = await importOriginal<typeof import('../src/services/snailpayClient')>();

    return { ...original, chargeCard: vi.fn() };
});

const USER = { id: 'user-1', email: 'ana@example.com' };

function buildValidValues(): RechargeFormValues {
    return {
        cardNumber: '1234123412341234',
        expirationDate: '12/26',
        cvv: '543',
        fullName: 'Ana Pérez',
        amount: '100',
    };
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
        payer_id: 'user-1',
        payer_email: 'ana@example.com',
        card_number: '1234123412341234',
        cvv: '543',
    };
}

describe('useRecharge', () => {
    beforeEach(() => {
        vi.mocked(chargeCard).mockReset();
    });

    it('acredita un cobro aprobado y guarda el nuevo saldo', async () => {
        vi.mocked(chargeCard).mockResolvedValue({ kind: 'approved', response: buildApprovedResponse() });
        const creditBalance = vi.fn().mockReturnValue(100);
        const { result } = renderHook(() => useRecharge(USER, creditBalance));

        await act(async () => {
            await result.current.submit(buildValidValues());
        });

        expect(creditBalance).toHaveBeenCalledWith(buildApprovedResponse());
        expect(result.current.result?.kind).toBe('approved');
        expect(result.current.newBalance).toBe(100);
        expect(result.current.status).toBe('idle');
    });

    it('muestra errores de validación y no envía la solicitud', async () => {
        const { result } = renderHook(() => useRecharge(USER, vi.fn()));
        const values = buildValidValues();
        values.cardNumber = '123';

        await act(async () => {
            await result.current.submit(values);
        });

        expect(result.current.errors.cardNumber).toBe('Revisa el número de tarjeta.');
        expect(result.current.result).toBeNull();
        expect(chargeCard).not.toHaveBeenCalled();
    });

    it.each([
        ['rechazo', { kind: 'rejected', message: 'La tarjeta fue rechazada.' }],
        ['servicio no disponible', { kind: 'unavailable', message: 'No disponible.' }],
        ['timeout', { kind: 'timeout', message: 'Tiempo agotado.' }],
        ['error de red', { kind: 'network', message: 'Sin conexión.' }],
    ] as const)('conserva el resultado de %s sin acreditar saldo', async (_name, response) => {
        vi.mocked(chargeCard).mockResolvedValue(response as RechargeResult);
        const creditBalance = vi.fn();
        const { result } = renderHook(() => useRecharge(USER, creditBalance));

        await act(async () => {
            await result.current.submit(buildValidValues());
        });

        expect(result.current.result).toEqual(response);
        expect(creditBalance).not.toHaveBeenCalled();
    });

    it('muestra un aviso si el cobro ya se había aplicado', async () => {
        vi.mocked(chargeCard).mockResolvedValue({ kind: 'approved', response: buildApprovedResponse() });
        const { result } = renderHook(() => useRecharge(USER, vi.fn().mockReturnValue(null)));

        await act(async () => {
            await result.current.submit(buildValidValues());
        });

        expect(result.current.result).toEqual({
            kind: 'unavailable',
            message: 'La recarga ya se había aplicado y no se volvió a sumar al saldo.',
        });
    });

    it('avisa si el saldo no se pudo guardar después del cobro', async () => {
        vi.mocked(chargeCard).mockResolvedValue({ kind: 'approved', response: buildApprovedResponse() });
        const { result } = renderHook(() => useRecharge(USER, () => {
            throw new Error('storage failed');
        }));

        await act(async () => {
            await result.current.submit(buildValidValues());
        });

        expect(result.current.result).toEqual({
            kind: 'unavailable',
            message: BALANCE_SAVE_ERROR_MESSAGE,
        });
    });

    it('ignora un segundo envío mientras el primero sigue pendiente', async () => {
        let finishCharge: (value: RechargeResult) => void = () => undefined;
        vi.mocked(chargeCard).mockReturnValue(new Promise((resolve) => {
            finishCharge = resolve;
        }));
        const { result } = renderHook(() => useRecharge(USER, vi.fn().mockReturnValue(100)));
        let firstSubmission: Promise<void> = Promise.resolve();

        act(() => {
            firstSubmission = result.current.submit(buildValidValues());
            void result.current.submit(buildValidValues());
        });

        expect(result.current.status).toBe('submitting');
        expect(chargeCard).toHaveBeenCalledTimes(1);

        await act(async () => {
            finishCharge({ kind: 'approved', response: buildApprovedResponse() });
            await firstSubmission;
        });

        expect(result.current.status).toBe('idle');
    });

    it('limpia los errores y el resultado al iniciar un nuevo envío', async () => {
        vi.mocked(chargeCard).mockResolvedValue({
            kind: 'rejected',
            message: 'La tarjeta fue rechazada.',
        });
        const { result } = renderHook(() => useRecharge(USER, vi.fn()));
        const invalidValues = buildValidValues();
        invalidValues.cvv = '';

        await act(async () => {
            await result.current.submit(invalidValues);
        });
        expect(result.current.errors.cvv).toBeDefined();

        await act(async () => {
            await result.current.submit(buildValidValues());
        });
        expect(result.current.errors).toEqual({});
        expect(result.current.result?.kind).toBe('rejected');
    });
});
