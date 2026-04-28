# Runbook local — Parche

Guía paso a paso para levantar Parche en tu máquina. Ejecuta cada paso en orden.

---

## 1. Abrir la carpeta correcta

```bash
cd /Users/ivanrenatoc/Desktop/Proyectos-profesionales/Repos-GitHub/parche-app
pwd    # debe mostrar la ruta de arriba
git status   # debe mostrar "nothing to commit"
```

---

## 2. Verificar ADC (Application Default Credentials)

El backend necesita acceso a GCP. Verifica que ADC esté activo:

```bash
gcloud auth list
gcloud config get-value project   # debe mostrar: ml-lab-ivan
gcloud auth application-default print-access-token   # debe retornar un token
```

Si falla el último comando:

```bash
gcloud auth application-default login
gcloud config set project ml-lab-ivan
```

---

## 3. Crear frontend/.env.local

Si no existe:

```bash
cp frontend/.env.example frontend/.env.local
```

Edita `frontend/.env.local` con los valores reales de Firebase (parche-app):

```env
VITE_APP_ENV=dev
VITE_API_BASE_URL=http://localhost:8000
VITE_FIREBASE_API_KEY=<ver Firebase Console>
VITE_FIREBASE_AUTH_DOMAIN=ml-lab-ivan.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=ml-lab-ivan
VITE_FIREBASE_STORAGE_BUCKET=ml-lab-ivan.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=<ver Firebase Console>
VITE_FIREBASE_APP_ID=<ver Firebase Console>
VITE_GOOGLE_MAPS_BROWSER_API_KEY=
```

Los valores están en: Firebase Console → ml-lab-ivan → Project settings → "Your apps" → parche-app → Config

---

## 4. Crear backend/.env

Si no existe:

```bash
cp backend/.env.example backend/.env
```

Contenido mínimo para desarrollo local:

```env
APP_ENV=dev
GCP_PROJECT_ID=ml-lab-ivan
FIREBASE_PROJECT_ID=ml-lab-ivan
GCP_REGION=us-west1
CORS_ALLOWED_ORIGINS=http://localhost:5173
EMAIL_PROVIDER=stub
FROM_EMAIL=no-reply@parche.app
```

No necesitas `GOOGLE_APPLICATION_CREDENTIALS` si ADC está activo (paso 2).

---

## 5. Instalar dependencias (primera vez)

### Frontend

```bash
cd frontend
npm install
cd ..
```

### Backend

```bash
cd backend
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cd ..
```

Verifica el venv:

```bash
cd backend && source .venv/bin/activate
python -c "from app.main import app; print('Backend import OK')"
cd ..
```

---

## 6. Levantar el backend

**Abre una terminal nueva** y ejecuta:

```bash
cd /Users/ivanrenatoc/Desktop/Proyectos-profesionales/Repos-GitHub/parche-app/backend
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

Debes ver:
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Application startup complete.
```

Verifica:

```bash
curl http://localhost:8000/health
# Esperado: {"status":"ok","app":"parche-api","env":"dev","project":"ml-lab-ivan"}
```

---

## 7. Levantar el frontend

**Abre otra terminal** y ejecuta:

```bash
cd /Users/ivanrenatoc/Desktop/Proyectos-profesionales/Repos-GitHub/parche-app/frontend
npm run dev
```

Debes ver:
```
  VITE v8.x.x  ready in Xms
  ➜  Local:   http://localhost:5173/
```

---

## 8. URLs a visitar

| Qué | URL |
|---|---|
| App web (frontend) | http://localhost:5173 |
| Health check backend | http://localhost:8000/health |
| Swagger (API docs) | http://localhost:8000/docs |
| ReDoc | http://localhost:8000/redoc |

---

## 9. Primer flujo a probar

1. Abrir **http://localhost:5173** — no debe haber pantalla blanca
2. Ir a **http://localhost:5173/register** — registrar un usuario nuevo
3. Ir a **http://localhost:5173/login** — iniciar sesión
4. Ir a **http://localhost:8000/health** — verificar que el backend responde
5. Ir a **http://localhost:8000/docs** — explorar todos los endpoints disponibles

> **Requisito para Auth:** Firebase Auth Email/Password debe estar habilitado en
> [Firebase Console → Authentication → Sign-in method](https://console.firebase.google.com/project/ml-lab-ivan/authentication/providers)

---

## 10. Si algo falla

### Frontend pantalla blanca

```bash
# Verificar que .env.local existe y tiene valores
cat frontend/.env.local | grep VITE_FIREBASE
# Abrir DevTools → Console en el browser para ver el error exacto
```

### Backend no arranca

```bash
cd backend
source .venv/bin/activate
# Verificar import
python -c "from app.main import app; print('OK')"
# Ver si falta alguna dependencia
pip install -r requirements.txt
```

### Error de CORS

Verificar que `CORS_ALLOWED_ORIGINS=http://localhost:5173` está en `backend/.env`.

### ADC / Firebase Admin error

```bash
gcloud auth application-default login
gcloud config set project ml-lab-ivan
```

### Puerto ya en uso

```bash
# Ver qué proceso usa el puerto
lsof -ti:8000   # backend
lsof -ti:5173   # frontend
# Matarlo si es necesario
kill $(lsof -ti:8000)
```
