import type { NextFunction, Request, Response } from 'express';
import { buildResult } from '../services/snailpay.service';

// Obtiene el tipo de error cuando viene informado por Express.
export function getErrorType(err: unknown): string | null {
    if (typeof err === 'object' && err !== null && 'type' in err && typeof err.type === 'string') {
        return err.type;
    }

    return null;
}

// Devuelve una respuesta uniforme para errores del body y errores inesperados.
export function errorHandler(err: unknown, _request: Request, response: Response, _next: NextFunction): void {
    const errorType = getErrorType(err);
    const detail = errorType === 'entity.parse.failed' || errorType === 'entity.too.large' ? 'invalid_request': 'service_unavailable';
    const result = buildResult(undefined, new Date(), detail);

    response.status(result.httpStatus).json(result.body);
}