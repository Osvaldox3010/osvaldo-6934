import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    chargeCard,
    toChargeRequest,
    toRechargeResult,
} from '../src/services/snailpayClient';
import type { RechargeResult } from '../src/types/snailpay';
import type { RechargeFormValues } from '../src/validators/recharge.validator';
import {
    CLIENT_TIMEOUT_MESSAGE,
    NETWORK_ERROR_MESSAGE,
    STATUS_DETAIL_MESSAGES,
} from '../src/services/rechargeMessages';
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

function jsonResponse(body: unknown, status: number): Response {
    return {
        status,
        json: async () => body,
    } as Response;
}

function buildValues(): RechargeFormValues {
    return {
        cardNumber: '1234 1234 1234 1234',
        expirationDate: '12/26',
        cvv: '543',
        fullName: ' Ana Pérez ',
        amount: '100.50',
    };
}

describe('toRechargeResult', () => {
    it('acepta una respuesta aprobada con el monto solicitado', () => {
        expect(toRechargeResult(201, buildApprovedResponse(), 100)).toEqual({
            kind: 'approved',
            response: buildApprovedResponse(),
        });
    });

    it.each([
        [201, { ...buildApprovedResponse(), transaction_amount: 50 }, 100],
        [201, { ...buildApprovedResponse(), status: 'rejected' }, 100],
        [200, buildApprovedResponse(), 100],
        [422, { status: 'rejected', status_detail: 'unknown_code' }, 100],
        [500, { status: 'error', status_detail: 'service_unavailable' }, 100],
        [201, { status: 'approved', status_detail: 'accredited', transaction_amount: 100 }, 100],
        [201, 'not an object', 100],
        [201, null, 100],
    ])('trata como respuesta no confiable status=%s', (httpStatus, body, amount) => {
        const result = toRechargeResult(httpStatus, body, amount);

        expect(result.kind).not.toBe('approved');
        if (result.kind === 'unavailable') {
            expect(result.message).toBe(STATUS_DETAIL_MESSAGES.service_unavailable);
        }
    });

    it('traduce rechazos reconocidos y desconocidos', () => {
        expect(toRechargeResult(422, {
            status: 'rejected',
            status_detail: 'invalid_cvv',
        }, 100)).toEqual({ kind: 'rejected', message: 'Revisa el CVV.' });

        expect(toRechargeResult(422, {
            status: 'rejected',
            status_detail: 'unknown_code',
        }, 100)).toEqual({ kind: 'rejected', message: 'No se pudo completar la recarga.' });
    });

    it('clasifica falta de servicio y timeout del gateway', () => {
        expect(toRechargeResult(503, {
            status: 'error',
            status_detail: 'service_unavailable',
        }, 100)).toEqual({ kind: 'unavailable', message: STATUS_DETAIL_MESSAGES.service_unavailable });

        expect(toRechargeResult(504, {
            status: 'error',
            status_detail: 'gateway_timeout',
        }, 100)).toEqual({ kind: 'timeout', message: STATUS_DETAIL_MESSAGES.gateway_timeout });
    });
});

describe('toChargeRequest', () => {
    it('normaliza tarjeta y titular y añade los datos del usuario', () => {
        expect(toChargeRequest(buildValues(), { id: 'user-1', email: 'ana@example.com' })).toEqual({
            card_number: '1234123412341234',
            expiration_date: '12/26',
            cvv: '543',
            full_name: 'Ana Pérez',
            amount: 100.5,
            payer_id: 'user-1',
            payer_email: 'ana@example.com',
        });
    });
});

describe('chargeCard', () => {
    beforeEach(() => {
        vi.useRealTimers();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.useRealTimers();
    });

    it('envía una petición JSON al endpoint de SnailPay', async () => {
        const fetchMock = vi.fn().mockResolvedValue(jsonResponse(buildApprovedResponse(), 201));
        vi.stubGlobal('fetch', fetchMock);
        const request = toChargeRequest(buildValues(), { id: 'user-1', email: 'ana@example.com' });

        await chargeCard(request, { baseUrl: 'http://localhost:3001' });

        expect(fetchMock).toHaveBeenCalledWith(
            'http://localhost:3001/api/snailpay/charges',
            expect.objectContaining({
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(request),
            }),
        );
    });

    it('devuelve network si fetch no puede conectarse', async () => {
        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
        const request = toChargeRequest(buildValues(), { id: 'user-1', email: 'ana@example.com' });

        await expect(chargeCard(request)).resolves.toEqual({
            kind: 'network',
            message: NETWORK_ERROR_MESSAGE,
        });
    });

    it('clasifica un cuerpo que no es JSON como respuesta rara', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            status: 500,
            json: async () => { throw new SyntaxError('Invalid JSON'); },
        }));
        const request = toChargeRequest(buildValues(), { id: 'user-1', email: 'ana@example.com' });

        await expect(chargeCard(request)).resolves.toEqual({
            kind: 'unavailable',
            message: STATUS_DETAIL_MESSAGES.service_unavailable,
        });
    });

    it('devuelve timeout al cumplirse el límite de 4 segundos', async () => {
        vi.useFakeTimers();
        const fetchMock = vi.fn((_url: string, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
            init?.signal?.addEventListener('abort', () => {
                reject(new DOMException('Aborted', 'AbortError'));
            });
        }));
        vi.stubGlobal('fetch', fetchMock);
        const request = toChargeRequest(buildValues(), { id: 'user-1', email: 'ana@example.com' });

        const resultPromise = chargeCard(request);
        let isFinished = false;
        void resultPromise.then(() => {
            isFinished = true;
        });

        await vi.advanceTimersByTimeAsync(3999);
        expect(isFinished).toBe(false);

        await vi.advanceTimersByTimeAsync(1);
        await expect(resultPromise).resolves.toEqual({
            kind: 'timeout',
            message: CLIENT_TIMEOUT_MESSAGE,
        });
        expect(vi.getTimerCount()).toBe(0);
    });

    it('devuelve la respuesta aprobada del servidor', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({
            ...buildApprovedResponse(),
            transaction_amount: 100.5,
        }, 201)));
        const request = toChargeRequest(buildValues(), { id: 'user-1', email: 'ana@example.com' });

        const result: RechargeResult = await chargeCard(request);

        expect(result.kind).toBe('approved');
    });
});
