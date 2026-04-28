# Configuración Firebase — Parche

## Proyecto

- **GCP Project ID:** ml-lab-ivan
- **Firebase Project ID:** ml-lab-ivan
- **Firebase App Name:** parche-app
- **Región Firestore:** us-west1 (o nam5 si no está disponible us-west1)

## 1. Firebase Auth

### Habilitar proveedores

1. Ir a Firebase Console → Authentication → Sign-in method
2. Habilitar: **Email/Password**
3. Habilitar: **Google** (configurar OAuth consent screen en GCP)
4. Habilitar recuperación de contraseña (viene por defecto con Email/Password)

### Verificación de email (recomendado para MVP)

Activar en Authentication → Templates → Email address verification

## 2. Firestore

### Crear base de datos

```bash
# Crear Firestore en modo nativo (no Datastore)
gcloud firestore databases create \
  --project=ml-lab-ivan \
  --location=us-west1 \
  --type=firestore-native
```

O desde Firebase Console → Firestore Database → Create database

### Colecciones requeridas

Las colecciones se crean automáticamente al escribir el primer documento:

```
users           # Perfiles base de todos los usuarios
owners          # Datos adicionales de owners
workers         # Datos adicionales de workers
businesses      # Locales registrados por owners
job_posts       # Publicaciones de trabajo
applications    # Postulaciones de workers
comments        # Comentarios en publicaciones
ratings         # Calificaciones
notifications   # Notificaciones internas
audit_logs      # Registro de auditoría
```

### Aplicar reglas de seguridad

```bash
cd firebase
firebase deploy --only firestore:rules --project=ml-lab-ivan
```

## 3. Cloud Storage for Firebase

### Habilitar Storage

1. Firebase Console → Storage → Get started
2. Seleccionar región (us-west1)
3. Aplicar reglas de seguridad (ver firebase/storage.rules)

### Estructura de paths

```
/profile_photos/{uid}/photo.jpg
/identity_documents/{uid}/document.jpg
/certificates/{uid}/{certificateId}.pdf
/business_documents/{ownerUid}/{businessId}/
/job_post_attachments/{jobPostId}/
```

### Aplicar reglas

```bash
firebase deploy --only storage --project=ml-lab-ivan
```

## 4. Firebase Hosting

### Configurar hosting

```bash
firebase use ml-lab-ivan
firebase deploy --only hosting --project=ml-lab-ivan
```

### Build antes de deploy

```bash
cd frontend
npm run build
# Output en frontend/dist/
```

El archivo `firebase/firebase.json` apunta a `frontend/dist` como directorio público.

## 5. Variables de entorno del frontend

Obtener de Firebase Console → Project Settings → Your apps → Web app:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=ml-lab-ivan.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=ml-lab-ivan
VITE_FIREBASE_STORAGE_BUCKET=ml-lab-ivan.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

## 6. Service Account para el backend

1. GCP Console → IAM → Service Accounts → Create
2. Nombre sugerido: `parche-backend-sa`
3. Roles mínimos requeridos:
   - Firebase Admin SDK Administrator Service Agent
   - Cloud Datastore User (o Firebase Rules System)
   - Storage Object Admin (para archivos)
4. Descargar JSON de credenciales
5. Guardar como `backend/service-account.json` (NO commitear)
6. Configurar: `GOOGLE_APPLICATION_CREDENTIALS=/ruta/absoluta/service-account.json`

## 7. Comandos de verificación

```bash
# Ver proyecto activo
firebase projects:list

# Ver apps registradas
firebase apps:list --project=ml-lab-ivan

# Ver config de hosting
firebase hosting:channel:list --project=ml-lab-ivan

# Emuladores locales (opcional para desarrollo)
firebase emulators:start --only auth,firestore,storage --project=ml-lab-ivan
```
