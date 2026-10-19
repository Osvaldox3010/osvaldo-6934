import { describe, expect, it } from 'vitest';
import { isValidCard, isValidCvv, isValidExpirationFormat, isExpired, isValidAmount, isValidFullName, isValidPayerId, isValidPayerEmail } from '../src/validators/charge.validator';

describe('isValidCvv', () => {
    it('acepta 3 dígitos', () => {
        expect(isValidCvv('123')).toBe(true);
    });

    it('rechaza más de 3 dígitos', () => {
        expect(isValidCvv('1234')).toBe(false);
    });

    it('rechaza menos de 3 dígitos', () => {
        expect(isValidCvv('1')).toBe(false);
    });

    it('rechaza un número que no es texto', () => {
        expect(isValidCvv(12345)).toBe(false);
    });
    it('rechaza texto que no contiene solo números', () => {
        expect(isValidCvv("1a3")).toBe(false);
    });
});

describe('isValidCard', () => {
    it('Tarjeta con 16 digitos', () => {
        expect(isValidCard('1234123412341234')).toBe(true);
    });
    it('Rechaza tarjeta con más de 16 digitos', () => {
        expect(isValidCard('12341234123412341')).toBe(false);
    });
    it('Rechaza tarjeta con menos de 16 digitos', () => {
        expect(isValidCard('123412341234123')).toBe(false);
    });
    it('Rechaza número que no es texto', () => {
        expect(isValidCard(1234123412341234)).toBe(false);
    });
    it('Rechaza tarjeta que viene con espacios', () => {
        expect(isValidCard('1234 1234 1234 1234')).toBe(false);
    });
});

describe('isValidExpirationFormat', () => {
    it('Formato válido', () => {
        expect(isValidExpirationFormat('12/26')).toBe(true);
    });
    it('Rechaza con mes inválido', () => {
        expect(isValidExpirationFormat('13/26')).toBe(false);
    });
    it('Rechaza con año inválido', () => {
        expect(isValidExpirationFormat('10/2026')).toBe(false);
    });
    it('Rechaza con formato sin /', () => {
        expect(isValidExpirationFormat('1026')).toBe(false);
    });
    it('Rechaza con mes 00', () => {
        expect(isValidExpirationFormat('00/20')).toBe(false);
    });
});

describe('isExpired', () => {
    const now = new Date('2026-10-18T12:00:00.000Z');

    it('devuelve true si el año de la tarjeta ya pasó', () => {
        expect(isExpired('12/25', now)).toBe(true);
    });

    it('devuelve true si el mes de la tarjeta ya pasó este año', () => {
        expect(isExpired('09/26', now)).toBe(true);
    });

    it('devuelve false si la tarjeta vence este mes', () => {
        expect(isExpired('10/26', now)).toBe(false);
    });

    it('devuelve false si la tarjeta vence en un mes posterior de este año', () => {
        expect(isExpired('12/26', now)).toBe(false);
    });

    it('devuelve false si la tarjeta vence en un año futuro', () => {
        expect(isExpired('01/27', now)).toBe(false);
    });

    it('devuelve true si la tarjeta venció hace varios años', () => {
        expect(isExpired('01/20', now)).toBe(true);
    });

    it('devuelve false en el último segundo de diciembre de 2026 para 12/26', () => {
        const lastSecond = new Date('2026-12-31T23:59:59.000Z');

        expect(isExpired('12/26', lastSecond)).toBe(false);
    });

    it('devuelve true desde el 1 de enero de 2027 para 12/26', () => {
        const firstSecond = new Date('2027-01-01T00:00:00.000Z');

        expect(isExpired('12/26', firstSecond)).toBe(true);
    });
});

describe('isValidAmount', () => {
    it('acepta un monto entero', () => {
        expect(isValidAmount(1)).toBe(true);
    });

    it('acepta el monto mínimo de 0.01', () => {
        expect(isValidAmount(0.01)).toBe(true);
    });

    it('acepta el monto máximo de 100000', () => {
        expect(isValidAmount(100000)).toBe(true);
    });

    it('acepta un monto con un decimal', () => {
        expect(isValidAmount(150.5)).toBe(true);
    });

    it('acepta 19.99 aunque la computadora lo guarde de forma aproximada', () => {
        expect(isValidAmount(19.99)).toBe(true);
    });

    it('rechaza el cero', () => {
        expect(isValidAmount(0)).toBe(false);
    });

    it('rechaza un monto negativo', () => {
        expect(isValidAmount(-5)).toBe(false);
    });

    it('rechaza un monto con tres decimales', () => {
        expect(isValidAmount(10.123)).toBe(false);
    });

    it('rechaza un monto mayor que el máximo', () => {
        expect(isValidAmount(100000.01)).toBe(false);
    });

    it('rechaza NaN', () => {
        expect(isValidAmount(NaN)).toBe(false);
    });

    it('rechaza Infinity', () => {
        expect(isValidAmount(Infinity)).toBe(false);
    });

    it('rechaza un monto que viene como texto', () => {
        expect(isValidAmount('100')).toBe(false);
    });
});

