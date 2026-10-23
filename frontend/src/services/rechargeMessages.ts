import type { StatusDetail } from "../types/snailpay";

export const STATUS_DETAIL_MESSAGES: Record<StatusDetail, string> = {
    accredited: 'La recarga fue aprobada.',
    invalid_request:	'No se pudo leer la solicitud. Intenta de nuevo.',
    invalid_payer:	'No se pudo identificar tu cuenta. Inicia sesión de nuevo.',
    invalid_full_name:	'Escribe el nombre completo del titular.',
    invalid_amount:	'Escribe un monto mayor que cero, con hasta dos decimales.',
    invalid_card_number:	'Revisa el número de tarjeta.',
    invalid_expiration_date:	'Revisa la fecha de vencimiento (MM/AA).',
    card_expired:	'La tarjeta está vencida.',
    invalid_cvv:	'Revisa el CVV.',
    card_declined:	'La tarjeta fue rechazada. Prueba con otra.',
    insufficient_funds:	'La tarjeta no tiene fondos suficientes.',
    card_not_authorized:	'No se pudo autorizar la tarjeta. Revisa los datos.',
    service_unavailable:	'SnailPay no está disponible. Intenta más tarde.',
    gateway_timeout:	'SnailPay tardó demasiado en responder.'
};

export const CLIENT_TIMEOUT_MESSAGE: string = 'SnailPay tardó demasiado en responder. Intenta de nuevo.';
export const NETWORK_ERROR_MESSAGE: string = 'No se pudo conectar con SnailPay. Revisa tu conexión e intenta de nuevo.';
export const GENERIC_REJECTION_MESSAGE: string = 'No se pudo completar la recarga.';
export const BALANCE_SAVE_ERROR_MESSAGE =
    'La recarga fue aprobada, pero no pudimos guardar tu saldo. Recarga la página e inténtalo de nuevo.';
export const DUPLICATE_CHARGE_MESSAGE =
    'La recarga ya se había aplicado y no se volvió a sumar al saldo.';
