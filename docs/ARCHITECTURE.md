# Arquitectura de Parche

Este documento describe la arquitectura técnica completa de la aplicación Parche — una plataforma web que conecta locales de gastronomía/retail con trabajadores que buscan turnos temporales.

---

## Visión general del sistema

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENTE (Browser)                           │
│                    React 19 + TypeScript + Vite                     │
│                         localhost:5173                              │
└───────────────────┬───────────────────────┬─────────────────────────┘
                    │                       │
         HTTP REST  │               Firebase JS SDK
     (solo flujos   │          (lecturas/escrituras CRUD)
       críticos)    │                       │
                    ▼                       ▼
┌───────────────────────────┐   ┌───────────────────────────────────┐
│      FastAPI Backend      │   │         Firebase / GCP            │
│       Python 3.11         │   │         ml-lab-ivan               │
│      localhost:8000       │   │                                   │
│                           │   │  ┌─────────────┐                  │
│  Firebase Admin SDK (ADC) │───┼─▶│  Firestore  │                  │
│                           │   │  │  (NoSQL DB) │                  │
└───────────────────────────┘   │  └─────────────┘                  │
                                │  ┌─────────────┐                  │
                                │  │ Firebase    │                  │
                                │  │ Auth        │                  │
                                │  └─────────────┘                  │
                                │  ┌─────────────┐                  │
                                │  │ Cloud       │                  │
                                │  │ Storage     │                  │
                                │  └─────────────┘                  │
                                └───────────────────────────────────┘
```

---

## 1. Frontend

### 1.1 Stack y dependencias clave

| Dependencia | Versión | Uso |
|---|---|---|
| React | 19 | UI library |
| TypeScript | 5 | Tipado estático |
| Vite | 8 | Build tool y dev server |
| React Router | 7 | Client-side routing |
| react-hook-form | 7 | Gestión de formularios |
| Zod | 3 | Validación de esquemas |
| @hookform/resolvers | — | Puente rhf ↔ Zod |
| Firebase JS SDK | 10 | Auth + Firestore desde el browser |
| lucide-react | — | Iconografía |

**Sin Tailwind CSS.** Todos los estilos son `inline styles` con `CSSProperties` de React, complementados por tokens CSS en `index.css` (`:root`). Decisión tomada para simplificar el setup de MVP.

### 1.2 Estructura de carpetas

```
src/
├── App.tsx              ← Router raíz, guards PublicOnly y RootRedirect
├── contexts/
│   └── AuthContext.tsx  ← Estado global de autenticación
├── components/
│   ├── ProtectedRoute.tsx
│   ├── layout/
│   │   ├── Layout.tsx   ← Wrappea contenido con Navbar
│   │   └── Navbar.tsx
│   ├── marketplace/
│   │   ├── CreateJobPostModal.tsx
│   │   └── JobPostDetailModal.tsx
│   └── ui/              ← Componentes primitivos reutilizables
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── Input.tsx
│       └── Loader.tsx
├── pages/
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   ├── ForgotPasswordPage.tsx
│   ├── OnboardingPage.tsx     ← NUEVO: flujo de perfil inicial
│   ├── MarketplacePage.tsx    ← Dashboard principal (distinto por rol)
│   ├── ProfilePage.tsx
│   └── NotificationsPage.tsx
├── services/
│   ├── jobPosts.ts      ← Acceso directo a Firestore
│   └── notifications.ts
├── lib/
│   ├── firebase.ts      ← init Firebase app, exporta auth, db, storage
│   ├── api.ts           ← fetch wrapper para el backend FastAPI
│   └── chileLocations.ts  ← Catálogo estático de regiones/comunas
└── types/
    └── index.ts         ← Interfaces TypeScript del dominio + constantes
