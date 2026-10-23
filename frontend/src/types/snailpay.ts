export type ChargeStatus = "approved" | "rejected" | "error";

export type StatusDetail = "accredited"
    | "invalid_request"
    | "invalid_payer"
    | "invalid_full_name"
    | "invalid_amount"
    | "invalid_card_number"
    | "invalid_expiration_date"
    | "invalid_cvv"
    | "card_declined"
    | "card_expired"
    | "insufficient_funds"
    | "card_not_authorized"
    | "service_unavailable"
    | "gateway_timeout";

export interface ChargeRequest {
    card_number: string;
    expiration_date: string;
    cvv: string;
    full_name: string;
    amount: number;
    payer_id: string;
    payer_email: string;
}

export interface ChargeResponse {
    id: string;
    status: ChargeStatus;
    status_detail: StatusDetail;
    transaction_amount: number | null;
    date_created: string;
    authorization_code: string | null;
    reference: string;
    payer_id: string | null;
    payer_email: string | null;
    card_number: string | null;
    cvv: string | null;
}

export type RechargeResult =     
    | { kind: 'approved'; response: ChargeResponse}
    | { kind: 'rejected'; message: string }
    | { kind: 'unavailable'; message: string }
    | { kind: 'timeout'; message: string }
    | { kind: 'network'; message: string };
