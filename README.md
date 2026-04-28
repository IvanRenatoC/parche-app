# Parche

Plataforma web que conecta owners de restaurantes, bares, restobares, discotecas, tiendas y convenience stores con workers disponibles para cubrir turnos temporales.

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Backend | FastAPI + Python 3.11 |
| Auth | Firebase Auth |
| Base de datos | Firestore |
| Storage | Cloud Storage for Firebase |
| Hosting frontend | Firebase Hosting |
| Backend deploy | Cloud Run (GCP us-west1) |
| Mapas | Google Maps Platform (Maps JS API, Places API, Geocoding API) |

## Proyecto GCP / Firebase

```
GCP_PROJECT_ID=ml-lab-ivan
FIREBASE_PROJECT_ID=ml-lab-ivan
GCP_REGION=us-west1
APP_ENV=dev
```

## Estructura del repositorio

```
parche-app/
├── frontend/          # React + TypeScript + Vite
├── backend/           # FastAPI + Python
├── firebase/          # Reglas Firestore, Storage y firebase.json
├── docs/              # Documentación técnica
├── .gitignore
├── README.md
└── MANUAL_INSTRUCCIONES_PARCHE.md
```

## Cómo correr el frontend

```bash
cd frontend
cp .env.example .env.local
# Editar .env.local con tus credenciales reales
npm install
npm run dev
# Disponible en http://localhost:5173
```

## Cómo correr el backend

```bash
cd backend
cp .env.example .env
# Editar .env con tus credenciales reales
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
# API disponible en http://localhost:8000
# Docs en http://localhost:8000/docs
```

## Variables de entorno

### Frontend (frontend/.env.local)

```env
VITE_APP_ENV=dev
VITE_API_BASE_URL=http://localhost:8000
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=ml-lab-ivan.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=ml-lab-ivan
VITE_FIREBASE_STORAGE_BUCKET=ml-lab-ivan.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_GOOGLE_MAPS_BROWSER_API_KEY=
```

### Backend (backend/.env)

```env
APP_ENV=dev
GCP_PROJECT_ID=ml-lab-ivan
FIREBASE_PROJECT_ID=ml-lab-ivan
GCP_REGION=us-west1
GCP_GENERAL_API_KEY=            # Solo backend/Secret Manager, NUNCA frontend
GOOGLE_APPLICATION_CREDENTIALS= # Ruta al service account JSON
CORS_ALLOWED_ORIGINS=http://localhost:5173,https://ml-lab-ivan.web.app,https://ml-lab-ivan.firebaseapp.com
EMAIL_PROVIDER=stub
SENDGRID_API_KEY=
FROM_EMAIL=no-reply@parche.app
```

> **Seguridad:** `GCP_GENERAL_API_KEY` es una clave con acceso a ~33 APIs GCP. Nunca debe ir en frontend ni con prefijo `VITE_`.

## Checklist local antes de empezar

```
[ ] Firebase project ml-lab-ivan existe
[ ] Firebase Auth habilitado (Email/Password + Google)
[ ] Firestore creado
[ ] Cloud Storage habilitado
[ ] API Key restringida creada para Google Maps (solo Maps JS, Places, Geocoding)
[ ] API Key de Maps restringida por dominio HTTP referrer
[ ] .env.local creado (NO versionado)
[ ] Service account JSON descargado (NO versionado)
[ ] backend/.env creado (NO versionado)
```

## Documentación

- [Especificación técnica](docs/TECHNICAL_SPEC.md)
- [Configuración Firebase](docs/FIREBASE_SETUP.md)
- [Despliegue GCP](docs/GCP_DEPLOYMENT.md)
- [Modelo de datos](docs/DATA_MODEL.md)
- [Reglas de seguridad](docs/SECURITY_RULES.md)
- [Reporte de trabajo nocturno](docs/OVERNIGHT_WORK_REPORT.md)

## Roles

- **Owner**: dueño o administrador de un local. Publica necesidades de personal, revisa postulantes, acepta workers.
- **Worker**: persona que busca turnos temporales. Ve publicaciones, filtra, comenta y postula.

## Flujo crítico: aceptación de worker

Cuando el owner acepta un worker postulante:
1. La postulación seleccionada pasa a `accepted`
2. El contador `accepted_workers_count` se incrementa
3. Si se completan los cupos, la publicación pasa a `filled`
4. Las demás postulaciones activas pasan a `not_selected`
5. Se crea notificación interna para cada no seleccionado
6. Si el proveedor de email está activo, se envía correo automático
7. Se registra el evento en `audit_logs`
