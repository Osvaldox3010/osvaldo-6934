# Aplicación web full-stack con React, Express y TypeScript

Aplicación web full-stack con React, Express y TypeScript: autenticación local, dashboard con gráficas y pasarela de pagos simulada.

## Stack

- Frontend: React, TypeScript, Vite, Recharts, React Router.
- Backend: Express, TypeScript.
- Pruebas: Vitest en ambos proyectos, con Supertest en el backend y Testing Library en el frontend.
- Persistencia del cliente: LocalStorage.

## Estructura

```
backend/    API Express
frontend/   Aplicación React
```

Es un monorepo con npm workspaces. Las dependencias se instalan una sola vez desde la raíz, y cada carpeta conserva su propio `package.json` y `tsconfig.json`.

## Requisitos

- Node.js 20.19 o superior.
- npm.

## Ejecución

Desde la raíz del proyecto:

```
npm install
```

Crear los archivos de entorno a partir de los ejemplos.

Windows:

```
copy backend\.env.example backend\.env
copy frontend\.env.example frontend\.env
```

macOS y Linux:

```
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Iniciar frontend y backend a la vez:

```
npm run dev
```

El backend queda en `http://localhost:3001` y el frontend en `http://localhost:5173`.

Para iniciar cada uno por separado:

```
npm run dev:backend
npm run dev:frontend
```

## SnailPay

La API de pagos es una pasarela simulada; consulta el [contrato de SnailPay](docs/snailpay.md) para ver sus solicitudes, respuestas y escenarios de prueba.

## Scripts

Todos se ejecutan desde la raíz.

| Comando | Descripción |
|---|---|
| `npm run dev` | Inicia backend y frontend a la vez |
| `npm run dev:backend` | Inicia solo el backend |
| `npm run dev:frontend` | Inicia solo el frontend |
| `npm test` | Ejecuta las pruebas de ambos proyectos |
| `npm run test:backend` | Ejecuta las pruebas del backend |
| `npm run test:frontend` | Ejecuta las pruebas del frontend |
| `npm run typecheck` | Verifica los tipos de ambos proyectos |
| `npm run build` | Compila ambos proyectos |

## Variables de entorno

Backend (`backend/.env`):

| Variable | Descripción | Valor por defecto |
|---|---|---|
| `PORT` | Puerto del servidor | `3001` |
| `CORS_ORIGIN` | Origen permitido para el frontend | `http://localhost:5173` |
| `SNAILPAY_FORCE_DOWN` | Si es `true`, simula la caída del servicio de pagos y todas las solicitudes responden 503 | `false` |
| `SNAILPAY_TIMEOUT_DELAY_MS` | Retraso de la respuesta para la tarjeta de prueba de timeout, en milisegundos | `6000` |

Frontend (`frontend/.env`):

| Variable | Descripción | Valor por defecto |
|---|---|---|
| `VITE_API_URL` | URL base del backend | `http://localhost:3001` |
