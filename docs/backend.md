# Backend

## Responsabilidad

El backend es una API HTTP construida con Express 5 y TypeScript. En la aplicación actual ofrece un endpoint de salud y el endpoint de cobros ficticios de SnailPay. No administra cuentas de usuario, sesiones ni saldos.

## Estructura

| Ruta | Responsabilidad |
|---|---|
| `backend/src/server.ts` | Carga `dotenv`, lee el puerto e inicia Express. |
| `backend/src/app.ts` | Crea la aplicación, registra CORS, parser JSON, health check, rutas y middleware de errores. |
| `backend/src/routes/` | Define endpoints HTTP. |
| `backend/src/controllers/` | Convierte la solicitud HTTP en una llamada al servicio y escribe la respuesta. |
| `backend/src/services/` | Valida y calcula el resultado simulado de un cobro. |
| `backend/src/validators/` | Reglas de validación para los datos del cobro. |
| `backend/src/types/` | Tipos del contrato de SnailPay y configuración. |
| `backend/tests/` | Pruebas de rutas, servicios, configuración, errores y validadores. |

## API

### `GET /api/health`

Responde `200` con:

```json
{ "status": "ok" }
```

### `POST /api/snailpay/charges`

Recibe `application/json` con los campos `card_number`, `expiration_date`, `cvv`, `full_name`, `amount`, `payer_id` y `payer_email`. El parser JSON limita el body a 10 KB. Las reglas de campos, las respuestas y las tarjetas ficticias están descritas en el [contrato de SnailPay](snailpay.md).

Los cobros aprobados devuelven `201`; los rechazos de validación o autorización, `400` o `422`; el servicio no disponible, `503`; y el timeout simulado, `504`. El middleware de errores convierte JSON mal formado o cuerpos demasiado grandes en `400 invalid_request`, y errores inesperados en `503 service_unavailable`, con el mismo formato de respuesta que SnailPay.

## Configuración

Crear `backend/.env` a partir de `backend/.env.example`:

| Variable | Uso | Valor por defecto |
|---|---|---|
| `PORT` | Puerto HTTP del servidor. | `3001` |
| `CORS_ORIGIN` | Origen permitido por CORS. | `http://localhost:5173` |
| `SNAILPAY_FORCE_DOWN` | Si vale `true`, toda solicitud de cobro devuelve servicio no disponible. | `false` |
| `SNAILPAY_TIMEOUT_DELAY_MS` | Espera de la tarjeta de timeout. Un valor no numérico o negativo vuelve al valor por defecto. | `6000` |

`SNAILPAY_FORCE_DOWN` y el retraso se leen al iniciar el backend; reiniciar el proceso después de cambiar el archivo `.env`.

## Desarrollo y pruebas

Ejecutar desde la raíz del monorepo:

```sh
npm run dev:backend
npm run test:backend
npm run typecheck
```

También se puede iniciar ambos proyectos con `npm run dev`. El backend requiere Node.js 20.19 o superior. Los scripts específicos del workspace están en `backend/package.json`.

## Consideraciones

- SnailPay solo simula respuestas: no se conecta a un proveedor de pagos.
- El contrato de respuesta refleja los datos de tarjeta suministrados para facilitar la simulación. Usar exclusivamente datos ficticios.
- El backend no mantiene estado de usuario ni persiste transacciones o saldos.