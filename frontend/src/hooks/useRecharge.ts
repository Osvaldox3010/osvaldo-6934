import { useCallback, useRef, useState } from 'react';
import type { ChargeResponse, RechargeResult } from '../types/snailpay';
import { BALANCE_SAVE_ERROR_MESSAGE, DUPLICATE_CHARGE_MESSAGE } from '../services/rechargeMessages';
import { chargeCard, toChargeRequest } from '../services/snailpayClient';
import type { RechargeFormErrors, RechargeFormValues } from '../validators/recharge.validator';
import { validateRechargeForm } from '../validators/recharge.validator';

type RechargeUser = {
    id: string;
    email: string;
};

type CreditBalance = (response: ChargeResponse) => number | null;
type RechargeStatus = 'idle' | 'submitting';

type UseRechargeResult = {
    status: RechargeStatus;
    errors: RechargeFormErrors;
    result: RechargeResult | null;
    newBalance: number | null;
    submit: (values: RechargeFormValues) => Promise<void>;
};

export function useRecharge(user: RechargeUser, creditBalance: CreditBalance): UseRechargeResult {
    const [status, setStatus] = useState<RechargeStatus>('idle');
    const [errors, setErrors] = useState<RechargeFormErrors>({});
    const [result, setResult] = useState<RechargeResult | null>(null);
    const [newBalance, setNewBalance] = useState<number | null>(null);
    const isSubmitting = useRef(false);

    const submit = useCallback(async (values: RechargeFormValues) => {
        if (isSubmitting.current) {
            return;
        }

        const validationErrors = validateRechargeForm(values);
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            setResult(null);
            setNewBalance(null);
            return;
        }

        isSubmitting.current = true;
        setStatus('submitting');
        setErrors({});
        setResult(null);
        setNewBalance(null);

        try {
            const request = toChargeRequest(values, user);
            const chargeResult = await chargeCard(request);

            if (chargeResult.kind !== 'approved') {
                setResult(chargeResult);
                return;
            }

            let balance: number | null;
            try {
                balance = creditBalance(chargeResult.response);
            } catch {
                setResult({ kind: 'unavailable', message: BALANCE_SAVE_ERROR_MESSAGE });
                return;
            }

            if (balance === null) {
                setResult({ kind: 'unavailable', message: DUPLICATE_CHARGE_MESSAGE });
                return;
            }

            setResult(chargeResult);
            setNewBalance(balance);
        } finally {
            isSubmitting.current = false;
            setStatus('idle');
        }
    }, [creditBalance, user]);

    return { status, errors, result, newBalance, submit };
}
