import { describe, expect, it } from 'vitest';
import {
    normalizeCardNumber,
    validateRechargeForm,
} from '../src/validators/recharge.validator';
import type { RechargeFormValues } from '../src/validators/recharge.validator';

function buildValidValues(): RechargeFormValues {
    return {
        cardNumber: '1234123412341234',
        expirationDate: '12/26',
        cvv: '543',
        fullName: 'Ana Pérez',
        amount: '100',
    };
}

describe('validateRechargeForm', () => {
    it('acepta los valores válidos', () => {
        expect(validateRechargeForm(buildValidValues())).toEqual({});
    });

    it('acepta espacios en la tarjeta', () => {
        const values = buildValidValues();
        values.cardNumber = '1234 1234 1234 1234';

        expect(validateRechargeForm(values)).toEqual({});
    });

    it.each([
        ['tarjeta de 15 dígitos', 'cardNumber', '123412341234123'],
        ['tarjeta con letras', 'cardNumber', '123412341234abcd'],
        ['fecha con mes inválido', 'expirationDate', '13/26'],
        ['fecha con formato incorrecto', 'expirationDate', '1226'],
        ['CVV de 4 dígitos', 'cvv', '5432'],
        ['nombre muy corto', 'fullName', 'AB'],
        ['nombre vacío', 'fullName', '   '],
        ['monto cero', 'amount', '0'],
        ['monto negativo', 'amount', '-5'],
        ['monto con más de dos decimales', 'amount', '10.123'],
        ['notación exponencial', 'amount', '1e3'],
        ['monto mayor al máximo', 'amount', '100000.01'],
        ['monto vacío', 'amount', ''],
    ] as const)('rechaza %s', (_name, field, value) => {
        const values = buildValidValues();
        values[field] = value;

        expect(validateRechargeForm(values)).toHaveProperty(field);
    });

    it('devuelve todos los errores de campo a la vez', () => {
        const values = buildValidValues();
        values.cardNumber = '123';
        values.cvv = '12';

        expect(validateRechargeForm(values)).toMatchObject({
            cardNumber: 'Revisa el número de tarjeta.',
            cvv: 'Revisa el CVV.',
        });
    });

    it('deja la validación de tarjeta vencida a SnailPay', () => {
        const values = buildValidValues();
        values.expirationDate = '01/20';

        expect(validateRechargeForm(values)).not.toHaveProperty('expirationDate');
    });
});

describe('normalizeCardNumber', () => {
    it('quita espacios sin cambiar otros caracteres', () => {
        expect(normalizeCardNumber('1234 1234 1234 1234')).toBe('1234123412341234');
        expect(normalizeCardNumber('12341234')).toBe('12341234');
    });
});
