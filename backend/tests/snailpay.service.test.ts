import { describe, expect, it } from 'vitest';
import {
    buildReference,
    buildResult,
    findValidationError,
    generateAuthorizationCode,
    isRecord,
    processCharge,
    toNumberOrNull,
    toTextOrNull,
} from '../src/services/snailpay.service';
import type { ChargeRequest, SnailPayConfig, StatusDetail } from '../src/types/snailpay';

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

describe('toTextOrNull', () => {
    it('devuelve el texto cuando el valor es texto', () => {
        expect(toTextOrNull('abc')).toBe('abc');
    });

    it('conserva un texto vacío', () => {
        expect(toTextOrNull('')).toBe('');
    });

    it('devuelve null cuando el valor es un número', () => {
        expect(toTextOrNull(5)).toBeNull();
    });

    it('devuelve null cuando el valor es null', () => {
        expect(toTextOrNull(null)).toBeNull();
    });

    it('devuelve null cuando el valor no existe', () => {
        expect(toTextOrNull(undefined)).toBeNull();
    });
});

describe('toNumberOrNull', () => {
    it('devuelve el número cuando el valor es un número', () => {
        expect(toNumberOrNull(10.5)).toBe(10.5);
    });

    it('conserva el cero', () => {
        expect(toNumberOrNull(0)).toBe(0);
    });

    it('devuelve null para NaN', () => {
        expect(toNumberOrNull(NaN)).toBeNull();
    });

    it('devuelve null para Infinity', () => {
        expect(toNumberOrNull(Infinity)).toBeNull();
    });

    it('devuelve null cuando el número viene como texto', () => {
        expect(toNumberOrNull('10')).toBeNull();
    });
});

describe('buildReference', () => {
    it('une el prefijo SP- con los primeros 8 caracteres del id en mayúsculas', () => {
        expect(buildReference('0f8b2c5e-6a1d-4e27-8d3a-5c9f7b1e2a40')).toBe('SP-0F8B2C5E');
    });
});

describe('isRecord', () => {
    it('acepta un objeto vacío', () => {
        expect(isRecord({})).toBe(true);
    });

    it('acepta un objeto con datos', () => {
        expect(isRecord({ a: 1 })).toBe(true);
    });

    it('rechaza null', () => {
        expect(isRecord(null)).toBe(false);
    });

    it('rechaza undefined', () => {
        expect(isRecord(undefined)).toBe(false);
    });

    it('rechaza un arreglo', () => {
        expect(isRecord([])).toBe(false);
    });

    it('rechaza un texto', () => {
        expect(isRecord('texto')).toBe(false);
    });

    it('rechaza un número', () => {
        expect(isRecord(5)).toBe(false);
    });
});

describe('generateAuthorizationCode', () => {
    it('genera 6 caracteres alfanuméricos en mayúsculas', () => {
        expect(generateAuthorizationCode()).toMatch(/^[A-Z0-9]{6}$/);
    });

    it('genera códigos distintos en llamadas distintas', () => {
        expect(generateAuthorizationCode()).not.toBe(generateAuthorizationCode());
    });
});

