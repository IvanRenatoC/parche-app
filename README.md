# Parche

> Plataforma web que conecta **locales de gastronomía y retail** (restaurantes, bares, discotecas, tiendas) con **personas que buscan turnos temporales de trabajo**.

---

## Visión del producto

Parche resuelve dos problemas en paralelo:

| Rol | Problema que resuelve |
|---|---|
| **Negocio** (`owner` en código) | Necesita cubrir turnos de última hora o eventuales sin contratar a tiempo completo |
| **Trabajador** (`worker` en código) | Busca trabajo temporal flexible, filtrado por zona y oficio, con información clara del turno |

> **Convención de nombres**: en el código interno los roles son `owner` y `worker`. En toda la UI visible se muestran como **Negocio** y **Trabajador**.

El flujo central es: Negocio publica un turno → Trabajadores postulan → Negocio acepta a uno → el sistema notifica automáticamente al resto que no fueron seleccionados.

---

## Estado actual del MVP (2026-05-02)

| Área | Estado |
|---|---|
| Frontend React + TypeScript | ✅ Funcional en local |
| Backend FastAPI + Python | ✅ Funcional en local |
| Firebase Auth (Email/Password) | ✅ Activo (requiere habilitarlo en consola) |
| Firestore | ✅ Funcional en local (reglas en test mode) |
| Flujo crítico de aceptación | ✅ Implementado en backend |
| Notificaciones internas | ✅ Funcionales (eventos: postulación, desistimiento, nuevo turno; con campanita y badge en navbar) |
| Chat owner ↔ postulante | ✅ Tiempo real (Firestore onSnapshot), iniciado por el owner |
| Calificaciones obligatorias | ✅ Gate antes de publicar/postular; promedio visible en UI |
| Nota de presentación al postular | ✅ Worker escribe nota; owner la ve en el panel expandible |
| Google Maps integrado | ✅ Address Autocomplete (locales) + mapa de turnos en marketplace |
| Cloud Run (deploy backend) | ⏳ Pendiente |
| Firebase Hosting (deploy frontend) | ⏳ Pendiente |
| Índices Firestore compuestos | ⏳ Pendiente deploy (workaround: orden en cliente) |
| SendGrid emails reales | ⏳ Pendiente (stub activo en dev) |
| CI/CD pipeline | ⏳ Pendiente |

---

## Stack técnico

| Capa | Tecnología | Versión |
|---|---|---|
| Frontend | React + TypeScript + Vite | React 19, Vite 8 |
| Estilos | Inline CSS con design tokens (`#F7F4EF`, `#ad4b7e`) | Sin Tailwind |
| Formularios | react-hook-form + Zod | rhf 7, zod 3 |
| Routing | React Router | v7 |
| Backend | FastAPI + Python | 3.11 |
| Validación backend | Pydantic v2 + pydantic-settings | 2.7 |
| Auth | Firebase Auth (Email/Password + Google) | SDK 10 |
| Base de datos | Firestore (NoSQL) | Proyecto: `ml-lab-ivan` |
| Storage | Cloud Storage for Firebase | Pendiente uso activo |
| Email | SendGrid (`EMAIL_PROVIDER=sendgrid`) / stub en dev | sendgrid 6 |
| Backend deploy | Cloud Run — GCP `us-west1` | Pendiente |
| Frontend deploy | Firebase Hosting | Pendiente |
| Mapas | Google Maps Platform (Maps JS + Places API) | Activo en frontend |

---

## Arquitectura local

```
Browser (localhost:5173)
    │
    │  HTTP REST  (para flujos críticos: aceptar postulante)
    ▼
FastAPI (localhost:8000)
    │
    │  Firebase Admin SDK — Application Default Credentials (ADC)
    ▼
Firestore / Firebase Auth
    └── Proyecto GCP: ml-lab-ivan

Browser (localhost:5173)
    │
    │  Firebase JS SDK (directo a Firestore)
    ▼
Firestore  ← lecturas y escrituras CRUD desde frontend
```

**Patrón de escritura dual:**

