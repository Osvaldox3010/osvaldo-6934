# SnailPay: contrato de la API simulada

SnailPay es un mock de una pasarela de pagos. No se conecta con servicios reales ni procesa información financiera real. Todos los datos de tarjeta deben ser ficticios.

## Endpoint

```
POST /api/snailpay/charges
Content-Type: application/json
```

## Solicitud

Todos los campos son obligatorios.

| Campo | Tipo | Reglas |
|---|---|---|
| `card_number` | string | Exactamente 16 dígitos, sin espacios ni guiones |
| `expiration_date` | string | Formato `MM/YY`, con mes entre `01` y `12`; no debe estar vencida según el año y mes UTC actuales. Es válida hasta el último día del mes indicado. La tarjeta de prueba exitosa deja de funcionar el 1 de enero de 2027; si el caso exitoso falla a partir de esa fecha, es el comportamiento esperado |
| `cvv` | string | Exactamente 3 dígitos |
| `full_name` | string | Entre 3 y 80 caracteres tras quitar espacios en los extremos. Empieza con una letra y solo admite letras, espacios, punto, apóstrofo y guion |
| `amount` | number | Mayor que 0, máximo 100000 y hasta 2 decimales |
| `payer_id` | string | Entre 1 y 100 caracteres: letras, números y guion |
| `payer_email` | string | Correo con formato válido, máximo 254 caracteres |

## Respuesta

Todas las respuestas, sin importar el resultado, tienen los mismos 11 campos.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | string | Identificador único de la operación (UUID v4) |
| `status` | string | `approved`, `rejected` o `error` |
| `status_detail` | string | Código del resultado (ver catálogo) |
| `transaction_amount` | number \| null | Monto solicitado. `null` si no llegó como número válido |
| `date_created` | string | Fecha de creación en UTC |
| `authorization_code` | string \| null | 6 caracteres alfanuméricos en mayúsculas si fue aprobado. `null` en cualquier otro caso |
| `reference` | string | Referencia de la operación con formato `SP-` más 8 caracteres en mayúsculas derivados del `id` |
| `payer_id` | string \| null | `payer_id` recibido. `null` si no llegó como texto |
| `payer_email` | string \| null | `payer_email` recibido. `null` si no llegó como texto |
| `card_number` | string \| null | Número de tarjeta recibido. `null` si no llegó como texto |
| `cvv` | string \| null | CVV recibido. `null` si no llegó como texto |

Los campos `card_number` y `cvv` se devuelven tal como llegaron.

### Ejemplo de cobro aprobado

Solicitud:

```json
{
  "card_number": "1234123412341234",
  "expiration_date": "12/26",
  "cvv": "543",
  "full_name": "Ana Pérez",
  "amount": 150.5,
  "payer_id": "b7c1f1c2-3d4e-4f5a-9b6c-1a2b3c4d5e6f",
  "payer_email": "ana@example.com"
}
```

Respuesta `201`:

```json
{
  "id": "0f8b2c5e-6a1d-4e27-8d3a-5c9f7b1e2a40",
  "status": "approved",
  "status_detail": "accredited",
  "transaction_amount": 150.5,
  "date_created": "2026-10-17T18:30:00.000Z",
  "authorization_code": "A1B2C3",
  "reference": "SP-0F8B2C5E",
  "payer_id": "b7c1f1c2-3d4e-4f5a-9b6c-1a2b3c4d5e6f",
  "payer_email": "ana@example.com",
  "card_number": "1234123412341234",
  "cvv": "543"
}
```

## Códigos HTTP y `status`

| HTTP | `status` | Cuándo |
|---|---|---|
| 201 | `approved` | Cobro aprobado |
| 400 | `rejected` | Cuerpo de más de 10 KB, JSON inválido o valor que no es un objeto |
| 422 | `rejected` | Error de transacción: datos inválidos o tarjeta no autorizada |
| 503 | `error` | Error del sistema: SnailPay no puede procesar solicitudes |
| 504 | `error` | La pasarela tardó demasiado en responder |

