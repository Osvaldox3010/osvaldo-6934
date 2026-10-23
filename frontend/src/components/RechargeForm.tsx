import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import type { ChargeResponse } from '../types/snailpay';
import type { AuthUser } from '../types/auth';
import { useRecharge } from '../hooks/useRecharge';
import type { RechargeFormValues } from '../validators/recharge.validator';
import { formatCurrency } from '../services/dashboardStats';
import { TextField } from './TextField';
import '../styles/Modal.css';

type RechargeFormProps = {
    user: Pick<AuthUser, 'id' | 'fullName' | 'email' | 'balance'>;
    creditBalance: (response: ChargeResponse) => number | null;
};

const EMPTY_VALUES: RechargeFormValues = {
    cardNumber: '',
    expirationDate: '',
    cvv: '',
    fullName: '',
    amount: '',
};

export function RechargeForm({ user, creditBalance }: RechargeFormProps) {
    const [values, setValues] = useState<RechargeFormValues>({
        ...EMPTY_VALUES,
        fullName: user.fullName,
    });
    const { status, errors, result, newBalance, submit } = useRecharge(user, creditBalance);

    useEffect(() => {
        if (result?.kind === 'approved') {
            setValues((current) => ({
                ...current,
                cardNumber: '',
                expirationDate: '',
                cvv: '',
            }));
        }
    }, [result]);

    function updateField(field: keyof RechargeFormValues, value: string) {
        setValues((current) => ({ ...current, [field]: value }));
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        await submit(values);
    }

    const approvedMessage =
        result?.kind === 'approved' &&
        result.response.transaction_amount !== null &&
        newBalance !== null
        ? `La recarga de ${formatCurrency(result.response.transaction_amount)} fue aprobada. Tu nuevo saldo es ${formatCurrency(newBalance)}.`
        : null;

    return (
        <div className="recharge-form-container">
            <form className="recharge-form" onSubmit={handleSubmit} noValidate>
                <TextField
                    id="recharge-card-number"
                    name="cardNumber"
                    className="recharge-input"
                    label="Número de tarjeta:"
                    inputMode="numeric"
                    autoComplete="cc-number"
                    maxLength={23}
                    value={values.cardNumber}
                    error={errors.cardNumber}
                    onChange={(value) => updateField('cardNumber', value)}
                />
                <TextField
                    id="recharge-expiration-date"
                    name="expirationDate"
                    className="recharge-input"
                    label="Vencimiento (MM/AA):"
                    autoComplete="cc-exp"
                    maxLength={5}
                    value={values.expirationDate}
                    error={errors.expirationDate}
                    onChange={(value) => updateField('expirationDate', value)}
                />
                <TextField
                    id="recharge-cvv"
                    name="cvv"
                    className="recharge-input"
                    label="CVV:"
                    inputMode="numeric"
                    autoComplete="cc-csc"
                    maxLength={3}
                    value={values.cvv}
                    error={errors.cvv}
                    onChange={(value) => updateField('cvv', value)}
                />
                <TextField
                    id="recharge-full-name"
                    name="fullName"
                    className="recharge-input"
                    label="Nombre del titular:"
                    autoComplete="cc-name"
                    maxLength={80}
                    value={values.fullName}
                    error={errors.fullName}
                    onChange={(value) => updateField('fullName', value)}
                />
                <TextField
                    id="recharge-amount"
                    name="amount"
                    className="recharge-input"
                    label="Monto:"
                    inputMode="decimal"
                    value={values.amount}
                    error={errors.amount}
                    onChange={(value) => updateField('amount', value)}
                />
                <div className="recharge-submit-container">
                    <button className="recharge-submit" type="submit" disabled={status === 'submitting'}>
                        {status === 'submitting' ? 'Procesando...' : 'Enviar'}
                    </button>
                </div>
            </form>
            {approvedMessage !== null && <p role="status">{approvedMessage}</p>}
            {result !== null && result.kind !== 'approved' && <p role="alert">{result.message}</p>}
        </div>
    );
}