- La mayoría de las operaciones CRUD (crear usuario, publicar turno, postular) se hacen **directamente desde el frontend al Firestore** vía Firebase JS SDK.
- El **flujo crítico de aceptación** (`POST /applications/{id}/accept`) pasa por el backend, que ejecuta la lógica transaccional compleja: validar solapamiento de horarios, marcar `not_selected`, crear notificaciones, enviar emails y registrar en `audit_logs`.

---

## Estructura del repositorio

```
parche-app/
├── frontend/                        # React 19 + TypeScript + Vite
│   ├── src/
│   │   ├── App.tsx                  # Router, PublicOnly, RootRedirect
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx      # FirebaseUser + appUser (Firestore), loading, refreshAppUser
│   │   ├── components/
│   │   │   ├── ProtectedRoute.tsx   # Redirige a /onboarding si no tiene perfil completo
│   │   │   ├── layout/
│   │   │   │   ├── Layout.tsx       # Layout principal con Navbar
│   │   │   │   └── Navbar.tsx       # Muestra rol "Negocio"/"Trabajador", dropdown, notificaciones
│   │   │   ├── marketplace/
│   │   │   │   ├── CreateJobPostModal.tsx  # Modal para publicar turno (owner)
│   │   │   │   ├── JobPostDetailModal.tsx  # Modal para ver postulantes y aceptar (owner) / postular (worker)
│   │   │   │   └── ChatModal.tsx           # Chat en tiempo real entre owner y postulante
│   │   │   ├── ratings/
│   │   │   │   ├── RatingModal.tsx         # Gate de calificación obligatoria (1-5 estrellas)
│   │   │   │   └── StarDisplay.tsx         # Visualización de promedio + "Sin calificaciones"
│   │   │   └── ui/
│   │   │       ├── Button.tsx       # Variantes: primary, secondary, outline, ghost, danger
│   │   │       ├── Card.tsx         # Card, Badge, Spinner
│   │   │       ├── Input.tsx        # Input, Select, Textarea con inline styles
│   │   │       └── Loader.tsx       # FullscreenLoader para pantallas de carga
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx        # Login email/password + Google
│   │   │   ├── RegisterPage.tsx     # Solo email/password; navega a /onboarding
│   │   │   ├── ForgotPasswordPage.tsx
│   │   │   ├── OnboardingPage.tsx   # Dos pasos: elige rol → completa datos mínimos
│   │   │   ├── MarketplacePage.tsx  # Dashboard principal: owner ve sus publicaciones / worker busca turnos
│   │   │   ├── ProfilePage.tsx      # Perfil editable: datos personales, locales (owner) o datos trabajador
│   │   │   └── NotificationsPage.tsx
│   │   ├── services/
│   │   │   ├── jobPosts.ts          # CRUD de job_posts y applications sobre Firestore
│   │   │   └── notifications.ts     # Lectura de notificaciones del usuario
│   │   ├── lib/
│   │   │   ├── firebase.ts          # Inicialización Firebase (auth, db, storage)
│   │   │   ├── api.ts               # Cliente HTTP para llamadas al backend FastAPI
│   │   │   └── chileLocations.ts    # Catálogo local de regiones y comunas de Chile
│   │   └── types/
│   │       └── index.ts             # Interfaces TypeScript + constantes del dominio
│   ├── .env.example
│   └── package.json
│
├── backend/                         # FastAPI + Python 3.11
│   ├── app/
│   │   ├── main.py                  # FastAPI app + CORS + health endpoint
│   │   ├── config.py                # Settings via pydantic-settings (lee .env)
│   │   ├── auth/
│   │   │   └── dependencies.py      # get_current_user, require_owner — verifica token Firebase
│   │   ├── firebase/
│   │   │   └── client.py            # get_db() — cliente Firestore Admin SDK
│   │   ├── routes/
│   │   │   ├── users.py             # GET/POST /users
│   │   │   ├── businesses.py        # GET/POST /businesses
│   │   │   ├── job_posts.py         # GET/POST/PATCH /job-posts, POST /job-posts/{id}/close
│   │   │   ├── applications.py      # POST /applications/{id}/accept, /withdraw
│   │   │   └── notifications.py     # GET /notifications
│   │   ├── schemas/
│   │   │   └── schemas.py           # Pydantic models: *Create, *Out, *Update
│   │   └── services/
│   │       ├── application_service.py  # Lógica crítica de aceptación (11 pasos)
│   │       └── email_service.py        # Envío vía SendGrid o stub
│   ├── .env.example
│   ├── Dockerfile
│   └── requirements.txt
│
├── firebase/
│   ├── firebase.json                # Configuración del proyecto Firebase
│   ├── firestore.rules              # Reglas de seguridad Firestore
│   ├── firestore.indexes.json       # Índices compuestos (requieren deploy)
│   └── storage.rules
│
├── docs/
│   ├── ARCHITECTURE.md              # Arquitectura detallada del sistema
│   ├── DATA_MODEL.md
│   ├── FIREBASE_SETUP.md
│   ├── GCP_DEPLOYMENT.md
│   ├── LOCAL_RUNBOOK.md             # Guía paso a paso para levantar en local
│   ├── SECURITY_RULES.md
│   └── TECHNICAL_SPEC.md
│
└── README.md
```