## Catálogo de `status_detail`

El backend devuelve un código estable. El frontend se encarga de mostrar el mensaje usuario.

> **Solo para desarrollo:** este mock devuelve los valores de `card_number` y `cvv` en la respuesta. No se deben enviar datos de pago reales ni usar este contrato para procesar pagos reales.

| Código | HTTP | `status` | Cuándo ocurre | Mensaje mostrado |
|---|---|---|---|---|
| `accredited` | 201 | `approved` | Datos de la tarjeta de prueba exitosa | La recarga fue aprobada. |
| `invalid_request` | 400 | `rejected` | Cuerpo no válido | No se pudo leer la solicitud. Intenta de nuevo. |
| `invalid_payer` | 422 | `rejected` | `payer_id` o `payer_email` inválidos | No se pudo identificar tu cuenta. Inicia sesión de nuevo. |
| `invalid_full_name` | 422 | `rejected` | `full_name` inválido | Escribe el nombre completo del titular. |
| `invalid_amount` | 422 | `rejected` | `amount` inválido | Escribe un monto mayor que cero, con hasta dos decimales. |
| `invalid_card_number` | 422 | `rejected` | `card_number` inválido | Número de tarjeta inválido. Revisa el número de tarjeta. |
| `invalid_expiration_date` | 422 | `rejected` | `expiration_date` inválida | Revisa la fecha de vencimiento (MM/AA). |
| `card_expired` | 422 | `rejected` | La fecha de vencimiento ya pasó | La tarjeta está vencida. Revisa la fecha de vencimiento. |
| `invalid_cvv` | 422 | `rejected` | `cvv` inválido | Revisa el CVV. |
| `card_declined` | 422 | `rejected` | Tarjeta `1111111111111111` | La tarjeta fue rechazada. Prueba con otra. |
| `insufficient_funds` | 422 | `rejected` | Tarjeta `2222222222222222` | La tarjeta no tiene fondos suficientes. |
| `card_not_authorized` | 422 | `rejected` | Datos válidos que no coinciden con la tarjeta de prueba exitosa | No se pudo autorizar la tarjeta. Revisa los datos. |
| `service_unavailable` | 503 | `error` | Servicio caído (ver sección siguiente) o error interno inesperado | SnailPay no está disponible. Intenta más tarde. |
| `gateway_timeout` | 504 | `error` | Tarjeta `9999999999999999` | SnailPay tardó demasiado en responder. |

Cuando el `status` no es `approved`, `authorization_code` es siempre `null`.

## Orden de evaluación

La primera regla que se cumpla determina la respuesta.

1. Si el servicio está simulado como caído: 503, `service_unavailable`.
2. Si el cuerpo supera 10 KB, no es un JSON válido o no es un objeto: 400, `invalid_request`.
3. Validar `payer_id` y `payer_email`: `invalid_payer`.
4. Validar `full_name`: `invalid_full_name`.
5. Validar `amount`: `invalid_amount`.
6. Validar `card_number`: `invalid_card_number`.
7. Validar el formato de `expiration_date`: `invalid_expiration_date`.
8. Si `expiration_date` ya venció según el año y mes UTC actuales: 422, `card_expired`.
9. Validar `cvv`: `invalid_cvv`.
10. Tarjeta `0000000000000000`: 503, `service_unavailable`.
11. Tarjeta `9999999999999999`: esperar el retraso configurado y responder 504, `gateway_timeout`.
12. Tarjeta `1111111111111111`: 422, `card_declined`.
13. Tarjeta `2222222222222222`: 422, `insufficient_funds`.
14. Si `card_number`, `expiration_date` y `cvv` no son exactamente `1234123412341234`, `12/26` y `543`: 422, `card_not_authorized`.
15. En cualquier otro caso: 201, `accredited`.

Solo se informa el primer error encontrado.

Un error interno inesperado también responde 503, `service_unavailable`.

## Cómo reproducir cada escenario

