import type { Request, Response } from 'express';
import type { SnailPayConfig } from '../types/snailpay';
import { processCharge } from '../services/snailpay.service';

// Procesa el cobro y devuelve el resultado con su código HTTP.
export function createChargeController(config: SnailPayConfig) {

    return async (request: Request, response: Response) => {
        const result = await processCharge(request.body, config, new Date());

        return response.status(result.httpStatus).json(result.body)
    }; 

};