```

### 1.3 Routing y guards de autenticación

```
/                → RootRedirect
/login           → PublicOnly → LoginPage
/register        → PublicOnly → RegisterPage
/forgot-password → PublicOnly → ForgotPasswordPage
/onboarding      → OnboardingPage  (sin guard — accesible con o sin sesión)
/marketplace     → ProtectedRoute → MarketplacePage
/profile         → ProtectedRoute → ProfilePage
/notifications   → ProtectedRoute → NotificationsPage
```

**`PublicOnly`**: si el usuario ya está autenticado y tiene perfil completo → redirige a `/marketplace`. Si está autenticado pero sin perfil → redirige a `/onboarding`.

**`ProtectedRoute`**: si no está autenticado → `/login`. Si está autenticado pero `!profile_completed` → `/onboarding`.

**`RootRedirect`**: punto de entrada, evalúa estado y redirige al destino correcto.

### 1.4 AuthContext — gestión de sesión

`AuthContext` expone:

| Campo/Método | Tipo | Descripción |
|---|---|---|
| `firebaseUser` | `FirebaseUser \| null` | Usuario de Firebase Auth |
| `appUser` | `User \| null` | Documento `users/{uid}` de Firestore |
| `loading` | `boolean` | Verdadero hasta que `onAuthStateChanged` resuelve por primera vez |
| `bootstrapped` | `boolean` | Se vuelve `true` tras el primer ciclo de auth |
| `signIn` | `fn` | Email + password |
| `signInWithGoogle` | `fn` | OAuth Google (popup) |
| `signUp` | `fn` | Crear cuenta (solo email/password; Firestore se escribe en onboarding) |
| `logOut` | `fn` | Firebase sign out |
| `resetPassword` | `fn` | Email de recuperación |
| `refreshAppUser` | `fn` | Recarga `users/{uid}` desde Firestore |

**Flujo de bootstrap:**

```
App monta
  └── onAuthStateChanged dispara
        ├── fbUser = null → setAppUser(null), loading = false
        └── fbUser ≠ null → getDoc("users/{uid}") → setAppUser(data), loading = false
```

F5 o cierre/reapertura de pestaña: Firebase Auth persiste el token en `localStorage`. Al recargar, `onAuthStateChanged` vuelve a disparar con el usuario activo, recarga `appUser` desde Firestore, y la sesión se restaura sin pasar por `/login`.

### 1.5 Diseño visual

**Tokens de color principales:**

```css
--bg-base:    #F7F4EF   /* fondo general (beige cálido) */
--bg-surface: #FFFFFF   /* fondo de cards */
--accent:     #ad4b7e   /* rosa corporativo — CTA, íconos, links */
--action:     #1F1F1F   /* negro casi-puro — botones primarios */
--text-primary:   #1F1F1F
--text-secondary: #6B7280
--border-warm: #ECE7DD
```

No hay gradientes. El diseño es flat, compacto, enfocado en densidad de información (especialmente en la lista de turnos).

---

## 2. Backend

### 2.1 Stack

| Componente | Tecnología |
|---|---|
| Framework | FastAPI 0.111 |
| Runtime | Python 3.11 (*obligatorio — pydantic-core no tiene wheels para 3.12+*) |
| Validación | Pydantic v2 + pydantic-settings |
| Auth middleware | Firebase Admin SDK — verifica ID Tokens en cada request |
| Base de datos | Firestore Admin SDK (ADC en local, service account en Cloud Run) |
| Email | SendGrid / stub configurable |
| Deploy | Cloud Run (pendiente) |

### 2.2 Estructura del backend

```
backend/app/
├── main.py                  ← FastAPI app, CORS, routers
├── config.py                ← Settings (pydantic-settings, lee .env)
├── auth/
│   └── dependencies.py      ← get_current_user(token) → AuthenticatedUser
│                               require_owner() → valida rol owner
├── firebase/
│   └── client.py            ← Singleton Firestore client (get_db())
├── routes/
│   ├── users.py             ← /users
│   ├── businesses.py        ← /businesses
│   ├── job_posts.py         ← /job-posts
│   ├── applications.py      ← /applications/{id}/accept, /withdraw
│   └── notifications.py     ← /notifications
├── schemas/
│   └── schemas.py           ← Pydantic *Create, *Out, *Update por entidad
└── services/
    ├── application_service.py  ← Lógica crítica (11 pasos atómicos)
    └── email_service.py        ← send_not_selected_email()
