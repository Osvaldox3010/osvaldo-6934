import { Router } from "express";
import type { SnailPayConfig } from "../types/snailpay";
import { createChargeController } from "../controllers/snailpay.controller";

// Registra las rutas de la API de SnailPay.
export function createSnailRouter(config: SnailPayConfig): Router {

    const router = Router();

    router.post('/charges', createChargeController(config));

    return router;
}