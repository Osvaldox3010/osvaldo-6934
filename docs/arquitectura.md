# Arquitectura y diagramas

## Vista general

El repositorio es un monorepo npm con dos aplicaciones TypeScript independientes. Vite sirve el frontend React durante el desarrollo y el backend Express expone la API local de SnailPay. El frontend consume esa API únicamente para simular recargas; el registro, el inicio de sesión, el saldo y los datos de dashboard no se guardan en el backend.

```mermaid
flowchart LR
    Browser["Navegador<br/>React + React Router"]
    Local["LocalStorage<br/>perfil, sesión y saldo"]
    API["API Express<br/>/api/health<br/>/api/snailpay/charges"]
    Payment["Servicio SnailPay simulado"]
    Mock["Datos estáticos de carreras y apuestas"]

    Browser <--> Local
    Browser -->|"POST JSON"| API
    API --> Payment
    Payment -->|"resultado simulado"| API
    API -->|"JSON + HTTP status"| Browser
    Mock --> Browser
```

## Flujo de una recarga

El cliente valida el formulario antes de realizar la llamada. Solo acredita el saldo si la respuesta cumple el contrato de aprobación y su monto coincide con el solicitado. Los identificadores de cobro ya aplicados se conservan para evitar volver a acreditar la misma respuesta.

```mermaid
sequenceDiagram
    actor Usuario
    participant Formulario as Formulario React
    participant Hook as useRecharge
    participant Cliente as snailpayClient
    participant API as API Express
    participant Servicio as Servicio SnailPay
    participant Storage as LocalStorage

    Usuario->>Formulario: Envía monto y datos ficticios
    Formulario->>Hook: submit(valores)
    Hook->>Hook: Valida datos
    alt Formulario inválido
        Hook-->>Formulario: Errores por campo
    else Formulario válido
        Hook->>Cliente: Crea ChargeRequest
        Cliente->>API: POST /api/snailpay/charges
        API->>Servicio: Valida y simula el resultado
        Servicio-->>API: Resultado de cobro
        API-->>Cliente: Status HTTP y ChargeResponse
        Cliente-->>Hook: Resultado normalizado
        alt Aprobado y monto coincide
            Hook->>Storage: Guarda saldo y charge id
            Storage-->>Hook: Saldo actualizado
            Hook-->>Formulario: Confirmación y nuevo saldo
        else Rechazo, error o timeout
            Hook-->>Formulario: Muestra error y conserva el saldo
        end
    end
```

## Decisión de SnailPay

La API valida primero la disponibilidad global configurada, el cuerpo JSON y los campos requeridos. Después evalúa las tarjetas de escenario en orden: servicio no disponible, timeout, rechazo, fondos insuficientes, aprobación de prueba y, por defecto, tarjeta no autorizada. La primera condición aplicable determina el resultado.

```mermaid
flowchart TD
    Start["POST /api/snailpay/charges"] --> Down{"SNAILPAY_FORCE_DOWN"}
    Down -->|"Sí"| Unavailable["503 service_unavailable"]
    Down -->|"No"| Body{"¿Body es un objeto válido?"}
    Body -->|"No"| InvalidRequest["400 invalid_request"]
    Body -->|"Sí"| Validation["Validar pagador, nombre, monto y tarjeta"]
    Validation --> Valid{"¿Datos válidos?"}
    Valid -->|"No"| Rejected["422 con el primer error"]
    Valid -->|"Sí"| Card{"¿Tarjeta de escenario?"}
    Card -->|"0000…: servicio caído"| Unavailable
    Card -->|"9999…: timeout"| Timeout["504 gateway_timeout"]
    Card -->|"1111…: rechazada"| Declined["422 card_declined"]
    Card -->|"2222…: fondos insuficientes"| Funds["422 insufficient_funds"]
    Card -->|"Tarjeta y fecha/CVV exitosos"| Approved["201 approved"]
    Card -->|"Otro conjunto de datos"| NotAuthorized["422 card_not_authorized"]
```

## Límites y persistencia

- No hay base de datos ni API de autenticación: el navegador conserva cuenta, sesión y saldo.
- Las estadísticas del dashboard se calculan a partir del fixture local `simulatedDay`.
- Solo la operación de cobro se comunica con el backend.
- SnailPay es un simulador para datos de prueba, no una integración con una entidad financiera.