```

### 2.3 Autenticación en el backend

Cada request protegido debe incluir:

```
Authorization: Bearer <Firebase ID Token>
```

El `get_current_user` dependency:
1. Extrae el token del header
2. Llama `firebase_admin.auth.verify_id_token(token)`
3. Devuelve `AuthenticatedUser(uid, email, role)`

`require_owner` extiende `get_current_user` y además verifica que `users/{uid}.role == 'owner'`.

### 2.4 Flujo crítico: aceptar postulante

`POST /applications/{application_id}/accept` — solo accesible para owners.

El servicio `application_service.accept_application()` ejecuta **11 pasos en secuencia** (no hay transacción Firestore multi-documento en este MVP — la atomicidad es eventual):

```
1.  Cargar la postulación (application)
2.  Verificar que el owner_uid coincide
3.  Cargar el job_post
4.  Verificar que job_post.status == 'published'
5.  Verificar que application.status == 'applied'
6.  Verificar solapamiento de horarios del worker con otros turnos aceptados
7.  Marcar application → 'accepted'
8.  Incrementar job_post.accepted_workers_count
    → si count >= required_workers: job_post.status = 'filled'
9.  Marcar todas las demás applications del mismo job_post → 'not_selected'
10. Crear notificación interna (notifications/{id}) para cada worker no seleccionado
11. Escribir en audit_logs + (opcional) enviar email vía SendGrid
```

**Retorna** un resumen JSON con conteos: `not_selected_count`, `notifications_created`, `emails_sent`.

---

## 3. Capa de datos (Firestore)

### 3.1 Colecciones y esquema

#### `users/{uid}`
```json
{
  "uid": "string",
  "email": "string",
  "role": "owner | worker",
  "rut": "string",
  "first_name": "string",
  "last_name": "string",
  "profile_completed": true,
  "email_verified": true,
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

#### `owners/{uid}`
```json
{
  "uid": "string",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```
*(Reservado para datos extendidos del owner; actualmente mínimo)*

#### `workers/{uid}`
```json
{
  "uid": "string",
  "rut": "string",
  "nationality": "string",
  "profile_photo_url": "string",
  "identity_document_url": "string",
  "occupations": [{ "name": "string", "years_experience": 0 }],
  "certificates": [{ "name": "string", "url": "string" }],
  "status": "active | suspended",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

#### `businesses/{id}` (auto-ID)
```json
{
  "owner_uid": "string",
  "business_rut": "string",
  "business_name": "string",
  "business_type": "restaurante | bar | restobar | disco | tienda | convenience_store | otro",
  "business_subtype": "string",
  "address": "string",
  "place_id": "string",
  "lat": 0.0,
  "lng": 0.0,
  "region": "string",
  "commune": "string",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

#### `job_posts/{id}` (auto-ID)
```json
{
  "owner_uid": "string",
  "business_id": "string",
  "title": "string",
  "occupation": "string",
  "description": "string",
  "requirements": "string",
  "start_date": "YYYY-MM-DD",
  "end_date": "YYYY-MM-DD",
  "start_time": "HH:MM",
  "end_time": "HH:MM",
  "required_workers": 1,
  "accepted_workers_count": 0,
  "salary_total_clp": 60000,
  "region": "string",
  "commune": "string",
  "status": "draft | published | closed | cancelled | filled | expired",
  "close_reason": "string | null",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

#### `applications/{id}` (auto-ID)
```json
{
  "job_post_id": "string",
  "owner_uid": "string",
  "worker_uid": "string",
  "status": "applied | withdrawn | accepted | rejected | not_selected | cancelled",
  "withdraw_reason": "string | null",
  "rejection_reason": "string | null",
  "auto_rejection_message_sent": false,
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

#### `notifications/{id}` (auto-ID)
```json
{
  "recipient_uid": "string",
  "type": "application_not_selected | application_accepted | new_application | job_post_filled | general",
  "title": "string",
  "message": "string",
  "related_job_post_id": "string | null",
  "related_application_id": "string | null",
  "read": false,
  "created_at": "timestamp"
}
```

#### `audit_logs/{id}` (auto-ID)
Solo escritura desde el backend (Admin SDK). Bloqueado para lectura/escritura en reglas de seguridad.
```json
{
  "event_type": "application_accepted | application_withdrawn | ...",
  "actor_uid": "string",
  "affected_uid": "string | null",
  "resource_type": "application | job_post | ...",
  "resource_id": "string",
  "metadata": {},
  "created_at": "timestamp"
}
```

### 3.2 Reglas de seguridad Firestore

Principios generales:
- `users/{uid}`: solo el propio usuario puede leer y escribir.
- `owners/{uid}` y `workers/{uid}`: ídem.
- `businesses/{id}`: el owner puede ver y editar sus propios locales.
- `job_posts/{id}`: workers ven los que están `published`; owner ve los propios.
- `applications/{id}`: worker ve las suyas; owner ve las de sus publicaciones.
- `notifications/{id}`: el destinatario puede leer y marcar como leída.
- `audit_logs/{id}`: nadie puede leer ni escribir (solo Admin SDK).

### 3.3 Índices Firestore

Las queries multi-campo requieren índices compuestos declarados en `firebase/firestore.indexes.json`. Están **declarados pero no desplegados** en este MVP.

**Workaround activo**: todas las queries en `frontend/src/services/jobPosts.ts` usan un solo `WHERE` y el ordenamiento se aplica en cliente con `.sort()`:

```ts
// En lugar de:
query(collection(db, 'job_posts'), where('owner_uid', '==', uid), orderBy('created_at', 'desc'))

// Se usa:
const posts = query(collection(db, 'job_posts'), where('owner_uid', '==', uid))
posts.sort((a, b) => (b.created_at?.seconds ?? 0) - (a.created_at?.seconds ?? 0))
```

**Para producción:** desplegar índices con `firebase deploy --only firestore:indexes` y restaurar `orderBy` en las queries.

---

## 4. Autenticación — flujo completo

```
Usuario       Firebase Auth         Firestore          App React
  │                  │                   │                  │
  │──register()─────▶│                   │                  │
  │                  │──createUser()─────│                  │
  │                  │◀──fbUser──────────│                  │
  │                  │                   │                  │
  │                  │──onAuthStateChanged dispara──────────▶│
  │                  │                   │◀──getDoc(users/uid)│
  │                  │                   │──null (nuevo)─────▶│
  │                  │                   │                  │──redirect /onboarding
  │                  │                   │                  │
  │──onboarding()────────────────────────▶│                  │
  │                  │                   │──setDoc users/uid │
  │                  │                   │──setDoc workers/uid│
  │                  │                   │                  │──refreshAppUser()
  │                  │                   │◀──getDoc(users/uid)│
  │                  │                   │──appUser completo─▶│
  │                  │                   │                  │──redirect /marketplace
```

---

## 5. Patrón de acceso a datos

### Frontend → Firestore directo (Firebase JS SDK)

Usado para operaciones CRUD simples:

| Operación | Colección | Quién la hace |
|---|---|---|
| Crear usuario | `users`, `workers`, `owners`, `businesses` | Onboarding (frontend) |
| Publicar turno | `job_posts` | CreateJobPostModal (frontend) |
| Postular | `applications` | JobPostDetailModal (frontend) |
| Leer notificaciones | `notifications` | NotificationsPage (frontend) |
| Editar perfil | `users`, `workers`, `businesses` | ProfilePage (frontend) |

### Frontend → Backend → Firestore (Admin SDK)

Usado para operaciones que requieren lógica transaccional o privilegios de servidor:

| Operación | Ruta | Por qué usa backend |
|---|---|---|
| Aceptar postulante | `POST /applications/{id}/accept` | 11 pasos atómicos, crea notificaciones, envía emails, escribe audit_log |
| Retirar postulación | `POST /applications/{id}/withdraw` | Validaciones y audit_log |

---

## 6. Gestión de estado

No hay Redux ni Zustand. El estado se gestiona con:

| Mecanismo | Dónde | Qué guarda |
|---|---|---|
| `AuthContext` (React Context) | Global | `firebaseUser`, `appUser`, `loading` |
| `useState` local | Cada page/modal | Datos del formulario, loading, error, lista de posts |
| React Router state | URL | Ruta activa (no se usa URL params para estado) |

No hay estado de servidor (server state caching) — cada carga de página hace una nueva llamada a Firestore.

---

## 7. Componentes de UI

Todos los componentes primitivos están en `src/components/ui/` con inline styles.

### Button

Variantes: `primary` (negro), `secondary` (blanco), `outline`, `ghost` (rosa), `danger` (rojo).
Tamaños: `sm`, `md`, `lg`.
Usa `useState(hover)` para efecto hover sin CSS externo.

### Input / Select / Textarea

`Input.tsx` exporta los tres. Todos aceptan `label`, `error` (FieldError | string), `hint`.
Focus cambia borde a `#ad4b7e` (accent) con `onFocus`/`onBlur` inline.

### Card / Badge / Spinner

`Card`: fondo blanco, borde `#ECE7DD`, border-radius 14px. Padding configurable: `none | sm | md | lg`.
`Badge`: colores predefinidos (`green`, `amber`, `pink`, `red`, `blue`, `gray`).
`Spinner`: SVG animado con CSS `@keyframes spin`.

---

## 8. Catálogo de regiones y comunas

`frontend/src/lib/chileLocations.ts` es un catálogo **estático** (no viene de API) con 9 regiones y sus comunas. Se usa en:
- `OnboardingPage` — formulario de Negocio
- `CreateJobPostModal` — formulario de publicación
- `MarketplacePage` — filtros de búsqueda del Trabajador
- `ProfilePage` — edición de locales

Función utilitaria:
```ts
getCommunesForRegion(regionName: string | null): string[]
```

---

## 9. Despliegue futuro (pendiente)

### Backend → Cloud Run

```bash
gcloud run deploy parche-api \
  --source ./backend \
  --region us-west1 \
  --project ml-lab-ivan \
  --allow-unauthenticated \
  --set-env-vars APP_ENV=prod,GCP_PROJECT_ID=ml-lab-ivan,...
```

En Cloud Run, las credenciales se obtienen automáticamente del service account del servicio (no necesita `GOOGLE_APPLICATION_CREDENTIALS`).

### Frontend → Firebase Hosting

```bash
cd frontend && npm run build
firebase deploy --only hosting --project ml-lab-ivan
```

Actualizar `VITE_API_BASE_URL` a la URL del Cloud Run.

### Índices Firestore

```bash
firebase deploy --only firestore:indexes --project ml-lab-ivan
```

Tras esto, restaurar `orderBy` en las queries de `jobPosts.ts`.

### Reglas Firestore

```bash
firebase deploy --only firestore:rules --project ml-lab-ivan
```

Revisar `firebase/firestore.rules` — actualmente las reglas están definidas correctamente pero no desplegadas a producción.

---

## 10. Consideraciones de seguridad

| Aspecto | Estado |
|---|---|
| Firebase Auth tokens en cada request al backend | ✅ Implementado |
| Reglas Firestore para aislar datos por usuario | ✅ Definidas, pendiente deploy |
| Validación de datos en frontend (Zod) | ✅ |
| Validación de datos en backend (Pydantic) | ✅ |
| CORS restringido a `localhost:5173` en dev | ✅ |
| Claves de API no expuestas en frontend (`VITE_` solo para Firebase web config, no claves de servidor) | ✅ |
| Audit log de operaciones críticas | ✅ |
| Rate limiting | ⏳ Pendiente |
| Firebase App Check | ⏳ Pendiente |
