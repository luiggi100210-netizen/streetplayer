# StreetPlayer — Flujo de Autenticación

## Resumen

StreetPlayer implementa un sistema de autenticación de doble token con soporte para
proveedores OAuth (Google y Facebook vía Firebase) y credenciales propias (email + contraseña).

---

## Tokens

| Token         | Duración     | Almacenamiento        | Propósito                              |
|---------------|--------------|-----------------------|----------------------------------------|
| Access token  | 15 minutos   | `localStorage`        | Autorizar peticiones a la API          |
| Refresh token | 30 días      | `localStorage`        | Obtener nuevos access tokens           |
| Last user     | Sin expiración | `localStorage`      | UX "Continuar como" en el login        |

### Claves de localStorage

| Clave          | Contenido                                              |
|----------------|--------------------------------------------------------|
| `sp_token`     | JWT firmado con `JWT_SECRET`                           |
| `sp_refresh`   | UUID opaco (guardado en BD como SHA-256)               |
| `sp_last_user` | `{ id, nombre, username, foto_url, email, provider }`  |

---

## Flujo al abrir la app

```
App arranca
  │
  ├─ sp_token existe?
  │     SÍ → GET /api/auth/me
  │           OK  → usuario autenticado → Home
  │           401 → intentar renovar (Caso 2)
  │
  ├─ sp_refresh existe?
  │     SÍ → POST /api/auth/refresh
  │           OK  → guardar nuevos tokens → GET /auth/me → Home
  │           401 → limpiar tokens (preservar sp_last_user) → Login
  │
  └─ Nada → Login
              sp_last_user existe? → pantalla "Continuar como [nombre]"
              No existe?           → pantalla de login estándar
```

---

## Flujo de Login

### Con Google o Facebook (OAuth)

```
1. Usuario toca "Continuar con Google"
2. Firebase abre selector de cuenta del dispositivo (sin contraseña)
3. Firebase devuelve idToken al frontend
4. Frontend: POST /api/auth/firebase { idToken }
5. Backend verifica idToken con Firebase Admin SDK
6. Backend busca usuario: por firebase_uid → por email → crea nuevo
7. Backend genera: access token (15 min) + refresh token (30 días, guardado en BD)
8. Frontend llama login(token, refreshToken, usuario)
9. authStorage guarda los 3 valores → navegación al Home
```

### Con email y contraseña

```
1. Usuario ingresa email y contraseña
2. Frontend: POST /api/auth/login { email, password }
3. Backend valida hash bcrypt
4. Backend genera: access token + refresh token
5. Frontend llama login(token, refreshToken, usuario)
6. authStorage guarda los 3 valores → navegación al Home
```

---

## Renovación silenciosa (mid-session)

Cuando cualquier petición a la API devuelve **401**:

```
Interceptor en api.js detecta 401
  │
  ├─ ¿Es una ruta /auth/? → no renovar (evitar bucle)
  │
  └─ Tiene sp_refresh?
        SÍ → POST /api/auth/refresh { refreshToken }
              OK  → guardar nuevos tokens → reintentar petición original
              401 → clearSession + redirigir a /login
        NO  → clearSession + redirigir a /login
```

El usuario **nunca ve este proceso** si el refresh es válido.

---

## Rotación de Refresh Tokens

Cada vez que se usa un refresh token para renovar, el token recibido se **revoca en BD**
y se emite uno nuevo. Esto significa:

- Si alguien roba un refresh token y lo usa después de que el usuario ya lo renovó, recibirá 401.
- Cada sesión activa tiene su propio refresh token único.

---

## Logout

```
1. Frontend: POST /api/auth/logout { refreshToken }
2. Backend marca el refresh token como revocado en BD
3. Frontend: clearSession() — borra sp_token y sp_refresh
   (sp_last_user se PRESERVA para el flujo "Continuar como")
4. Socket desconectado
5. usuario = null → App redirige a Login
```

---

## Pantalla "Continuar como"

Si `sp_last_user` existe pero los tokens expiraron:

```
┌─────────────────────────────┐
│   [foto de perfil]          │
│   Juan García               │
│   @juan_abc                 │
│   juan@gmail.com            │
│   [badge: google]           │
│                             │
│  [Continuar como Juan]      │  ← 1 toque → OAuth flow
│                             │
│  ¿No eres Juan?             │
│  [Usar otra cuenta]         │  ← limpia sp_last_user + form normal
└─────────────────────────────┘
```

Para usuarios de email: se muestra solo el campo de contraseña (email pre-cargado).

---

## Variables de entorno requeridas (backend)

| Variable              | Descripción                              | Ejemplo         |
|-----------------------|------------------------------------------|-----------------|
| `JWT_SECRET`          | Secreto para firmar access tokens        | cadena aleatoria|
| `ACCESS_TOKEN_EXPIRES`| Duración del access token                | `15m`           |

> **Nota:** Ejecutar `backend/src/db/refresh_tokens_migration.sql` en la base de datos
> antes de iniciar el servidor con esta versión.

---

## Tabla en base de datos

```sql
refresh_tokens (
  id          UUID PRIMARY KEY,
  usuario_id  UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  token_hash  CHAR(64)  -- SHA-256 del token crudo (nunca se guarda el token en claro)
  expires_at  TIMESTAMPTZ,
  revocado    BOOLEAN DEFAULT false,
  creado_en   TIMESTAMPTZ DEFAULT NOW()
)
```

---

## Archivos clave

| Archivo | Responsabilidad |
|---------|-----------------|
| `frontend/src/services/authStorage.js` | Fuente única de verdad para localStorage |
| `frontend/src/services/api.js` | Interceptor de renovación silenciosa |
| `frontend/src/context/AuthContext.jsx` | Ciclo de vida de la sesión |
| `frontend/src/pages/auth/Login.jsx` | UI login + "Continuar como" |
| `backend/src/controllers/auth.controller.js` | Lógica de tokens |
| `backend/src/db/refresh_tokens_migration.sql` | Migración de BD |
