# Parche

Plataforma web que conecta dueños de restaurantes, bares, discotecas, tiendas y convenience stores con workers disponibles para cubrir **turnos temporales**.

- **Owner**: publica necesidades de personal, revisa postulantes y acepta workers.
- **Worker**: busca turnos, filtra por región/ocupación y postula.

---

## Estado actual del MVP

| Área | Estado |
|---|---|
| Backend FastAPI | Scaffolded — rutas implementadas, sin deploy |
| Frontend React | Scaffolded — páginas implementadas, sin deploy |
| Firebase Auth | Configurado en proyecto GCP, sin activar email/password todavía |
| Firestore | Configurado, sin datos de prueba |
| Cloud Run | No desplegado |
| Firebase Hosting | No desplegado |

---

## Stack técnico

| Capa | Tecnología |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Backend | FastAPI + Python 3.11 |
| Auth | Firebase Auth (Email/Password + Google) |
| Base de datos | Firestore |
| Storage | Cloud Storage for Firebase |
| Hosting frontend | Firebase Hosting (pendiente) |
| Backend deploy | Cloud Run — GCP `us-west1` (pendiente) |
| Mapas | Google Maps Platform (Maps JS API, Places API, Geocoding API) — pendiente |

---

## Arquitectura local

```
Browser (localhost:5173)
    ↓  HTTP REST
FastAPI (localhost:8000)
    ↓  Firebase Admin SDK (ADC)
Firestore / Firebase Auth
    ↑  en proyecto GCP: ml-lab-ivan
```

El frontend se comunica con el backend vía `VITE_API_BASE_URL=http://localhost:8000`.  
El backend usa **Application Default Credentials (ADC)** — no se necesita service account JSON en local.

---

## Estructura del repositorio

```
parche-app/
├── frontend/                   # React + TypeScript + Vite
│   ├── src/
│   │   ├── components/         # Layout, UI, marketplace modals
│   │   ├── contexts/           # AuthContext (Firebase Auth)
│   │   ├── lib/                # firebase.ts, api.ts
│   │   ├── pages/              # Login, Register, Marketplace, Profile, Notifications
│   │   ├── services/           # jobPosts.ts, notifications.ts
│   │   └── types/              # index.ts
│   ├── .env.example
│   └── package.json
├── backend/                    # FastAPI + Python 3.11
│   ├── app/
│   │   ├── auth/               # Firebase token verification
│   │   ├── firebase/           # Firestore client
│   │   ├── routes/             # users, businesses, job_posts, applications, notifications
│   │   ├── schemas/            # Pydantic models
│   │   ├── services/           # application_service, email_service
│   │   ├── config.py           # Settings con pydantic-settings
│   │   └── main.py             # FastAPI app + CORS + health endpoint
│   ├── .env.example
│   ├── Dockerfile
│   └── requirements.txt
├── firebase/
│   ├── firebase.json           # Firebase project config
│   ├── firestore.rules         # Reglas de seguridad Firestore
│   ├── firestore.indexes.json  # Índices Firestore
│   └── storage.rules           # Reglas Cloud Storage
├── docs/                       # Documentación técnica
├── README.md
└── MANUAL_INSTRUCCIONES_PARCHE.md
```

---

## Requisitos previos

- **Node.js** ≥ 18 y npm
- **Python 3.11** (`python3.11 --version`)
- **gcloud CLI** autenticado: `gcloud auth list`
- Acceso al proyecto GCP `ml-lab-ivan`

Verificación rápida:

```bash
node --version       # ≥ 18
python3.11 --version # 3.11.x
gcloud auth list     # debe mostrar tu cuenta activa
gcloud config get-value project  # debe mostrar ml-lab-ivan
```

---

## Configuración Firebase

### Proyecto GCP / Firebase

```
GCP_PROJECT_ID=ml-lab-ivan
FIREBASE_PROJECT_ID=ml-lab-ivan
GCP_REGION=us-west1
```

### App web Firebase (parche-app)