---

## Modelo de datos (Firestore)

Firestore es una base de datos NoSQL orientada a documentos. Las colecciones principales son:

| Colección | Documento | Descripción |
|---|---|---|
| `users/{uid}` | Por usuario Firebase | Rol, RUT, nombre, `profile_completed` |
| `owners/{uid}` | Por owner | Datos extendidos del Negocio |
| `workers/{uid}` | Por worker | Oficios, experiencia, docs, foto |
| `businesses/{id}` | Por local | RUT empresa, nombre, tipo, región, comuna |
| `job_posts/{id}` | Por publicación | Turno: fechas, horarios, salario, cupos, estado |
| `applications/{id}` | Por postulación | Relación worker ↔ job_post, estado del proceso |
| `notifications/{id}` | Por notificación | Notificación interna para un usuario |
| `audit_logs/{id}` | Por evento | Solo escritura desde backend Admin SDK |

**Estados de una publicación (`JobPostStatus`):**
`draft` → `published` → `filled` | `closed` | `cancelled` | `expired`

**Estados de una postulación (`ApplicationStatus`):**
`applied` → `accepted` | `withdrawn` | `not_selected` | `rejected` | `cancelled`

---

## Flujos principales

### 1. Autenticación y onboarding

```
/register → Firebase Auth crea usuario → /onboarding
    └── Paso 1: elegir rol (Negocio o Trabajador)
    └── Paso 2: completar datos mínimos
        ├── Negocio: nombre, RUT persona, RUT empresa, nombre local, tipo, región, comuna
        │   → escribe en users/{uid}, owners/{uid}, businesses/{id}
        └── Trabajador: nombre, RUT persona, nacionalidad, oficio, experiencia
            → escribe en users/{uid}, workers/{uid}
    └── Navega a /marketplace
```

**Persistencia de sesión:** `AuthContext` escucha `onAuthStateChanged` → carga `users/{uid}` desde Firestore → `appUser` queda en contexto. `ProtectedRoute` bloquea si `!appUser.profile_completed`.

### 2. Publicar un turno (Negocio)

```
/marketplace → click "Publicar turno" → CreateJobPostModal
    └── Escribe en job_posts/{id} con status: 'published'
    └── Se prefill región/comuna del primer local del owner
    └── Lista se recarga → turno aparece como fila en el dashboard
```

### 3. Buscar y postular (Trabajador)

```
/marketplace → filtros (región, comuna, oficio, fecha)
    └── Lee job_posts WHERE status='published' → ordena en cliente
    └── Click en fila → JobPostDetailModal
    └── Click "Postular" → escribe en applications/{id}
```

### 4. Aceptar postulante — flujo crítico (Negocio)

Este es el único flujo que pasa por el backend (11 pasos atómicos):

