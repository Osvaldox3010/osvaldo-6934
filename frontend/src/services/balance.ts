import { ChargeResponse } from "../types/snailpay";

export type Account = {
    balance: number;
    appliedChargeIds: string[];
};

export function addMoney(current: number, amount: number): number {
    return Math.round((current + amount) * 100) / 100;
}

export function applyApprovedCharge(account: Account, response: ChargeResponse): Account {
    const amount = response.transaction_amount;
    if (
        response.status !== 'approved' ||
        response.status_detail !== 'accredited' ||
        amount === null ||
        !Number.isFinite(amount) ||
        amount <= 0 ||
        account.appliedChargeIds.includes(response.id)
    ) {
        return account;
    }

    return {
        ...account,
        balance: addMoney(account.balance, amount),
        appliedChargeIds: [...account.appliedChargeIds, response.id]
    };
}