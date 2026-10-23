import { isValidFullName } from './register.validator';

export interface RechargeFormValues {
    cardNumber: string;
    expirationDate: string;
    cvv: string;
    fullName: string;
    amount: string;
}

export type RechargeFormErrors = Partial<Record<keyof RechargeFormValues, string>>;

const MAX_AMOUNT = 100000;

export function normalizeCardNumber(value: string): string {
    return value.replace(/\s+/g, '');
}

function isValidAmountText(value: string): boolean {
    if (!/^\d+(\.\d{1,2})?$/.test(value)) {
        return false;
    }

    const amount = Number(value);

    return amount > 0 && amount <= MAX_AMOUNT;
}

export function validateRechargeForm(values: RechargeFormValues): RechargeFormErrors {
    const errors: RechargeFormErrors = {};

    if (!/^\d{16}$/.test(normalizeCardNumber(values.cardNumber))) {
        errors.cardNumber = 'Revisa el número de tarjeta.';
    }

    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(values.expirationDate)) {
        errors.expirationDate = 'Revisa la fecha de vencimiento (MM/AA).';
    }

    if (!/^\d{3}$/.test(values.cvv)) {
        errors.cvv = 'Revisa el CVV.';
    }

    if (!isValidFullName(values.fullName)) {
        errors.fullName = 'Escribe el nombre completo del titular.';
    }

    if (!isValidAmountText(values.amount)) {
        errors.amount = 'Escribe un monto mayor que cero, con hasta dos decimales.';
    }

    return errors;
}
