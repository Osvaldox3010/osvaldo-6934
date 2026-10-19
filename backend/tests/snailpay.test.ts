import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app';
import type { ChargeRequest } from '../src/types/snailpay';

const CHARGES_PATH = '/api/snailpay/charges';

const ELEVEN_KEYS = [
    'authorization_code',
    'card_number',
    'cvv',
    'date_created',
    'id',
    'payer_email',
    'payer_id',
    'reference',
    'status',
    'status_detail',
    'transaction_amount',
];

function buildValidRequest(): ChargeRequest {
    return {
        card_number: '1234123412341234',
        expiration_date: '12/26',
        cvv: '543',
        full_name: 'Ana Pérez',
        amount: 100,
        payer_id: 'user1',
        payer_email: 'ana@example.com',
    };
}

function expectElevenKeys(body: Record<string, unknown>): void {
    expect(Object.keys(body).sort()).toEqual([...ELEVEN_KEYS].sort());
}

describe('API de SnailPay', () => {
    const app = createApp({ forceDown: false, timeoutDelayMs: 10 });
    const downApp = createApp({ forceDown: true, timeoutDelayMs: 10 });

    beforeAll(() => {
        vi.useFakeTimers({ toFake: ['Date'] });
        vi.setSystemTime(new Date('2026-10-18T12:00:00.000Z'));
    });

    afterAll(() => {
        vi.useRealTimers();
    });

    it('responde ok en el endpoint de salud', async () => {
        const response = await request(app).get('/api/health');

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ status: 'ok' });
    });

    it.each([
        { name: 'un cobro exitoso', changes: {}, httpStatus: 201, detail: 'accredited' },
        { name: 'un nombre vacío', changes: { full_name: '' }, httpStatus: 422, detail: 'invalid_full_name' },
        { name: 'un monto igual a cero', changes: { amount: 0 }, httpStatus: 422, detail: 'invalid_amount' },
        { name: 'una tarjeta de 15 dígitos', changes: { card_number: '123412341234123' }, httpStatus: 422, detail: 'invalid_card_number' },
        { name: 'un mes de vencimiento inexistente', changes: { expiration_date: '13/26' }, httpStatus: 422, detail: 'invalid_expiration_date' },
        { name: 'una tarjeta vencida', changes: { expiration_date: '01/20' }, httpStatus: 422, detail: 'card_expired' },
        { name: 'un CVV de 4 dígitos', changes: { cvv: '5432' }, httpStatus: 422, detail: 'invalid_cvv' },
        { name: 'un correo de pagador inválido', changes: { payer_email: 'no-es-correo' }, httpStatus: 422, detail: 'invalid_payer' },
        { name: 'la tarjeta rechazada', changes: { card_number: '1111111111111111' }, httpStatus: 422, detail: 'card_declined' },
        { name: 'la tarjeta sin fondos', changes: { card_number: '2222222222222222' }, httpStatus: 422, detail: 'insufficient_funds' },
        { name: 'un CVV válido pero distinto al de prueba', changes: { cvv: '999' }, httpStatus: 422, detail: 'card_not_authorized' },
        { name: 'un vencimiento válido pero distinto al de prueba', changes: { expiration_date: '11/26' }, httpStatus: 422, detail: 'card_not_authorized' },
        { name: 'una tarjeta válida pero distinta a la de prueba', changes: { card_number: '4000000000000002' }, httpStatus: 422, detail: 'card_not_authorized' },
        { name: 'la tarjeta de timeout', changes: { card_number: '9999999999999999' }, httpStatus: 504, detail: 'gateway_timeout' },
        { name: 'la tarjeta de error del sistema', changes: { card_number: '0000000000000000' }, httpStatus: 503, detail: 'service_unavailable' },
    ])('responde $httpStatus y $detail con $name y siempre con las 11 claves', async ({ changes, httpStatus, detail }) => {
        const response = await request(app).post(CHARGES_PATH).send({ ...buildValidRequest(), ...changes });

        expect(response.status).toBe(httpStatus);
        expect(response.body.status_detail).toBe(detail);
        expectElevenKeys(response.body);
    });

    it('aprueba un cobro exitoso con código de autorización y la fecha de creación', async () => {
        const response = await request(app).post(CHARGES_PATH).send(buildValidRequest());

        expect(response.status).toBe(201);
        expect(response.body.status).toBe('approved');
        expect(response.body.authorization_code).toMatch(/^[A-Z0-9]{6}$/);
        expect(response.body.transaction_amount).toBe(100);
        expect(response.body.date_created).toBe('2026-10-18T12:00:00.000Z');
    });

    it('devuelve la tarjeta y el CVV tal como se enviaron', async () => {
        const response = await request(app).post(CHARGES_PATH).send(buildValidRequest());

        expect(response.body.card_number).toBe('1234123412341234');
        expect(response.body.cvv).toBe('543');
    });

    it('devuelve el CVV tal como llegó aunque sea inválido', async () => {
        const response = await request(app).post(CHARGES_PATH).send({ ...buildValidRequest(), cvv: '5432' });

        expect(response.body.cvv).toBe('5432');
    });

    it('responde 422 y no rompe el servidor cuando los tipos son incorrectos', async () => {
        const response = await request(app).post(CHARGES_PATH).send({ ...buildValidRequest(), cvv: 543, amount: '100' });

        expect(response.status).toBe(422);
        expect(response.body.status_detail).toBe('invalid_amount');
        expect(response.body.cvv).toBeNull();
        expect(response.body.transaction_amount).toBeNull();
        expectElevenKeys(response.body);
    });

    it('responde 400 y con las 11 claves cuando el JSON está mal escrito', async () => {
        const response = await request(app)
            .post(CHARGES_PATH)
            .set('Content-Type', 'application/json')
            .send('{"card_number":');

        expect(response.status).toBe(400);
        expect(response.body.status_detail).toBe('invalid_request');
        expect(response.body.payer_id).toBeNull();
        expect(response.body.card_number).toBeNull();
        expectElevenKeys(response.body);
    });

    it('responde 400 cuando no se envía cuerpo', async () => {
        const response = await request(app).post(CHARGES_PATH);

        expect(response.status).toBe(400);
        expect(response.body.status_detail).toBe('invalid_request');
        expectElevenKeys(response.body);
    });

    it('responde 400 cuando el cuerpo no es JSON', async () => {
        const response = await request(app)
            .post(CHARGES_PATH)
            .set('Content-Type', 'text/plain')
            .send('hola');

        expect(response.status).toBe(400);
        expect(response.body.status_detail).toBe('invalid_request');
    });

    it('responde 400 cuando el cuerpo es un arreglo', async () => {
        const response = await request(app).post(CHARGES_PATH).send([1, 2, 3]);

        expect(response.status).toBe(400);
        expect(response.body.status_detail).toBe('invalid_request');
        expectElevenKeys(response.body);
    });

    it('responde 400 y con las 11 claves cuando el cuerpo pesa más de 10 kb', async () => {
        const response = await request(app).post(CHARGES_PATH).send({ padding: 'a'.repeat(11000) });

        expect(response.status).toBe(400);
        expect(response.body.status_detail).toBe('invalid_request');
        expectElevenKeys(response.body);
    });

    it('responde 503 con el servicio caído aunque los datos sean los del cobro exitoso', async () => {
        const response = await request(downApp).post(CHARGES_PATH).send(buildValidRequest());

        expect(response.status).toBe(503);
        expect(response.body.status).toBe('error');
        expect(response.body.status_detail).toBe('service_unavailable');
        expect(response.body.authorization_code).toBeNull();
        expectElevenKeys(response.body);
    });

    it('responde 503 con el servicio caído aunque los datos sean inválidos', async () => {
        const response = await request(downApp).post(CHARGES_PATH).send({ ...buildValidRequest(), cvv: '5432' });

        expect(response.status).toBe(503);
        expect(response.body.status_detail).toBe('service_unavailable');
    });

    it('no incluye código de autorización en ningún rechazo ni error', async () => {
        const changesList = [
            { cvv: '999' },
            { card_number: '1111111111111111' },
            { card_number: '2222222222222222' },
            { card_number: '9999999999999999' },
            { card_number: '0000000000000000' },
            { amount: 0 },
        ];

        for (const changes of changesList) {
            const response = await request(app).post(CHARGES_PATH).send({ ...buildValidRequest(), ...changes });

            expect(response.body.status).not.toBe('approved');
            expect(response.body.authorization_code).toBeNull();
        }
    });
});
