import { randomUUID } from 'node:crypto';
import { StatusDetail, ServiceResult, ChargeStatus, SnailPayConfig, CARD_SYSTEM_DOWN, CARD_DECLINED, CARD_TIMEOUT, CARD_INSUFFICIENT_FUNDS, SUCCESS_CARD } from '../types/snailpay';
import * as validator from '../validators/charge.validator';

// Conserva solo los valores que ya son texto.
export function toTextOrNull(value: unknown): string | null {
    return typeof value === 'string' ? value : null;
}

// Conserva solo los números válidos.
export function toNumberOrNull(value: unknown): number | null {
    return ( typeof value === 'number' && Number.isFinite(value) ) ? value : null;
}

// Genera la referencia de la operación a partir de su identificador.
export function buildReference(id: string): string {
    return 'SP-' + id.slice(0, 8).toUpperCase();
}

// Genera el código que se devuelve cuando el cobro se aprueba.
export function generateAuthorizationCode(): string {
    return randomUUID().replace(/-/g, '').slice(0, 6).toUpperCase();
}

// Comprueba que el body sea un objeto y no un arreglo.
export function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

const OUTCOMES: Record<StatusDetail, {httpStatus: ServiceResult['httpStatus']; status: ChargeStatus }> = {
    accredited: {httpStatus: 201, status: 'approved'},
    invalid_request: {httpStatus: 400, status: 'rejected'},
    invalid_payer: {httpStatus: 422, status: 'rejected'},
    invalid_full_name: {httpStatus: 422, status: 'rejected'},
    invalid_amount: {httpStatus: 422, status: 'rejected'},
    invalid_card_number: {httpStatus: 422, status: 'rejected'},
    invalid_expiration_date: {httpStatus: 422, status: 'rejected'},
    card_expired: {httpStatus: 422, status: 'rejected'},
    invalid_cvv: {httpStatus: 422, status: 'rejected'},
    card_declined: {httpStatus: 422, status: 'rejected'},
    insufficient_funds: {httpStatus: 422, status: 'rejected'},
    card_not_authorized: {httpStatus: 422, status: 'rejected'},
    service_unavailable: {httpStatus: 503, status: 'error'},
    gateway_timeout: {httpStatus: 504, status: 'error'}
};

// Construye y devuelve la respuesta con el estado correspondiente.
export function buildResult(
    body: unknown,
    now: Date,
    detail: StatusDetail,
    authorizationCode: string | null = null,
) : ServiceResult {
    const id = randomUUID();
    const isApproved = OUTCOMES[detail].status === 'approved';
    const data: Record<string, unknown> = isRecord(body) ? body : {};

    return {
        httpStatus: OUTCOMES[detail].httpStatus,
        body: {
            id: id,
            status: OUTCOMES[detail].status,
            status_detail: detail,
            transaction_amount: toNumberOrNull(data.amount),
            date_created: now.toISOString(),
            authorization_code: isApproved ? authorizationCode: null,
            reference: buildReference(id),
            payer_id: toTextOrNull(data.payer_id),
            payer_email: toTextOrNull(data.payer_email),
            card_number: toTextOrNull(data.card_number),
            cvv: toTextOrNull(data.cvv)
        },
    };
}

// Devuelve el primer error de validación encontrado.
export function findValidationError(data: Record<string, unknown>, now: Date): StatusDetail | null {
    
    if (!validator.isValidPayerId(data.payer_id) || !validator.isValidPayerEmail(data.payer_email)) {
        return 'invalid_payer';
    }

    if (!validator.isValidFullName(data.full_name)) {
        return 'invalid_full_name';
    }

    if (!validator.isValidAmount(data.amount)) {
        return 'invalid_amount';
    }

    if (!validator.isValidCard(data.card_number)) {
        return 'invalid_card_number';
    }

    if (!validator.isValidExpirationFormat(data.expiration_date)) {
        return 'invalid_expiration_date';
    }

    if (validator.isExpired(data.expiration_date as string, now)) {
        return 'card_expired';
    }
    
    if (!validator.isValidCvv(data.cvv)) {
        return 'invalid_cvv';
    }

    return null;
}

// Espera el tiempo configurado antes de responder al caso de timeout.
function wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// Valida los datos y determina el resultado del cobro simulado.
export async function processCharge(
    body: unknown,
    config: SnailPayConfig,
    now: Date,
): Promise<ServiceResult> {
    if (config.forceDown) {
        return buildResult(body, now, 'service_unavailable');
    }

    if (!isRecord(body)) {
        return buildResult(body, now, 'invalid_request');
    }

    const validationError = findValidationError(body, now);

    if (validationError !== null) {
        return buildResult(body, now, validationError);
    }

    if (body.card_number === CARD_SYSTEM_DOWN) {
        return buildResult(body, now, 'service_unavailable');
    }

    if (body.card_number === CARD_TIMEOUT) {
        await wait(config.timeoutDelayMs);

        return buildResult(body, now, 'gateway_timeout');
    }

    if (body.card_number === CARD_DECLINED) {
        return buildResult(body, now, 'card_declined');
    }

    if (body.card_number === CARD_INSUFFICIENT_FUNDS) {
        return buildResult(body, now, 'insufficient_funds');
    }

    if (body.card_number != SUCCESS_CARD.card_number 
        || body.expiration_date != SUCCESS_CARD.expiration_date
        || body.cvv != SUCCESS_CARD.cvv ){
            return buildResult(body, now, 'card_not_authorized');
    }

    return buildResult(body, now, 'accredited', generateAuthorizationCode());
};