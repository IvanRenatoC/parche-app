# Despliegue GCP — Parche

## Proyecto

- **Project ID:** ml-lab-ivan
- **Región:** us-west1
- **Servicios principales:** Cloud Run, Firebase Hosting, Firestore, Cloud Storage, Secret Manager

## 1. Prerrequisitos

```bash
# Autenticarse
gcloud auth login
gcloud config set project ml-lab-ivan
gcloud config set run/region us-west1

# Verificar proyecto activo
gcloud config get-value project
```

## 2. Habilitar APIs necesarias

```bash
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com \
  firestore.googleapis.com \
  firebase.googleapis.com \
  maps-backend.googleapis.com \
  places-backend.googleapis.com \
  geocoding-backend.googleapis.com \
  --project=ml-lab-ivan
```

## 3. Secret Manager — Secretos del backend

```bash
# Crear secreto para clave GCP general (nunca en frontend)
echo -n "TU_CLAVE_GCP_AQUI" | gcloud secrets create GCP_GENERAL_API_KEY \
  --data-file=- --project=ml-lab-ivan

# Crear secreto para SendGrid
echo -n "TU_SENDGRID_KEY" | gcloud secrets create SENDGRID_API_KEY \
  --data-file=- --project=ml-lab-ivan

# Ver secretos creados
gcloud secrets list --project=ml-lab-ivan

# Otorgar acceso al service account del backend
gcloud secrets add-iam-policy-binding GCP_GENERAL_API_KEY \
  --member="serviceAccount:parche-backend-sa@ml-lab-ivan.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

## 4. Build y deploy del backend (Cloud Run)

```bash
cd backend

# Build de la imagen Docker
gcloud builds submit \
  --tag gcr.io/ml-lab-ivan/parche-backend:latest \
  --project=ml-lab-ivan

# Deploy a Cloud Run
gcloud run deploy parche-backend \
  --image gcr.io/ml-lab-ivan/parche-backend:latest \
  --platform managed \
  --region us-west1 \
  --allow-unauthenticated \
  --set-env-vars APP_ENV=prod,GCP_PROJECT_ID=ml-lab-ivan,FIREBASE_PROJECT_ID=ml-lab-ivan,GCP_REGION=us-west1,EMAIL_PROVIDER=stub,FROM_EMAIL=no-reply@parche.app \
  --set-secrets GCP_GENERAL_API_KEY=GCP_GENERAL_API_KEY:latest,SENDGRID_API_KEY=SENDGRID_API_KEY:latest \
  --service-account parche-backend-sa@ml-lab-ivan.iam.gserviceaccount.com \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --project=ml-lab-ivan

# Ver URL del servicio desplegado
gcloud run services describe parche-backend \
  --region us-west1 --project=ml-lab-ivan \
  --format="value(status.url)"
```

## 5. Deploy del frontend (Firebase Hosting)

```bash
cd frontend
npm run build

cd ..
firebase deploy --only hosting --project=ml-lab-ivan
```

URLs resultantes:
- `https://ml-lab-ivan.web.app`
- `https://ml-lab-ivan.firebaseapp.com`

## 6. Dockerfile del backend

El archivo `backend/Dockerfile` está incluido en el proyecto.

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8080
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
```

## 7. CORS en producción

Actualizar `CORS_ALLOWED_ORIGINS` en Cloud Run:

```
https://ml-lab-ivan.web.app,https://ml-lab-ivan.firebaseapp.com
```

Si el backend tiene dominio propio, agregar también ese dominio.

## 8. Variables de entorno en Cloud Run (producción)

| Variable | Fuente | Descripción |
|---|---|---|
| APP_ENV | Env var | prod |
| GCP_PROJECT_ID | Env var | ml-lab-ivan |
| FIREBASE_PROJECT_ID | Env var | ml-lab-ivan |
| GCP_REGION | Env var | us-west1 |
| GCP_GENERAL_API_KEY | Secret Manager | Clave GCP con ~33 APIs |
| SENDGRID_API_KEY | Secret Manager | API key de SendGrid |
| GOOGLE_APPLICATION_CREDENTIALS | Service Account | Automático en Cloud Run |
| CORS_ALLOWED_ORIGINS | Env var | Dominios permitidos |
| EMAIL_PROVIDER | Env var | sendgrid o stub |
| FROM_EMAIL | Env var | no-reply@parche.app |

## 9. Monitoreo

```bash
# Ver logs de Cloud Run
gcloud run services logs read parche-backend \
  --region us-west1 --project=ml-lab-ivan --limit=50

# Ver métricas
gcloud run services describe parche-backend \
  --region us-west1 --project=ml-lab-ivan
```

## 10. Rollback

```bash
# Listar revisiones
gcloud run revisions list \
  --service parche-backend \
  --region us-west1 --project=ml-lab-ivan

# Rollback a revisión anterior
gcloud run services update-traffic parche-backend \
  --to-revisions REVISION-ID=100 \
  --region us-west1 --project=ml-lab-ivan
```