describe('buildResult', () => {
    const now = new Date('2026-10-18T12:00:00.000Z');

    const validBody = {
        payer_id: 'user1',
        payer_email: 'ana@example.com',
        card_number: '1234123412341234',
        cvv: '543',
        amount: 100,
    };

    const elevenKeys = [
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

    it('aprueba con HTTP 201 y conserva el código de autorización', () => {
        const result = buildResult(validBody, now, 'accredited', 'A1B2C3');

        expect(result.httpStatus).toBe(201);
        expect(result.body.status).toBe('approved');
        expect(result.body.status_detail).toBe('accredited');
        expect(result.body.authorization_code).toBe('A1B2C3');
    });

    it('responde HTTP 400 y rechazado cuando la solicitud es inválida', () => {
        const result = buildResult(validBody, now, 'invalid_request');

        expect(result.httpStatus).toBe(400);
        expect(result.body.status).toBe('rejected');
    });

    it('responde HTTP 422 y rechazado cuando la tarjeta es rechazada', () => {
        const result = buildResult(validBody, now, 'card_declined');

        expect(result.httpStatus).toBe(422);
        expect(result.body.status).toBe('rejected');
    });

    it('responde HTTP 503 y error cuando el servicio no está disponible', () => {
        const result = buildResult(validBody, now, 'service_unavailable');

        expect(result.httpStatus).toBe(503);
        expect(result.body.status).toBe('error');
    });

    it('responde HTTP 504 y error cuando la pasarela tarda demasiado', () => {
        const result = buildResult(validBody, now, 'gateway_timeout');

        expect(result.httpStatus).toBe(504);
        expect(result.body.status).toBe('error');
    });

    it('no incluye código de autorización en un rechazo aunque se le pase uno', () => {
        const result = buildResult(validBody, now, 'card_declined', 'A1B2C3');

        expect(result.body.authorization_code).toBeNull();
    });

    it('devuelve los datos recibidos cuando tienen el tipo correcto', () => {
        const result = buildResult(validBody, now, 'accredited', 'A1B2C3');

        expect(result.body.payer_id).toBe('user1');
        expect(result.body.payer_email).toBe('ana@example.com');
        expect(result.body.card_number).toBe('1234123412341234');
        expect(result.body.cvv).toBe('543');
        expect(result.body.transaction_amount).toBe(100);
    });

    it('devuelve null en los campos con tipo incorrecto', () => {
        const result = buildResult({ cvv: 543, card_number: 1234, amount: '100' }, now, 'invalid_cvv');

        expect(result.body.cvv).toBeNull();
        expect(result.body.card_number).toBeNull();
        expect(result.body.transaction_amount).toBeNull();
    });

    it('devuelve null en los campos recibidos cuando el cuerpo es undefined', () => {
        const result = buildResult(undefined, now, 'invalid_request');

        expect(result.body.payer_id).toBeNull();
        expect(result.body.payer_email).toBeNull();
        expect(result.body.card_number).toBeNull();
        expect(result.body.cvv).toBeNull();
        expect(result.body.transaction_amount).toBeNull();
    });

    it('tiene exactamente las 11 claves del contrato', () => {
        const result = buildResult(validBody, now, 'accredited', 'A1B2C3');

        expect(Object.keys(result.body).sort()).toEqual([...elevenKeys].sort());
    });

    it('conserva las 11 claves cuando el cuerpo no es un objeto', () => {
        const result = buildResult(undefined, now, 'invalid_request');

        expect(Object.keys(result.body).sort()).toEqual([...elevenKeys].sort());
    });

    it('usa la fecha recibida en date_created', () => {
        const result = buildResult(validBody, now, 'accredited', 'A1B2C3');

        expect(result.body.date_created).toBe('2026-10-18T12:00:00.000Z');
    });

    it('arma la referencia a partir del id de esa misma respuesta', () => {
        const result = buildResult(validBody, now, 'accredited', 'A1B2C3');

        expect(result.body.reference).toBe(buildReference(result.body.id));
    });

    it('genera un id con formato de UUID', () => {
        const result = buildResult(validBody, now, 'accredited', 'A1B2C3');

        expect(result.body.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    });

    it.each([
        'invalid_request',
        'invalid_payer',
        'invalid_full_name',
        'invalid_amount',
        'invalid_card_number',
        'invalid_expiration_date',
        'invalid_cvv',
        'card_declined',
        'card_expired',
        'insufficient_funds',
        'card_not_authorized',
        'service_unavailable',
        'gateway_timeout',
    ] as StatusDetail[])('%s nunca se aprueba ni lleva código de autorización', (detail) => {
        const result = buildResult(validBody, now, detail, 'A1B2C3');

        expect(result.body.status).not.toBe('approved');
        expect(result.body.authorization_code).toBeNull();
    });
});

describe('findValidationError', () => {
    const now = new Date('2026-10-18T12:00:00.000Z');

    it('devuelve null cuando todos los datos son válidos', () => {
        const data = { ...buildValidRequest() };

        expect(findValidationError(data, now)).toBeNull();
    });

    it.each([
        { name: 'un correo de pagador inválido', changes: { payer_email: 'no-es-correo' }, expected: 'invalid_payer' },
        { name: 'un identificador de pagador vacío', changes: { payer_id: '' }, expected: 'invalid_payer' },
        { name: 'un nombre vacío', changes: { full_name: '' }, expected: 'invalid_full_name' },
        { name: 'un monto igual a cero', changes: { amount: 0 }, expected: 'invalid_amount' },
        { name: 'una tarjeta de 3 dígitos', changes: { card_number: '123' }, expected: 'invalid_card_number' },
        { name: 'un mes de vencimiento inexistente', changes: { expiration_date: '13/26' }, expected: 'invalid_expiration_date' },
        { name: 'una tarjeta vencida', changes: { expiration_date: '01/20' }, expected: 'card_expired' },
        { name: 'un CVV de 4 dígitos', changes: { cvv: '5432' }, expected: 'invalid_cvv' },
    ])('devuelve $expected con $name', ({ changes, expected }) => {
        const data = { ...buildValidRequest(), ...changes };

        expect(findValidationError(data, now)).toBe(expected);
    });

    it('informa primero el pagador cuando también el nombre es inválido', () => {
        const data = { ...buildValidRequest(), payer_id: '', full_name: '' };

        expect(findValidationError(data, now)).toBe('invalid_payer');
    });

    it('informa primero el monto cuando también la tarjeta es inválida', () => {
        const data = { ...buildValidRequest(), amount: 0, card_number: '123' };

        expect(findValidationError(data, now)).toBe('invalid_amount');
    });

    it('informa primero la tarjeta cuando también el CVV es inválido', () => {
        const data = { ...buildValidRequest(), card_number: '123', cvv: '5432' };

        expect(findValidationError(data, now)).toBe('invalid_card_number');
    });

    it('informa primero el formato del vencimiento cuando también el CVV es inválido', () => {
        const data = { ...buildValidRequest(), expiration_date: '13/26', cvv: '5432' };

        expect(findValidationError(data, now)).toBe('invalid_expiration_date');
    });

    it('informa primero la tarjeta vencida cuando también el CVV es inválido', () => {
        const data = { ...buildValidRequest(), expiration_date: '01/20', cvv: '5432' };

        expect(findValidationError(data, now)).toBe('card_expired');
    });

    it('informa el pagador cuando el cuerpo es un objeto vacío', () => {
        expect(findValidationError({}, now)).toBe('invalid_payer');
    });
});

describe('processCharge', () => {
    const config: SnailPayConfig = { forceDown: false, timeoutDelayMs: 10 };
    const now = new Date('2026-10-18T12:00:00.000Z');

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
    ])('responde $httpStatus y $detail con $name', async ({ changes, httpStatus, detail }) => {
        const result = await processCharge({ ...buildValidRequest(), ...changes }, config, now);

        expect(result.httpStatus).toBe(httpStatus);
        expect(result.body.status_detail).toBe(detail);
    });

    it('responde 503 cuando el servicio está caído aunque los datos sean los del cobro exitoso', async () => {
        const downConfig: SnailPayConfig = { forceDown: true, timeoutDelayMs: 10 };
        const result = await processCharge({ ...buildValidRequest() }, downConfig, now);

        expect(result.httpStatus).toBe(503);
        expect(result.body.status_detail).toBe('service_unavailable');
        expect(result.body.authorization_code).toBeNull();
    });

    it('responde 503 y no 400 cuando el servicio está caído y el cuerpo no existe', async () => {
        const downConfig: SnailPayConfig = { forceDown: true, timeoutDelayMs: 10 };
        const result = await processCharge(undefined, downConfig, now);

        expect(result.httpStatus).toBe(503);
        expect(result.body.status_detail).toBe('service_unavailable');
    });

    it.each([
        { name: 'undefined', body: undefined },
        { name: 'null', body: null },
        { name: 'un arreglo', body: [] },
        { name: 'un texto', body: 'texto' },
    ])('responde 400 y invalid_request cuando el cuerpo es $name', async ({ body }) => {
        const result = await processCharge(body, config, now);

        expect(result.httpStatus).toBe(400);
        expect(result.body.status_detail).toBe('invalid_request');
    });

    it('informa el error de validación antes que el de la tarjeta rechazada', async () => {
        const data = { ...buildValidRequest(), card_number: '1111111111111111', cvv: '5432' };
        const result = await processCharge(data, config, now);

        expect(result.body.status_detail).toBe('invalid_cvv');
    });

    it('aprueba con un código de autorización de 6 caracteres y el monto solicitado', async () => {
        const result = await processCharge({ ...buildValidRequest() }, config, now);

        expect(result.body.status).toBe('approved');
        expect(result.body.authorization_code).toMatch(/^[A-Z0-9]{6}$/);
        expect(result.body.transaction_amount).toBe(100);
    });

    it('no incluye código de autorización en ningún rechazo ni error', async () => {
        const changesList = [
            { cvv: '999' },
            { card_number: '1111111111111111' },
            { card_number: '2222222222222222' },
            { card_number: '9999999999999999' },
            { card_number: '0000000000000000' },
        ];

        for (const changes of changesList) {
            const result = await processCharge({ ...buildValidRequest(), ...changes }, config, now);

            expect(result.body.authorization_code).toBeNull();
        }
    });

    it('genera ids distintos en dos cobros exitosos seguidos', async () => {
        const first = await processCharge({ ...buildValidRequest() }, config, now);
        const second = await processCharge({ ...buildValidRequest() }, config, now);

        expect(first.body.id).not.toBe(second.body.id);
    });

    it('espera el retraso configurado antes de responder con la tarjeta de timeout', async () => {
        const slowConfig: SnailPayConfig = { forceDown: false, timeoutDelayMs: 30 };
        const startedAt = Date.now();

        await processCharge({ ...buildValidRequest(), card_number: '9999999999999999' }, slowConfig, now);

        expect(Date.now() - startedAt).toBeGreaterThanOrEqual(25);
    });
});
