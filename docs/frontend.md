# Frontend

## Responsabilidad y stack

La interfaz es una SPA React 19 y TypeScript, servida y compilada con Vite. React Router gestiona las rutas; Recharts presenta las estadísticas simuladas. El cliente solo necesita contactar al backend para procesar una recarga de prueba.

## Estructura

| Ruta | Responsabilidad |
|---|---|
| `frontend/src/main.tsx` | Punto de entrada React, estilos base y elemento raíz. |
| `frontend/src/App.tsx` | Proveedores de autenticación y configuración de rutas. |
| `frontend/src/components/` | Vistas de registro, login, guardias de ruta, dashboard, formularios y gráficas. |
| `frontend/src/pages/DahsboardPage.tsx` | Composición del dashboard. El nombre del archivo está escrito así en el proyecto. |
| `frontend/src/hooks/` | Estado compartido de autenticación y flujo de recargas. |
| `frontend/src/services/` | Persistencia, autenticación, cálculo de saldo, estadísticas y cliente HTTP de SnailPay. |
| `frontend/src/validators/` | Validación de registro, datos recuperados de almacenamiento y formulario de recarga. |
| `frontend/src/types/` | Tipos de cuenta, dashboard y contrato SnailPay. |
| `frontend/src/mocks/simulatedDay.ts` | Datos estáticos de caracoles, carreras y apuestas. |
| `frontend/tests/` | Pruebas Vitest y Testing Library. |

## Rutas y acceso

| Ruta | Acceso | Comportamiento |
|---|---|---|
| `/` | Sesión activa | Dashboard; sin sesión redirige a `/register`. |
| `/login` | Invitado | Formulario de inicio de sesión; una sesión activa se redirige al dashboard. |
| `/register` | Invitado | Formulario de registro; una sesión activa se redirige al dashboard. |
| Cualquier otra ruta | Cualquiera | Redirige a `/`. |

`AuthProvider` inicializa el usuario leyendo la sesión y el perfil del almacenamiento local. `ProtectedRoute` protege el dashboard y `GuestRoute` limita acceso a las páginas de autenticación cuando ya hay usuario conectado.

## Autenticación y almacenamiento

El registro y el inicio de sesión son locales al navegador: no existe endpoint de autenticación. Se permite un perfil local, el correo se normaliza a minúsculas y se valida la contraseña con un hash Argon2id generado en el cliente. La sesión no tiene vencimiento implementado; cerrar sesión elimina la clave de sesión.

Se usan estas claves de `localStorage`:

| Clave | Contenido |
|---|---|
| `snailRace.user` | Perfil, hash de contraseña, saldo, identificadores de cobros aplicados y último pago. |
| `snailRace.session` | Identificador del usuario y fecha de inicio de sesión. |
| `snailRace.balance` | Saldo duplicado usado como compatibilidad/migración de perfiles anteriores. |

La lectura normaliza perfiles anteriores que no incluyan saldo o historial de cobros. Los errores de acceso a almacenamiento no se consideran una sesión válida.

> **Advertencia:** los datos de navegador no son una frontera de seguridad. El perfil de demostración conserva en `lastPayment` el número de tarjeta y el CVV del último cobro aprobado. No uses información personal o financiera real, no despliegues este modelo en producción y limpia el almacenamiento local si pruebas con datos sensibles.

## Dashboard y recargas

El dashboard calcula las victorias por caracol y el resumen de apuestas usando `simulatedDay.ts`; no son datos recibidos del backend ni actividad persistente. Los importes se formatean como pesos mexicanos.

El formulario de recarga:

1. Valida formato y monto localmente.
2. Construye un `ChargeRequest` con el usuario activo como pagador.
3. Envía `POST ${VITE_API_URL}/api/snailpay/charges`.
4. Normaliza la respuesta y traduce `status_detail` a un mensaje para el usuario.
5. Solo acredita una respuesta `approved` cuyo importe coincide con el solicitado.
6. Evita aplicar más de una vez el mismo ID de cobro guardando los IDs aplicados en el perfil.

La llamada HTTP aborta a los 4 segundos por defecto. El caso de timeout del backend espera 6 segundos por defecto, por lo que el frontend puede mostrar su timeout de cliente antes de recibir el `504` simulado. Más respuestas y datos de prueba están en el [contrato SnailPay](snailpay.md).

## Configuración y comandos

Crear `frontend/.env` a partir de `frontend/.env.example`:

| Variable | Uso | Valor por defecto |
|---|---|---|
| `VITE_API_URL` | URL base del backend; Vite expone esta variable al cliente. | `http://localhost:3001` |

Desde la raíz del monorepo:

```sh
npm run dev:frontend
npm run test:frontend
npm run typecheck
npm run build
```

Vite sirve la interfaz en `http://localhost:5173` durante el desarrollo. Para levantar frontend y backend juntos, ejecutar `npm run dev`.

## Pruebas

Vitest ejecuta las pruebas configuradas en `frontend/vite.config.ts` con entorno `jsdom`. Testing Library cubre interacciones de interfaz; también hay pruebas unitarias del saldo, validadores, cliente SnailPay y mensajes de error.
