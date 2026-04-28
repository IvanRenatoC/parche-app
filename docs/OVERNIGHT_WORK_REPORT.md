# Reporte de Trabajo Nocturno — Parche MVP

Fecha: 2026-04-28  
Branch: `feat/initial-parche-mvp`  
Duración estimada: sesión completa de noche

---

## Qué se hizo

### 1. Inicialización del repositorio
- `git init` + rama `feat/initial-parche-mvp`
- `.gitignore` completo (excluye `.env`, secretos, `node_modules`, `dist`, `.venv`)

### 2. Documentación técnica (docs/)
- `README.md`: descripción del producto, stack, instrucciones de ejecución, variables de entorno, checklist
- `docs/TECHNICAL_SPEC.md`: roles, pantallas, reglas de negocio, flujo crítico de aceptación, estados
- `docs/FIREBASE_SETUP.md`: Auth, Firestore, Storage, Hosting, Service Account
- `docs/GCP_DEPLOYMENT.md`: Cloud Run, Secret Manager, comandos de deploy
- `docs/DATA_MODEL.md`: 10 colecciones Firestore con campos, tipos, estados y relaciones
- `docs/SECURITY_RULES.md`: reglas por rol, principios, API keys policy
- `docs/OVERNIGHT_WORK_REPORT.md`: este archivo

### 3. Configuración Firebase (firebase/)
- `firebase/firebase.json`: hosting (→ frontend/dist), Firestore, Storage
- `firebase/firestore.rules`: reglas restrictivas por rol (owner/worker/backend)
- `firebase/storage.rules`: paths protegidos por UID, tipos de archivo, tamaños máximos
- `firebase/firestore.indexes.json`: 7 índices compuestos para queries optimizadas

### 4. Frontend — React + TypeScript + Vite
Scaffolded con `npm create vite@latest` + dependencias completas.

**Estructura:**
```
frontend/src/
├── types/index.ts          # Todos los tipos TypeScript del dominio
├── lib/firebase.ts         # Firebase client config
├── lib/api.ts              # Cliente HTTP con auth token automático
├── contexts/AuthContext.tsx # Auth state + hooks (signIn, signUp, Google, reset)
├── components/
│   ├── ui/Button.tsx       # Button con variantes (primary/secondary/outline/ghost/danger)
│   ├── ui/Input.tsx        # Input + Select + Textarea
│   ├── ui/Card.tsx         # Card + Badge + Spinner
│   ├── layout/Layout.tsx   # Layout + AuthLayout
│   ├── layout/Navbar.tsx   # Navbar responsive con menu de usuario
│   ├── ProtectedRoute.tsx  # Guard con loading y redirect
│   └── marketplace/
│       ├── CreateJobPostModal.tsx  # Modal crear publicación
│       └── JobPostDetailModal.tsx  # Modal detalle + acciones owner/worker
├── pages/
│   ├── LoginPage.tsx         # Login email+password + Google
│   ├── RegisterPage.tsx      # Registro owner/worker (selector + formularios)
│   ├── ForgotPasswordPage.tsx # Recuperación de contraseña
│   ├── MarketplacePage.tsx    # Marketplace con filtros y cards
│   ├── ProfilePage.tsx        # Perfil + historial por rol
│   └── NotificationsPage.tsx  # Notificaciones con mark as read
├── services/
│   ├── jobPosts.ts           # Firestore: CRUD job posts + applications
│   └── notifications.ts      # Firestore: read + mark read
└── App.tsx                   # BrowserRouter + rutas + AuthProvider
```

**Paleta Parche:**
- Rosa/Magenta `#ad4b7e` — color principal
- Negro `#000000` — botones, enlaces
- Gris claro `#f2f3f5` — superficies, cards
- Verde `#22C55E` — éxito
- Amber `#F59E0B` — alertas

**Build:** ✅ 0 errores TypeScript, build exitoso en Vite.

### 5. Backend — FastAPI + Python 3.11

**Estructura:**
```
backend/app/
├── main.py              # FastAPI app + CORS + routers + /health
├── config.py            # Settings vía pydantic-settings (.env)
├── firebase/client.py   # Firebase Admin SDK (cert + ADC)
├── auth/dependencies.py # verify_id_token + require_owner/worker
├── schemas/schemas.py   # Pydantic v2 schemas
├── routes/
│   ├── users.py         # GET /me, POST /profiles/owner|worker
│   ├── businesses.py    # GET/POST /businesses
│   ├── job_posts.py     # CRUD + apply + close + applications list
│   ├── applications.py  # withdraw + accept (flujo crítico)
│   └── notifications.py # list + mark read
└── services/
    ├── application_service.py  # Flujo completo de aceptación
    └── email_service.py        # Stub + SendGrid adapter
```

