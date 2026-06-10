# ⚽ StreetPlayer

Red social deportiva para jugadores de calle: organiza pichangas, sube XP,
forma equipos, lanza retos y domina el ranking de tu ciudad.

**Stack:** Node.js + Express + PostgreSQL + Socket.IO · React 18 + Vite + Tailwind

## Estructura

```
streetplayer/
├── backend/    API REST + WebSockets + crons (Express, puerto 4000)
│   └── src/
│       ├── controllers/   Lógica de cada dominio (auth, eventos, torneos…)
│       ├── routes/        Rutas + validación (express-validator)
│       ├── middleware/    auth (JWT), validate, asyncHandler
│       ├── services/      XP, medallas, notificaciones, mailer, crons
│       ├── db/            schema.sql + migraciones (corren solas al arrancar)
│       └── config/        env (validación), cors, database (pool pg)
└── frontend/   SPA React (Vite, puerto 5173)
    └── src/
        ├── pages/         Una carpeta por dominio; /admin = panel completo
        ├── components/    UI compartida (AuthShell, Avatar, UploadFoto…)
        ├── services/      api (axios + renovación de tokens), socket, authStorage
        ├── context/       AuthContext (sesión)
        └── styles/        brand.js (tokens de marca) + Tailwind
```

## Desarrollo local

Requisitos: Node 18+, PostgreSQL 14+ corriendo.

```bash
# 1. Instalar todo
npm run install:all

# 2. Configurar variables (copiar y editar)
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 3. Levantar backend + frontend juntos
npm run dev
```

- App: http://localhost:5173 · Panel admin: http://localhost:5173/admin
- Las migraciones de BD corren automáticamente al arrancar el backend.
- El usuario admin se crea/actualiza al arrancar con `ADMIN_EMAIL` / `ADMIN_PASSWORD`.
- Sin SMTP configurado, los emails (recuperación de contraseña) se imprimen en consola.
- Sin Cloudinary configurado, las fotos se guardan en `backend/uploads/` (solo desarrollo).

## Autenticación

- Access token JWT (15 min) + refresh token opaco rotativo (30 días), hasheado en BD.
- Renovación silenciosa vía interceptor de axios; logout revoca el refresh token.
- Recuperación de contraseña: código de 6 dígitos por email, 15 min, un solo uso;
  al cambiarla se revocan todas las sesiones.
- Login con Google/Facebook vía Firebase (requiere `FIREBASE_*` en backend y `VITE_FIREBASE_*` en frontend).
- Anti fuerza bruta: 10 intentos/15 min en endpoints de credenciales (solo producción).

## Despliegue

| Pieza | Plataforma | Notas |
|---|---|---|
| Backend | Render (`render.yaml`) | Health check en `/health`. Variables requeridas en producción: `DATABASE_URL`, `JWT_SECRET`, `ADMIN_PASSWORD`, `ALLOWED_ORIGINS`. Recomendadas: `FIREBASE_*`, `SMTP_*`, `CLOUDINARY_*` (sin Cloudinary las fotos se pierden en cada deploy: el disco de Render es efímero). |
| Frontend | Vercel (`frontend/vercel.json`) | Definir `VITE_BACKEND_URL` y `VITE_FIREBASE_*`. |
| Base de datos | Neon / Render PostgreSQL | Las migraciones son idempotentes y corren al arrancar. |

⚠️ El backend asume **una sola instancia** (crons in-process y Socket.IO en memoria).
Antes de escalar horizontalmente: adapter de Redis para Socket.IO y mover crons a un worker.