describe('isValidFullName', () => {
    it('acepta un nombre con acento', () => {
        expect(isValidFullName('Ana Pérez')).toBe(true);
    });

    it('acepta guion, apóstrofo y espacios dentro del nombre', () => {
        expect(isValidFullName("María-José O'Brien")).toBe(true);
    });

    it('acepta un nombre con espacios en los extremos', () => {
        expect(isValidFullName('  Ana  ')).toBe(true);
    });

    it('acepta el largo mínimo de 3 letras', () => {
        expect(isValidFullName('Ana')).toBe(true);
    });

    it('acepta el largo máximo de 80 letras', () => {
        expect(isValidFullName('a'.repeat(80))).toBe(true);
    });

    it('rechaza un nombre de menos de 3 letras', () => {
        expect(isValidFullName('Jo')).toBe(false);
    });

    it('rechaza un nombre de más de 80 letras', () => {
        expect(isValidFullName('a'.repeat(81))).toBe(false);
    });

    it('rechaza un nombre que solo tiene espacios', () => {
        expect(isValidFullName('   ')).toBe(false);
    });

    it('rechaza un nombre con números', () => {
        expect(isValidFullName('Ana 123')).toBe(false);
    });

    it('rechaza un nombre que empieza con número', () => {
        expect(isValidFullName('1Ana')).toBe(false);
    });

    it('rechaza un nombre vacío', () => {
        expect(isValidFullName('')).toBe(false);
    });

    it('rechaza un nombre que no es texto', () => {
        expect(isValidFullName(5)).toBe(false);
    });
});

describe('isValidPayerId', () => {
    it('acepta un identificador con formato UUID', () => {
        expect(isValidPayerId('b7c1f1c2-3d4e-4f5a-9b6c-1a2b3c4d5e6f')).toBe(true);
    });

    it('acepta un identificador corto', () => {
        expect(isValidPayerId('user1')).toBe(true);
    });

    it('acepta el largo máximo de 100 caracteres', () => {
        expect(isValidPayerId('a'.repeat(100))).toBe(true);
    });

    it('rechaza un identificador vacío', () => {
        expect(isValidPayerId('')).toBe(false);
    });

    it('rechaza un identificador de más de 100 caracteres', () => {
        expect(isValidPayerId('a'.repeat(101))).toBe(false);
    });

    it('rechaza un identificador con espacios', () => {
        expect(isValidPayerId('user 1')).toBe(false);
    });

    it('rechaza un identificador con guión bajo', () => {
        expect(isValidPayerId('user_1')).toBe(false);
    });

    it('rechaza un identificador que no es texto', () => {
        expect(isValidPayerId(123)).toBe(false);
    });
});

describe('isValidPayerEmail', () => {
    it('acepta un correo normal', () => {
        expect(isValidPayerEmail('ana@example.com')).toBe(true);
    });

    it('acepta un correo con puntos, signo más y subdominio', () => {
        expect(isValidPayerEmail('ana.perez+test@mail.example.org')).toBe(true);
    });

    it('rechaza un correo sin arroba', () => {
        expect(isValidPayerEmail('ana.example.com')).toBe(false);
    });

    it('rechaza un correo sin punto en el dominio', () => {
        expect(isValidPayerEmail('ana@example')).toBe(false);
    });

    it('rechaza un correo con espacios', () => {
        expect(isValidPayerEmail('ana @example.com')).toBe(false);
    });

    it('rechaza un correo con dos arrobas', () => {
        expect(isValidPayerEmail('a@b@example.com')).toBe(false);
    });

    it('rechaza un correo de más de 254 caracteres', () => {
        expect(isValidPayerEmail('a'.repeat(250) + '@x.co')).toBe(false);
    });

    it('rechaza un correo vacío', () => {
        expect(isValidPayerEmail('')).toBe(false);
    });

    it('rechaza un correo que no es texto', () => {
        expect(isValidPayerEmail(42)).toBe(false);
    });
});