**Endpoints disponibles:**
```
GET  /health
GET  /
GET  /users/me
POST /users/profiles/owner
POST /users/profiles/worker
GET  /businesses
POST /businesses
GET  /job-posts
POST /job-posts
PATCH /job-posts/{id}
POST /job-posts/{id}/close
GET  /job-posts/{id}/applications
POST /job-posts/{id}/applications
POST /applications/{id}/withdraw
POST /applications/{id}/accept        ← Flujo crítico
GET  /notifications
POST /notifications/{id}/read
```

**Flujo crítico implementado** (`accept_application`):
1. ✅ Valida que el actor sea el owner de la publicación
2. ✅ Valida que la publicación esté en estado `published`
3. ✅ Valida que la postulación esté en estado `applied`
4. ✅ Detecta choque de horario con otras aceptaciones del worker
5. ✅ Cambia postulación a `accepted`
6. ✅ Incrementa `accepted_workers_count`
7. ✅ Si cupos completos, cambia publicación a `filled`
8. ✅ Marca restantes `applied` como `not_selected`
9. ✅ Crea notificación interna para cada no seleccionado
10. ✅ Envía email vía SendGrid si `EMAIL_PROVIDER=sendgrid`, o loga stub
11. ✅ Registra evento en `audit_logs`

**Verificación:** `python -c "from app.main import app"` → OK.

---

## Archivos creados

```
.gitignore
README.md
MANUAL_INSTRUCCIONES_PARCHE.md  (existía, no modificado)
docs/TECHNICAL_SPEC.md
docs/FIREBASE_SETUP.md
docs/GCP_DEPLOYMENT.md
docs/DATA_MODEL.md
docs/SECURITY_RULES.md
docs/OVERNIGHT_WORK_REPORT.md
firebase/firebase.json
firebase/firestore.rules
firebase/storage.rules
firebase/firestore.indexes.json
frontend/.env.example
frontend/package.json (+ dependencias)
frontend/src/App.tsx
frontend/src/index.css
frontend/src/types/index.ts
frontend/src/lib/firebase.ts
frontend/src/lib/api.ts
frontend/src/contexts/AuthContext.tsx
frontend/src/components/ui/Button.tsx
frontend/src/components/ui/Card.tsx
frontend/src/components/ui/Input.tsx
frontend/src/components/layout/Layout.tsx
frontend/src/components/layout/Navbar.tsx
frontend/src/components/ProtectedRoute.tsx
frontend/src/components/marketplace/CreateJobPostModal.tsx
frontend/src/components/marketplace/JobPostDetailModal.tsx
frontend/src/pages/LoginPage.tsx
frontend/src/pages/RegisterPage.tsx
frontend/src/pages/ForgotPasswordPage.tsx
frontend/src/pages/MarketplacePage.tsx
frontend/src/pages/ProfilePage.tsx
frontend/src/pages/NotificationsPage.tsx
frontend/src/services/jobPosts.ts
frontend/src/services/notifications.ts
backend/.env.example
backend/.gitignore
backend/.dockerignore
backend/Dockerfile
backend/requirements.txt
backend/app/__init__.py
backend/app/main.py
backend/app/config.py
backend/app/firebase/__init__.py
backend/app/firebase/client.py
backend/app/auth/__init__.py
backend/app/auth/dependencies.py
backend/app/schemas/__init__.py
backend/app/schemas/schemas.py
backend/app/models/__init__.py
backend/app/routes/__init__.py
backend/app/routes/users.py
backend/app/routes/businesses.py
backend/app/routes/job_posts.py
backend/app/routes/applications.py
backend/app/routes/notifications.py
backend/app/services/__init__.py
backend/app/services/application_service.py
backend/app/services/email_service.py
```

---

## Commits realizados

```
c51cd7d docs: add Parche technical specification and Firebase configuration
bd79e2b feat(frontend): scaffold Parche web app with React + TypeScript + Vite
e1aa926 feat(backend): scaffold FastAPI services with critical acceptance flow
```

---

## Qué quedó funcionando

- [x] Git repo inicializado con rama `feat/initial-parche-mvp`
- [x] Frontend compila sin errores TypeScript (`npm run build` ✅)
- [x] Backend importa sin errores (`from app.main import app` ✅)
- [x] Todas las dependencias frontend instaladas (Firebase SDK, React Router, RHF, Zod, Lucide)
- [x] Backend instalado con Python 3.11 venv
- [x] Firebase Auth integrado (email/password + Google OAuth preparado)
- [x] Firestore services para job_posts, applications, notifications
- [x] Flujo crítico de aceptación 100% implementado en backend
- [x] Reglas Firestore restrictivas (no abierto en modo test)
- [x] Reglas Storage por path y UID
- [x] Email adapter (stub por defecto, SendGrid listo)
- [x] Audit logs en todas las acciones críticas
- [x] CORS configurado
- [x] Documentación técnica completa
- [x] Variables de entorno en `.env.example` (sin secretos)
- [x] `.gitignore` protege secretos y artefactos