La configuración de la web app está en `frontend/.env.local`. Si no existe, créalo — ver sección [Variables de entorno](#variables-de-entorno).

Los valores de `VITE_FIREBASE_*` se obtienen desde:
- **Firebase Console** → Project settings → General → "Your apps" → parche-app → SDK setup
- O vía CLI: `firebase apps:sdkconfig WEB 1:883824982066:web:ac13a7d83e79812d84242b --project=ml-lab-ivan`

### Firebase Auth — activar en consola

Para que el registro y login funcionen debes habilitar en [Firebase Console → Authentication → Sign-in method](https://console.firebase.google.com/project/ml-lab-ivan/authentication/providers):

- [x] Email/Password
- [ ] Google (opcional para MVP)

---

## Configuración GCP local (ADC)

El backend usa **Application Default Credentials** — no necesita service account JSON en local.

Verifica que ADC esté activo:

```bash
gcloud auth application-default print-access-token
```

Si falla, ejecuta:

```bash
gcloud auth application-default login
gcloud config set project ml-lab-ivan
```

No necesitas `GOOGLE_APPLICATION_CREDENTIALS` en local si ADC está configurado.

---

## Variables de entorno

### frontend/.env.local

Crea este archivo (no se versiona en git):

```env
VITE_APP_ENV=dev
VITE_API_BASE_URL=http://localhost:8000
VITE_FIREBASE_API_KEY=<desde Firebase Console>
VITE_FIREBASE_AUTH_DOMAIN=ml-lab-ivan.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=ml-lab-ivan
VITE_FIREBASE_STORAGE_BUCKET=ml-lab-ivan.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=<desde Firebase Console>
VITE_FIREBASE_APP_ID=<desde Firebase Console>
VITE_GOOGLE_MAPS_BROWSER_API_KEY=
```

### backend/.env

Crea este archivo (no se versiona en git):

```env
APP_ENV=dev
GCP_PROJECT_ID=ml-lab-ivan
FIREBASE_PROJECT_ID=ml-lab-ivan
GCP_REGION=us-west1
CORS_ALLOWED_ORIGINS=http://localhost:5173
EMAIL_PROVIDER=stub
FROM_EMAIL=no-reply@parche.app
# GOOGLE_APPLICATION_CREDENTIALS=  # No necesario si ADC está activo
```

> **Seguridad:** Nunca agregues `GCP_GENERAL_API_KEY` a `frontend/.env.local` ni uses prefijo `VITE_` en claves de servidor.

---

## Cómo levantar el frontend

```bash
cd frontend
# Primera vez: instalar dependencias
npm install
# Levantar dev server
npm run dev
```

Disponible en: **http://localhost:5173**

---

## Cómo levantar el backend

```bash
cd backend
# Primera vez: crear venv con Python 3.11
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
# Levantar servidor con hot-reload
uvicorn app.main:app --reload --port 8000
```

---

## URLs locales

| Servicio | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend health | http://localhost:8000/health |
| Swagger UI | http://localhost:8000/docs |
| ReDoc | http://localhost:8000/redoc |
| Backend root | http://localhost:8000/ |

---

## Flujo de prueba recomendado

1. Abrir **http://localhost:5173** — debe cargar sin pantalla blanca
2. Ir a `/login` — debe mostrar formulario
3. Ir a `/register` — debe mostrar formulario de registro
4. Registrar un usuario nuevo (requiere Firebase Auth habilitado)
5. Verificar **http://localhost:8000/health** → `{"status":"ok",...}`
6. Explorar **http://localhost:8000/docs** → Swagger interactivo con todos los endpoints

---

## Qué está implementado

### Backend (FastAPI)

- `GET /health` — health check
- `GET/POST /users` — creación y perfil de usuario
- `GET/POST /businesses` — perfil de local/negocio
- `GET/POST/PATCH /job-posts` — publicaciones de turnos
- `POST /job-posts/{id}/close` — cerrar publicación
- `GET/POST /job-posts/{id}/applications` — postulaciones por publicación
- `POST /applications/{id}/accept` — **flujo crítico de aceptación** con notificaciones y audit log
- `POST /applications/{id}/withdraw` — retiro de postulación
- `GET /notifications` — bandeja de notificaciones

### Frontend (React)

- Páginas: Login, Register, ForgotPassword, Marketplace, Profile, Notifications
- Componentes: Navbar, Layout, ProtectedRoute, JobPostDetailModal, CreateJobPostModal
- Firebase Auth context (AuthContext)
- Cliente HTTP (`api.ts`) conectado a backend local

---

## Qué está pendiente

- [ ] Activar Firebase Auth Email/Password en consola
- [ ] Crear usuario de prueba (owner + worker)
- [ ] Deploy backend a Cloud Run
- [ ] Deploy frontend a Firebase Hosting
- [ ] Integrar Google Maps en formulario de publicación
- [ ] Configurar SendGrid para emails reales (`EMAIL_PROVIDER=sendgrid`)
- [ ] Reglas Firestore en producción (actualmente en modo test)
- [ ] Índices Firestore (ver `firebase/firestore.indexes.json`)
- [ ] CI/CD pipeline

---

## Seguridad y secretos

| Archivo | ¿Se versiona? | Descripción |
|---|---|---|
| `frontend/.env.local` | NO | Firebase web config + API keys frontend |
| `backend/.env` | NO | Config backend local |
| `service-account.json` | NUNCA | Credenciales GCP (usar ADC en su lugar) |
| `firebase-adminsdk*.json` | NUNCA | Credenciales admin Firebase |

El `.gitignore` ya excluye estos archivos. No los commitees.

---

## Problemas frecuentes

**Backend no arranca:**
```bash
# Verificar Python 3.11
python3.11 --version
# Verificar venv activo
which python  # debe apuntar a .venv/bin/python
# Verificar import
python -c "from app.main import app; print('OK')"
```

**Frontend pantalla blanca:**
- Verificar que `frontend/.env.local` existe y tiene los valores de Firebase correctos
- Abrir DevTools → Console → buscar errores de Firebase initialization

**ADC no funciona:**
```bash
gcloud auth application-default login
gcloud config set project ml-lab-ivan
```

**Firebase Auth: "auth/configuration-not-found":**
- Ir a Firebase Console → Authentication → Sign-in method → habilitar Email/Password

---

## Próximos pasos

1. Habilitar Firebase Auth Email/Password en consola
2. Crear un usuario owner y un usuario worker de prueba
3. Probar flujo completo: crear publicación → postular → aceptar
4. Deploy a Cloud Run + Firebase Hosting
5. Configurar dominio personalizado

---

## Documentación

- [Especificación técnica](docs/TECHNICAL_SPEC.md)
- [Configuración Firebase](docs/FIREBASE_SETUP.md)
- [Despliegue GCP](docs/GCP_DEPLOYMENT.md)
- [Modelo de datos](docs/DATA_MODEL.md)
- [Reglas de seguridad](docs/SECURITY_RULES.md)
- [Runbook local](docs/LOCAL_RUNBOOK.md)