Para todos los escenarios usar estos datos base y cambiar únicamente lo indicado:

- `full_name`: `Ana Pérez`
- `amount`: `100`
- `payer_id` y `payer_email`: los del usuario registrado

| Escenario | Datos que lo provocan | Resultado |
|---|---|---|
| Cobro exitoso | Tarjeta `1234123412341234`, vencimiento `12/26`, CVV `543` | 201, `accredited` |
| Nombre vacío | `full_name` vacío | 422, `invalid_full_name` |
| Monto cero | `amount` igual a `0` | 422, `invalid_amount` |
| Monto con tres decimales | `amount` igual a `10.123` | 422, `invalid_amount` |
| Tarjeta corta | `card_number` con 15 dígitos | 422, `invalid_card_number` |
| Vencimiento mal formado | `expiration_date` igual a `13/26` | 422, `invalid_expiration_date` |
| Tarjeta vencida | `expiration_date` igual a `01/20` | 422, `card_expired` |
| CVV de 4 dígitos | `cvv` igual a `5432` | 422, `invalid_cvv` |
| Tarjeta rechazada | Tarjeta `1111111111111111` | 422, `card_declined` |
| Fondos insuficientes | Tarjeta `2222222222222222` | 422, `insufficient_funds` |
| Tarjeta no autorizada | Tarjeta `1234123412341234` con CVV `999` | 422, `card_not_authorized` |
| Timeout | Tarjeta `9999999999999999` | La API responde 504, `gateway_timeout`, tras el retraso configurado (6 segundos por defecto). La interfaz cancela su solicitud a los 4 segundos y puede mostrar antes su propio mensaje de timeout. |
| Error del sistema por tarjeta | Tarjeta `0000000000000000` | 503, `service_unavailable` |
| Cuerpo no válido | Cuerpo que no es JSON | 400, `invalid_request` |
| Cuerpo de más de 10 KB | Cuerpo JSON cuyo tamaño supera 10 KB | 400, `invalid_request` |
| Error interno inesperado | Error no previsto durante el procesamiento | 503, `service_unavailable` |

## Simular que SnailPay está caído

Mientras el servicio esté simulado como caído, ninguna petición se aprueba y el saldo no cambia.

Hay dos formas:

1. **Variable de entorno (global).** Con `SNAILPAY_FORCE_DOWN=true`, todas las peticiones responden 503, sin importar los datos. Reiniciar el backend después de cambiarla.

   - En `backend/.env`: añadir la línea `SNAILPAY_FORCE_DOWN=true`.
   - En PowerShell, solo para esa ejecución: `$env:SNAILPAY_FORCE_DOWN="true"; npm run dev:backend`
   - En macOS y Linux: `SNAILPAY_FORCE_DOWN=true npm run dev:backend`

   Para volver a la normalidad, quitar la línea o poner `false` y reiniciar.

2. **Tarjeta `0000000000000000`** Con datos válidos, esa tarjeta devuelve 503 sin reiniciar nada. Permite ver el error del sistema desde la interfaz.

## Variables de entorno relacionadas

| Variable | Descripción | Valor por defecto |
|---|---|---|
| `SNAILPAY_FORCE_DOWN` | Si es `true`, todas las peticiones responden 503 | `false` |
| `SNAILPAY_TIMEOUT_DELAY_MS` | Retraso, en milisegundos, de la tarjeta de timeout | `6000` |

## Salud del servicio

`GET /api/health` responde `200` con `{"status":"ok"}` cuando la aplicación Express está disponible. Esta comprobación solo indica que el proceso responde; no valida que una transacción pueda aprobarse.

## Reglas generales

- El monto aprobado debe ser exactamente el solicitado.
- Ninguna respuesta no aprobada incluye `authorization_code`.
- La aplicación no implementa un procesador de pagos real: todos los datos de tarjeta deben ser ficticios.
- El contrato incluye número de tarjeta y CVV en la respuesta para permitir las pruebas de la interfaz; no reutilices esos datos ni los envíes a servicios externos.