---

## Qué quedó pendiente (para mañana)

### Alta prioridad
1. **Credenciales Firebase**: copiar `frontend/.env.example` → `frontend/.env.local` y completar con valores reales del proyecto `ml-lab-ivan`
2. **Service Account**: descargar JSON de GCP, guardarlo en `backend/` (NO en git), configurar `GOOGLE_APPLICATION_CREDENTIALS`
3. **Probar flujo completo**: crear cuenta → publicar → postular → aceptar
4. **Verificar en navegador**: `npm run dev` en frontend

### Media prioridad
5. **Google Maps**: agregar `VITE_GOOGLE_MAPS_BROWSER_API_KEY` y activar `@react-google-maps/api` o `use-places-autocomplete` para el autocomplete de dirección en registro de local
6. **Subida de archivos**: implementar upload a Cloud Storage para foto de perfil, carnet, certificados
7. **Comentarios**: implementar vista de comentarios en publicaciones
8. **Calificaciones**: implementar flujo de rating post-turno
9. **Tests**: agregar pytest para el servicio de aceptación (el más crítico)
10. **Emuladores Firebase**: `firebase emulators:start` para desarrollo local sin credenciales reales

### Baja prioridad
11. **Email real**: cambiar `EMAIL_PROVIDER=sendgrid` y agregar `SENDGRID_API_KEY`
12. **Deploy Cloud Run**: `gcloud run deploy parche-backend` (ver docs/GCP_DEPLOYMENT.md)
13. **Deploy Firebase Hosting**: `firebase deploy --only hosting`
14. **Estado `expired`**: job post cron que marque publicaciones vencidas automáticamente
15. **Code splitting**: el bundle de frontend (747kb) puede optimizarse con lazy loading

---

## Errores encontrados y resueltos

1. **Zod v4 + @hookform/resolvers v5**: `z.coerce.number()` retorna `unknown` en el tipo inferido → solución: usar `z.string()` para campos numéricos y convertir en `onSubmit`. Tipar `onSubmit` explícitamente como `SubmitHandler<FormData>`.
2. **Python 3.14**: `pydantic-core` no tiene wheels precompilados → solución: usar Python 3.11 (`/opt/homebrew/bin/python3.11`).
3. **Import dinámico con firebase.ts**: warning de Vite sobre dynamic import → no es un error, firebase se importa estáticamente en la mayoría de módulos.
4. **Imports no usados TypeScript**: `LayoutDashboard`, `useNavigate`, `Textarea` → eliminados.

---

## Cómo correr el proyecto mañana

### Frontend
```bash
cd frontend
cp .env.example .env.local
# Completar .env.local con valores reales de Firebase Console
# (Firebase Console → Project Settings → Your apps → Web app config)
npm install
npm run dev
# → http://localhost:5173
```

### Backend
```bash
cd backend
cp .env.example .env
# Editar .env: agregar GOOGLE_APPLICATION_CREDENTIALS con ruta al service-account.json
/opt/homebrew/bin/python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
# → http://localhost:8000
# → http://localhost:8000/docs  (Swagger UI)
```

### Verificación rápida
```bash
# Health check backend
curl http://localhost:8000/health
# → {"status":"ok","app":"parche-api","env":"dev","project":"ml-lab-ivan"}

# Frontend en browser
# → http://localhost:5173
# → /login → crear cuenta → /marketplace
```

---

## Próximos pasos recomendados

1. Completar `.env.local` con credenciales reales de Firebase → probar login completo
2. Probar flujo owner: crear cuenta → agregar local → publicar turno
3. Probar flujo worker: crear cuenta → ver marketplace → postular
4. Probar flujo de aceptación via backend API (Swagger en /docs)
5. Configurar emuladores Firebase para desarrollo sin credenciales de producción
6. Agregar Google Maps Places Autocomplete en registro de local (necesita `VITE_GOOGLE_MAPS_BROWSER_API_KEY` restringida)
7. Implementar upload de archivos a Cloud Storage (foto perfil, carnet, certificados)
8. Push al remote GitHub cuando esté todo validado

---

*Generado automáticamente al finalizar la sesión de trabajo nocturno.*
