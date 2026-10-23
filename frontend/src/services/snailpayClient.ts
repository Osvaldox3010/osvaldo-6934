import type { ChargeRequest, ChargeResponse, RechargeResult, StatusDetail } from "../types/snailpay";
import {
    CLIENT_TIMEOUT_MESSAGE,
    GENERIC_REJECTION_MESSAGE,
    NETWORK_ERROR_MESSAGE,
    STATUS_DETAIL_MESSAGES
} from "./rechargeMessages";
import { normalizeCardNumber } from "../validators/recharge.validator";
import type { RechargeFormValues } from "../validators/recharge.validator";

const SERVICE_UNAVAILABLE_MESSAGE = STATUS_DETAIL_MESSAGES.service_unavailable;

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isAbortError(error: unknown): boolean {
    return isRecord(error) && error.name === "AbortError";
}

function isStatusDetail(value: unknown): value is StatusDetail {
    return (
        typeof value === "string" &&
        Object.prototype.hasOwnProperty.call(STATUS_DETAIL_MESSAGES, value)
    );
}

function isNullableString(value: unknown): value is string | null {
    return value === null || typeof value === "string";
}

function isChargeResponse(value: Record<string, unknown>): value is Record<string, unknown> & ChargeResponse {
    return (
        typeof value.id === "string" &&
        value.id.length > 0 &&
        value.status === "approved" &&
        value.status_detail === "accredited" &&
        typeof value.transaction_amount === "number" &&
        Number.isFinite(value.transaction_amount) &&
        typeof value.date_created === "string" &&
        isNullableString(value.authorization_code) &&
        typeof value.reference === "string" &&
        isNullableString(value.payer_id) &&
        isNullableString(value.payer_email) &&
        isNullableString(value.card_number) &&
        isNullableString(value.cvv)
    );
}

export function toChargeRequest(values: RechargeFormValues, user: { id: string; email: string }): ChargeRequest {
    return {
        card_number: normalizeCardNumber(values.cardNumber),
        expiration_date: values.expirationDate,
        cvv: values.cvv,
        full_name: values.fullName.trim(),
        amount: Number(values.amount),
        payer_id: user.id,
        payer_email: user.email
    };
}

export function toRechargeResult(httpStatus: number, body: unknown, requestedAmount: number): RechargeResult {
    if (!isRecord(body) || !("status" in body) || !("status_detail" in body)) {
        return { kind: "unavailable", message: SERVICE_UNAVAILABLE_MESSAGE };
    }

    const status = body.status;
    const detail = body.status_detail;

    if (
        httpStatus === 201 &&
        isChargeResponse(body) &&
        body.transaction_amount === requestedAmount
    ) {
        return { kind: "approved", response: body };
    }

    if ((httpStatus === 400 || httpStatus === 422) && status === "rejected") {
        if (isStatusDetail(detail)) {
            return { kind: "rejected", message: STATUS_DETAIL_MESSAGES[detail] };
        }

        return { kind: "rejected", message: GENERIC_REJECTION_MESSAGE };
    }

    if (httpStatus === 503 && detail === "service_unavailable") {
        return { kind: "unavailable", message: STATUS_DETAIL_MESSAGES.service_unavailable };
    }

    if (httpStatus === 504 && detail === "gateway_timeout") {
        return { kind: "timeout", message: STATUS_DETAIL_MESSAGES.gateway_timeout };
    }

    return { kind: "unavailable", message: SERVICE_UNAVAILABLE_MESSAGE };
}

export async function chargeCard(
    request: ChargeRequest,
    options?: { timeoutMs?: number; baseUrl?: string }
): Promise<RechargeResult> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options?.timeoutMs ?? 4000);
    const baseUrl = options?.baseUrl ?? import.meta.env.VITE_API_URL ?? "http://localhost:3001";

    try {
        const response = await fetch(`${baseUrl.replace(/\/+$/, "")}/api/snailpay/charges`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(request),
            signal: controller.signal
        });

        let body: unknown;
        try {
            body = await response.json();
        } catch (error) {
            if (isAbortError(error)) {
                return { kind: "timeout", message: CLIENT_TIMEOUT_MESSAGE };
            }

            return { kind: "unavailable", message: SERVICE_UNAVAILABLE_MESSAGE };
        }

        return toRechargeResult(response.status, body, request.amount);
    } catch (error) {
        if (isAbortError(error)) {
            return { kind: "timeout", message: CLIENT_TIMEOUT_MESSAGE };
        }

        return { kind: "network", message: NETWORK_ERROR_MESSAGE };
    } finally {
        clearTimeout(timeout);
    }
}
