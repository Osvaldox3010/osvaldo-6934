# Aplicación web full-stack con React, Express y TypeScript

Aplicación web full-stack con React, Express y TypeScript: autenticación local, dashboard con gráficas y pasarela de pagos simulada.

## Estado

En desarrollo. Esta versión contiene únicamente la base del proyecto: configuración de frontend y backend, y pruebas de humo en ambos.

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
npm run dev
```

El segundo comando inicia backend y frontend a la vez. El backend queda en `http://localhost:3001` y el frontend en `http://localhost:5173`.

No hace falta crear archivos `.env`: todas las variables tienen un valor por defecto. Para personalizarlas, copiar los ejemplos.

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

Para iniciar cada parte por separado:

```
npm run dev:backend
npm run dev:frontend
```

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

Opcionales. Si no existe el archivo `.env`, se usan los valores por defecto.

Backend (`backend/.env`):

| Variable | Descripción | Valor por defecto |
|---|---|---|
| `PORT` | Puerto del servidor | `3001` |
| `CORS_ORIGIN` | Origen permitido para el frontend | `http://localhost:5173` |
| `SNAILPAY_FORCE_DOWN` | Reservada para simular la caída del servicio de pagos | `false` |

Frontend (`frontend/.env`):

| Variable | Descripción | Valor por defecto |
|---|---|---|
| `VITE_API_URL` | URL base del backend | `http://localhost:3001` |