```
Owner abre JobPostDetailModal → click "Aceptar" en un postulante
    └── Frontend: POST /applications/{id}/accept  (con Bearer token Firebase)
    └── Backend valida:
        1. La postulación existe y pertenece al owner
        2. La publicación está en estado 'published'
        3. La postulación está en estado 'applied'
        4. El worker no tiene solapamiento de horario con otro turno aceptado
    └── Backend ejecuta:
        5. Marca la postulación como 'accepted'
        6. Incrementa accepted_workers_count en el job_post
        7. Si count >= required_workers → marca job_post como 'filled'
        8. Marca las demás postulaciones pendientes como 'not_selected'
        9. Crea notificación interna para cada worker no seleccionado

Notificaciones adicionales (escritas desde el cliente, sin pasar por el backend):
- Worker postula → owner recibe `new_application`
- Worker desiste → owner recibe `application_withdrawn`
- Owner publica turno → workers reciben `new_job_post` (broadcast por rol)
        10. Envía email si EMAIL_PROVIDER=sendgrid
        11. Escribe en audit_logs
```

---

## Requisitos previos

- **Node.js** ≥ 18 y npm
- **Python 3.11** — *no usar 3.12+ por incompatibilidad de pydantic-core*
- **gcloud CLI** autenticado con acceso al proyecto `ml-lab-ivan`
- Firebase Auth Email/Password habilitado en [Firebase Console](https://console.firebase.google.com/project/ml-lab-ivan/authentication/providers)

Verificación rápida:

```bash
node --version          # ≥ 18
python3.11 --version    # 3.11.x
gcloud auth list        # cuenta activa
gcloud config get-value project  # ml-lab-ivan
gcloud auth application-default print-access-token  # debe retornar token
```

---

## Configuración de entorno

### `frontend/.env.local` (no se versiona)

```env
VITE_APP_ENV=dev
VITE_API_BASE_URL=http://localhost:8000
VITE_FIREBASE_API_KEY=<Firebase Console → parche-app → SDK setup>
VITE_FIREBASE_AUTH_DOMAIN=ml-lab-ivan.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=ml-lab-ivan
VITE_FIREBASE_STORAGE_BUCKET=ml-lab-ivan.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=<Firebase Console>
VITE_FIREBASE_APP_ID=<Firebase Console>
VITE_GOOGLE_MAPS_BROWSER_API_KEY=     # API key de Google Cloud (alias: VITE_GOOGLE_MAPS_API_KEY)
                                       # APIs requeridas: Maps JavaScript API + Places API
                                       # Restringir por HTTP referrer a http://localhost:5173/*
```

### `backend/.env` (no se versiona)

```env
APP_ENV=dev
GCP_PROJECT_ID=ml-lab-ivan
FIREBASE_PROJECT_ID=ml-lab-ivan
GCP_REGION=us-west1
CORS_ALLOWED_ORIGINS=http://localhost:5173
EMAIL_PROVIDER=stub
FROM_EMAIL=no-reply@parche.app
# GOOGLE_APPLICATION_CREDENTIALS=  ← no necesario si ADC está activo
```

> **Seguridad:** Nunca agregues claves de servidor con el prefijo `VITE_`. Los archivos `.env.local` y `backend/.env` están en `.gitignore`.

---

## Levantar en local

### Backend

```bash
cd backend
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Verifica: `curl http://localhost:8000/health`
→ `{"status":"ok","app":"parche-api","env":"dev","project":"ml-lab-ivan"}`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Disponible en **http://localhost:5173**

### URLs de desarrollo

| Servicio | URL |
|---|---|
| App web | http://localhost:5173 |
| Backend health | http://localhost:8000/health |
| Swagger UI | http://localhost:8000/docs |
| ReDoc | http://localhost:8000/redoc |

---

## Flujo de prueba recomendado

Ver guía completa en [`docs/LOCAL_RUNBOOK.md`](docs/LOCAL_RUNBOOK.md).

Resumen rápido:

1. Registrarse como **Negocio** → completar onboarding → publicar turno.
2. Cerrar sesión. Registrarse como **Trabajador** → postular al turno.
3. Volver como Negocio → abrir el turno → aceptar al postulante.
4. Entrar como Trabajador no seleccionado → revisar `/notifications`.

**Datos de prueba sugeridos:** ver [`docs/LOCAL_RUNBOOK.md §9.1`](docs/LOCAL_RUNBOOK.md#91-datos-sugeridos-para-probar)

---

## API del backend

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/health` | Health check |
| `GET/POST` | `/users` | Perfil de usuario |
| `GET/POST` | `/businesses` | Locales del owner |
| `GET/POST` | `/job-posts` | Publicaciones de turnos |
| `PATCH` | `/job-posts/{id}` | Editar publicación |
| `POST` | `/job-posts/{id}/close` | Cerrar publicación |
| `GET/POST` | `/job-posts/{id}/applications` | Postulaciones de una publicación |
| `POST` | `/applications/{id}/accept` | **Flujo crítico** de aceptación |
| `POST` | `/applications/{id}/withdraw` | Retiro de postulación |
| `GET` | `/notifications` | Bandeja de notificaciones |

Toda ruta protegida requiere header `Authorization: Bearer <Firebase ID Token>`.

---

## Decisiones técnicas relevantes

### Sin Tailwind CSS
El proyecto usa **inline styles + CSS tokens** (`index.css`). Se decidió así para evitar dependencias de configuración de PostCSS/Tailwind en un setup rápido de MVP. Los tokens de color están en `:root` del CSS.

### Escritura directa a Firestore desde frontend
Las operaciones CRUD simples (crear turno, postular, actualizar perfil) se escriben directamente desde el navegador al Firestore usando Firebase JS SDK, sin pasar por el backend. Solo el **flujo de aceptación** requiere backend por su complejidad transaccional.

### Índices Firestore y orden en cliente
Las queries con múltiples cláusulas (`WHERE + ORDER BY`) requieren índices compuestos en Firestore. Hasta que estos índices sean desplegados a producción, **todas las queries usan un único `WHERE` y el orden se aplica en cliente**. Esto funciona bien en desarrollo con pocos documentos.

### Python 3.11 obligatorio
`pydantic-core` no tiene wheels precompiladas para Python 3.12+. El proyecto requiere `python3.11` para el backend.

---

## Seguridad y secretos

| Archivo | ¿Se versiona? | Descripción |
|---|---|---|
| `frontend/.env.local` | NO | Firebase web config + API keys |
| `backend/.env` | NO | Config servidor local |
| `service-account.json` | NUNCA | Credenciales GCP (usar ADC) |
| `firebase-adminsdk*.json` | NUNCA | Credenciales Firebase Admin |

---

## Pendientes del MVP

- [ ] Deploy backend → Cloud Run (`us-west1`)
- [ ] Deploy frontend → Firebase Hosting
- [ ] Deplegar índices Firestore: `firebase deploy --only firestore:indexes`
- [ ] Activar reglas Firestore de producción: `firebase deploy --only firestore:rules`
- [x] Integrar Google Maps (autocomplete de dirección en locales y mapa de turnos en marketplace)
- [ ] Configurar SendGrid (`EMAIL_PROVIDER=sendgrid`)
- [ ] Configurar dominio personalizado
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Tests unitarios y de integración

---

## Documentación adicional

| Documento | Descripción |
|---|---|
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Arquitectura completa del sistema |
| [`docs/DATA_MODEL.md`](docs/DATA_MODEL.md) | Modelo de datos Firestore detallado |
| [`docs/FIREBASE_SETUP.md`](docs/FIREBASE_SETUP.md) | Configuración Firebase paso a paso |
| [`docs/GCP_DEPLOYMENT.md`](docs/GCP_DEPLOYMENT.md) | Despliegue en GCP / Cloud Run |
| [`docs/LOCAL_RUNBOOK.md`](docs/LOCAL_RUNBOOK.md) | Guía para levantar en local |
| [`docs/SECURITY_RULES.md`](docs/SECURITY_RULES.md) | Reglas de seguridad Firestore |
| [`docs/TECHNICAL_SPEC.md`](docs/TECHNICAL_SPEC.md) | Especificación técnica original |
