# Manual de instrucciones — Parche App

Repositorio: <https://github.com/IvanRenatoC/parche-app>  
Nombre de carpeta local recomendado: `parche-app`  
Nombre del producto: **Parche**  
Nombre app Firebase: **parche-app**

---

## 1. Objetivo del proyecto

Construir una aplicación web llamada **Parche**, orientada a conectar negocios que necesitan cubrir turnos temporales con trabajadores disponibles.

La aplicación debe permitir que owners de restaurantes, bares, restobares, discotecas, tiendas, convenience stores u otros locales publiquen necesidades de personal por un tiempo específico y limitado. Los workers podrán ver las publicaciones, filtrarlas, comentar y postular.

El match ocurre cuando el owner acepta a uno o más workers postulantes.

Cuando el owner acepta a un worker, el sistema debe cambiar automáticamente el estado de los demás postulantes de esa publicación a `rejected` o `not_selected` y enviarles un mensaje automático informando que no fueron seleccionados para esa vacante.

---

## 2. Contexto técnico definido

### 2.1 Proyecto GCP / Firebase

```env
GCP_PROJECT_ID=ml-lab-ivan
FIREBASE_PROJECT_ID=ml-lab-ivan
GCP_REGION=us-west1
APP_ENV=dev
PRODUCT_NAME=Parche
FIREBASE_APP_NAME=parche-app
```

### 2.2 Stack recomendado

```txt
Frontend: React + TypeScript + Vite
Backend: FastAPI + Python
Auth: Firebase Auth
Base de datos: Firestore
Archivos: Cloud Storage for Firebase
Hosting frontend: Firebase Hosting
Backend deploy: Cloud Run
Secretos: Secret Manager / variables de entorno
Mapas: Google Maps Platform
```

### 2.3 APIs de Google Maps que deben estar habilitadas

Activar en Google Cloud Console para el proyecto `ml-lab-ivan`:

```txt
Maps JavaScript API
Places API
Places API (New), si aparece disponible
Geocoding API
```

No activar para el MVP:

```txt
Air Quality API
Solar API
Weather API
Pollen API
Map Management API
Maps 3D SDK for Android
Maps 3D SDK for iOS
Maps Datasets API
Routes API
Directions API
Distance Matrix API
Geolocation API
Address Validation API
```

---

## 3. Espacio para claves y variables del proyecto

> Importante: este bloque es solo una plantilla. No se deben subir claves reales al repositorio.  
> Las claves reales deben ir en `.env.local`, en variables de entorno del servicio, o en Secret Manager.

### 3.1 Claves de APIs GCP

> Importante: si la clave habilitada sirve para muchas APIs del proyecto GCP, por ejemplo 33 APIs, **no debe exponerse directamente en el frontend** con prefijo `VITE_`, porque todo lo que empieza con `VITE_` queda disponible en el navegador.

Se deben manejar dos tipos de claves:

#### 3.1.1 Clave pública restringida para frontend

Esta clave debe usarse solo para funcionalidades visibles en navegador, principalmente Google Maps.

Debe estar restringida por:

```txt
- HTTP referrers / sitios web permitidos.
- APIs permitidas: Maps JavaScript API, Places API y Geocoding API.
```

Variable frontend:

```env
VITE_GOOGLE_MAPS_BROWSER_API_KEY=PEGAR_AQUI_LA_API_KEY_PUBLICA_RESTRINGIDA_SOLO_PARA_MAPS
```

También puede llamarse `VITE_GOOGLE_MAPS_API_KEY`, pero para evitar confusión se recomienda el nombre más explícito:

```env
VITE_GOOGLE_MAPS_BROWSER_API_KEY=
```

#### 3.1.2 Clave general del proyecto GCP para 33 APIs

Si existe una clave del proyecto GCP con acceso a 33 APIs, debe tratarse como una credencial sensible.

No debe quedar en:

```txt
- Código fuente.
- README público.
- frontend/.env.
- frontend/.env.example con valor real.
- Variables `VITE_`.
```

Debe quedar solo en backend o Secret Manager.

Variable backend sugerida:

```env
GCP_GENERAL_API_KEY=PEGAR_AQUI_LA_CLAVE_GCP_DE_33_APIS_SOLO_EN_BACKEND_O_SECRET_MANAGER
```

En producción, esta clave debe cargarse desde Secret Manager o como variable segura del servicio Cloud Run.

Regla para Claude Code:

```txt
No exponer GCP_GENERAL_API_KEY en el frontend.
No usar GCP_GENERAL_API_KEY con prefijo VITE_.
No commitear claves reales.
Si el frontend necesita Maps, usar una API key separada, pública, restringida por dominio y restringida solo a las APIs de Maps necesarias.
```

#### 3.1.3 Cómo revisar las APIs asociadas a la clave general GCP

Para revisar las APIs habilitadas en el proyecto `ml-lab-ivan`, usar:

```bash
gcloud services list --enabled \
  --project=ml-lab-ivan \
  --format="table(config.name,config.title)"
```

### 3.2 Firebase frontend config

```env
VITE_FIREBASE_API_KEY=AIzaSyCyPrymjCPU9qMjV1liTeWe5zHFUP_oY5M
VITE_FIREBASE_AUTH_DOMAIN=ml-lab-ivan.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=ml-lab-ivan
VITE_FIREBASE_STORAGE_BUCKET=ml-lab-ivan.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

### 3.3 Backend env

```env
APP_ENV=dev
GCP_PROJECT_ID=ml-lab-ivan
FIREBASE_PROJECT_ID=ml-lab-ivan
GCP_REGION=us-west1
GCP_GENERAL_API_KEY=PEGAR_AQUI_LA_CLAVE_GCP_DE_33_APIS_SOLO_EN_BACKEND_O_SECRET_MANAGER
CORS_ALLOWED_ORIGINS=http://localhost:5173,https://ml-lab-ivan.web.app,https://ml-lab-ivan.firebaseapp.com
```

### 3.4 Email provider

Para el MVP se debe dejar preparado un adaptador de email, aunque inicialmente puede funcionar con un mock o stub.

```env
EMAIL_PROVIDER=stub
SENDGRID_API_KEY=PEGAR_AQUI_SENDGRID_API_KEY_SI_APLICA
FROM_EMAIL=no-reply@parche.app
```

---

## 4. Preparación local del proyecto

### 4.1 Clonar repositorio

```bash
cd ~/Desktop
git clone https://github.com/IvanRenatoC/parche-app.git
cd parche-app
```

Si la carpeta ya existe:

```bash
cd ~/Desktop/parche-app
git status
```

### 4.2 Crear estructura sugerida

```txt
parche-app/
├── frontend/
├── backend/
├── docs/
├── firebase/
├── .gitignore
├── README.md
└── MANUAL_INSTRUCCIONES_PARCHE.md
```

### 4.3 Archivos que Claude Code debe crear o mantener

```txt
README.md
docs/TECHNICAL_SPEC.md
docs/FIREBASE_SETUP.md
docs/GCP_DEPLOYMENT.md
docs/DATA_MODEL.md
docs/SECURITY_RULES.md
frontend/.env.example
backend/.env.example
firebase/firestore.rules
firebase/storage.rules
firebase/firebase.json
```

---

## 5. Reglas funcionales principales

## 5.1 Roles

Existen dos tipos principales de perfiles:

```txt
owner
worker
```

### Owner

El owner representa a una persona que administra uno o más negocios.

Debe poder:

```txt
- Registrarse.
- Iniciar sesión.
- Registrar uno o más locales.
- Publicar necesidades de personal.
- Editar publicaciones.
- Bajar publicaciones.
- Indicar motivo al bajar una publicación.
- Ver perfiles de workers que postularon a sus publicaciones.
- Aceptar workers.
- Rechazar workers.
- Registrar ingreso del worker.
- Calificar posteriormente al worker.
- Ver metadata e historial de publicaciones.
```

Restricciones del owner:

```txt
- No puede ver otros owners.
- No puede ver workers que no hayan postulado a sus publicaciones.
- No puede autocalificarse.
- No puede aceptar workers en publicaciones que no le pertenecen.
```

### Worker

El worker representa a una persona que busca turnos temporales.

Debe poder:

```txt
- Registrarse.
- Iniciar sesión.
- Crear su perfil laboral.
- Subir foto de perfil.
- Subir foto de carnet o pasaporte.
- Subir certificados opcionales.
- Ver publicaciones disponibles.
- Filtrar publicaciones por región, oficio y fecha.
- Comentar publicaciones.
- Postular a publicaciones.
- Bajar una postulación indicando motivo.
- Ver historial de postulaciones.
- Ver dinero recibido por trabajos adjudicados.
- Calificar posteriormente al owner/local.
```

Restricciones del worker:

```txt
- No puede ver otros workers.
- No puede autocalificarse.
- No puede quedar aceptado en dos publicaciones que coincidan en horario.
```

---

## 6. Pantallas requeridas

## 6.1 Página 1 — Login

Debe incluir:

```txt
- Email.
- Contraseña.
- Botón iniciar sesión.
- Login con Google.
- Link "¿Olvidaste tu contraseña?"
- Botón o link "Si no tienes cuenta, regístrate".
```

El link de recuperación debe redireccionar a una vista donde se ingresa el email. Si el email existe en Firebase Auth, se envía el flujo de recuperación de contraseña.

## 6.2 Página 2 — Registro

Debe permitir elegir perfil:

```txt
owner
worker
```

### Registro Owner

Campos:

```txt
- RUT de la persona.
- Nombre.
- Apellido.
- RUT del local.
- Nombre del local.
- Botón "+" para agregar más de un local.
- Tipo de lugar: restaurante, bar, resto bar, disco, tienda, convenience store, otro.
- Subtipo: comida china, thai, chilena, peruana, sushi, seafood, rápida, otro.
- Dirección del local con Google Maps / Places Autocomplete.
- Latitud.
- Longitud.
- Región.
- Comuna.
```

### Registro Worker

Campos:

```txt
- RUT.
- Nombre.
- Apellido.
- Foto carnet o pasaporte.
- Nacionalidad.
- Oficio.
- Años de experiencia por oficio.
- Certificados opcionales.
- Foto desde el cuello hacia arriba.
```

Texto sugerido para la foto:

```txt
Te aconsejamos tomarte esta foto con seriedad. Puede marcar la diferencia.
```

Oficios iniciales:

```txt
Maestro de cocina
Ayudante de cocina
Barman
Copero
Mesero
DJ
Aseador
Garzón
Cajero
Anfitrión
Guardia
Otro
```

## 6.3 Página 3 — Publicaciones / Marketplace

### Vista Owner

Debe permitir:

```txt
- Crear publicación.
- Editar publicación.
- Bajar publicación.
- Ver postulantes.
- Ver comentarios.
- Responder comentarios.
- Aceptar workers.
- Registrar ingreso.
- Cerrar publicación.
```

Campos de publicación:

```txt
- Local asociado.
- Fecha de inicio.
- Fecha de término.
- Hora de inicio.
- Hora de término.
- Días o intervalos requeridos.
- Oficio solicitado.
- Número de workers requeridos.
- Salario total de la función.
- Descripción breve.
- Requisitos opcionales.
- Estado de publicación.
```

Estados sugeridos de publicación:

```txt
draft
published
closed
cancelled
filled
expired
```

### Vista Worker

Debe permitir:

```txt
- Ver todas las publicaciones activas.
- Filtrar por región.
- Filtrar por comuna.
- Filtrar por oficio solicitado.
- Filtrar por fecha.
- Ver detalle de publicación.
- Comentar.
- Postular.
- Retirar postulación indicando motivo.
```

## 6.4 Página 4 — Perfil / Historial

### Owner

Debe ver:

```txt
- Información personal.
- Locales administrados.
- Metadata de publicaciones por local.
- Total de dinero invertido.
- Cantidad de publicaciones creadas.
- Cantidad de workers aceptados.
- Estadísticas por oficio.
- Historial de workers elegidos.
- Calificaciones realizadas y recibidas.
```

### Worker

Debe ver:

```txt
- Información personal.
- Oficios registrados.
- Experiencia.
- Certificados.
- Historial de postulaciones.
- Postulaciones aceptadas.
- Postulaciones rechazadas.
- Total de dinero recibido.
- Calificaciones realizadas y recibidas.
```

---

## 7. Modelo de datos Firestore sugerido

## 7.1 Colecciones principales

```txt
users
owners
workers
businesses
job_posts
applications
comments
ratings
notifications
audit_logs
```

## 7.2 users/{uid}

```json
{
  "uid": "firebase_uid",
  "email": "user@example.com",
  "role": "owner",
  "rut": "12.345.678-9",
  "first_name": "Nombre",
  "last_name": "Apellido",
  "profile_completed": true,
  "email_verified": true,
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

## 7.3 businesses/{businessId}

```json
{
  "owner_uid": "firebase_uid",
  "business_rut": "76.123.456-7",
  "business_name": "Nombre Local",
  "business_type": "restaurante",
  "business_subtype": "sushi",
  "address": "Av. Providencia 1234, Providencia, Chile",
  "place_id": "google_place_id",
  "lat": -33.4372,
  "lng": -70.6506,
  "region": "Región Metropolitana",
  "commune": "Providencia",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

## 7.4 workers/{uid}

```json
{
  "uid": "firebase_uid",
  "rut": "12.345.678-9",
  "nationality": "chilena",
  "profile_photo_url": "storage_url",
  "identity_document_url": "storage_url",
  "occupations": [
    {
      "name": "barman",
      "years_experience": 3
    }
  ],
  "certificates": [
    {
      "name": "Certificado curso coctelería",
      "url": "storage_url"
    }
  ],
  "status": "active",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

## 7.5 job_posts/{jobPostId}

```json
{
  "owner_uid": "firebase_uid",
  "business_id": "business_id",
  "title": "Barman para turno noche",
  "occupation": "barman",
  "description": "Se necesita barman para turno puntual.",
  "start_date": "2026-05-01",
  "end_date": "2026-05-01",
  "start_time": "20:00",
  "end_time": "03:00",
  "required_workers": 2,
  "accepted_workers_count": 0,
  "salary_total_clp": 60000,
  "region": "Región Metropolitana",
  "commune": "Providencia",
  "status": "published",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

## 7.6 applications/{applicationId}

```json
{
  "job_post_id": "job_post_id",
  "owner_uid": "firebase_uid",
  "worker_uid": "firebase_uid",
  "status": "applied",
  "withdraw_reason": null,
  "rejection_reason": null,
  "auto_rejection_message_sent": false,
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

Estados sugeridos de postulación:

```txt
applied
withdrawn
accepted
rejected
not_selected
cancelled
```

## 7.7 notifications/{notificationId}

```json
{
  "recipient_uid": "firebase_uid",
  "type": "application_not_selected",
  "title": "No fuiste seleccionado",
  "message": "El owner ya seleccionó a otro postulante para esta vacante.",
  "related_job_post_id": "job_post_id",
  "read": false,
  "created_at": "timestamp"
}
```

---

## 8. Flujo crítico: aceptación de worker y mensaje automático

Cuando el owner acepta a un worker:

```txt
1. Validar que el usuario autenticado sea el owner de la publicación.
2. Validar que la publicación esté en estado published.
3. Validar que el worker haya postulado.
4. Validar que el worker no tenga otra postulación aceptada con choque horario.
5. Cambiar la postulación seleccionada a accepted.
6. Incrementar accepted_workers_count.
7. Si accepted_workers_count alcanza required_workers, cambiar job_post.status a filled.
8. Cambiar todas las postulaciones no seleccionadas de esa publicación a not_selected.
9. Crear una notificación interna para cada postulante no seleccionado.
10. Enviar email automático a cada postulante no seleccionado, si el proveedor email está activo.
11. Crear evento en audit_logs.
```

Mensaje automático sugerido:

```txt
Hola, gracias por postular a esta oportunidad en Parche. El owner ya seleccionó a otro postulante para esta vacante. Te invitamos a revisar nuevas publicaciones disponibles.
```

---

## 9. Reglas de seguridad

## 9.1 Principios

```txt
- Firebase Auth identifica al usuario.
- Firestore almacena perfiles, roles y relaciones.
- El backend valida operaciones críticas.
- Firestore Rules bloquea acceso directo no autorizado.
- Storage Rules protege documentos sensibles.
- No se guardan secretos en frontend.
```

## 9.2 Restricciones clave

```txt
- Owner no puede ver otros owners.
- Worker no puede ver otros workers.
- Owner solo puede ver postulantes de sus propias publicaciones.
- Worker solo puede ver sus propias postulaciones.
- Nadie puede autocalificarse.
- Solo el owner de una publicación puede aceptar o rechazar postulantes.
- El worker no puede editar publicaciones.
- El owner no puede editar el perfil laboral de un worker.
```

## 9.3 Storage path recomendado

```txt
/profile_photos/{uid}/...
/identity_documents/{uid}/...
/certificates/{uid}/...
/business_documents/{ownerUid}/...
/job_post_attachments/{jobPostId}/...
```

---

## 10. Diseño visual

Paleta base:

| Color | Hex | Uso |
|---|---|---|
| Rosa/Magenta | `#ad4b7e` | Texto principal y secundario, títulos destacados |
| Negro | `#000000` | Botones principales, enlaces activos |
| Blanco | `#FFFFFF` | Fondo general |
| Gris claro | `#f2f3f5` | Tarjetas, inputs, superficies |
| Verde | `#22C55E` | Indicadores de éxito |
| Amber | `#F59E0B` | Alertas y avisos |
| Gris azulado | `#A7B0C0` | Botones secundarios del hero |
| Gris azulado oscuro | `#97a0b0` | Hover de botones secundarios |
| Transparente | `transparent` | Bordes invisibles por defecto |

Tokens sugeridos:

```css
:root {
  --text-primary: #ad4b7e;
  --text-secondary: #ad4b7e;
  --primary: #000000;
  --bg-base: #FFFFFF;
  --bg-surface: #f2f3f5;
  --accent: #22C55E;
  --warning: #F59E0B;
  --border: transparent;
}
```

---

## 11. Instrucción para Claude Code

Usa este bloque cuando abras Claude Code dentro de la carpeta `parche-app`.

```txt
Actúa como un senior full-stack engineer y arquitecto técnico.

Estamos construyendo una aplicación web llamada Parche.

Repositorio:
https://github.com/IvanRenatoC/parche-app

Contexto:
Parche conecta owners de restaurantes, bares, restobares, discotecas, tiendas y convenience stores con workers disponibles para cubrir turnos temporales.

Stack acordado:
- Frontend: React + TypeScript + Vite.
- Backend: FastAPI + Python.
- Auth: Firebase Auth.
- Base de datos: Firestore.
- Storage: Cloud Storage for Firebase.
- Hosting frontend: Firebase Hosting.
- Backend: Cloud Run.
- Google Maps: Maps JavaScript API, Places API y Geocoding API.

Proyecto:
- GCP_PROJECT_ID=ml-lab-ivan
- FIREBASE_PROJECT_ID=ml-lab-ivan
- GCP_REGION=us-west1
- APP_ENV=dev
- FIREBASE_APP_NAME=parche-app
- PRODUCT_NAME=Parche

Tu tarea inicial:
1. Analiza la carpeta actual del proyecto.
2. No borres archivos existentes sin justificarlo.
3. Crea una arquitectura limpia para frontend, backend, docs y firebase.
4. Crea o actualiza README.md.
5. Crea docs/TECHNICAL_SPEC.md con el alcance funcional.
6. Crea docs/FIREBASE_SETUP.md con pasos de configuración.
7. Crea docs/GCP_DEPLOYMENT.md con despliegue a Firebase Hosting y Cloud Run.
8. Crea frontend/.env.example y backend/.env.example.
9. Implementa una primera versión funcional del frontend con:
   - Login.
   - Registro owner/worker.
   - Marketplace de publicaciones.
   - Perfil/historial.
10. Implementa integración Firebase Auth.
11. Deja preparado Firestore.
12. Deja preparado Cloud Storage.
13. Deja preparado Google Maps con variable VITE_GOOGLE_MAPS_BROWSER_API_KEY.
14. Considera que existe una clave general de GCP habilitada para 33 APIs. Esa clave debe usarse solo en backend/Secret Manager bajo el nombre GCP_GENERAL_API_KEY y nunca exponerse en frontend.
15. Implementa el flujo de aceptación de postulantes:
   - owner acepta worker.
   - postulación aceptada queda accepted.
   - demás postulaciones quedan not_selected.
   - se crea notificación automática para postulantes no seleccionados.
16. No incluyas claves reales ni secretos en el repositorio.
17. Todo secreto debe quedar como variable de entorno.
18. Entrega checklist de pruebas locales al finalizar.

Regla importante:
Cuando el owner acepta a un worker postulante, todos los demás postulantes no seleccionados para esa misma publicación deben recibir automáticamente una notificación interna y, si el proveedor de email está activo, un correo automático.

Antes de implementar cambios grandes:
- Explica brevemente qué archivos modificarás.
- Luego implementa.
- Al finalizar, muestra comandos para correr localmente.
```

---

## 12. Comandos sugeridos para Claude Code

### 12.1 Ver estado inicial

```bash
pwd
ls -la
git status
```

### 12.2 Crear rama de trabajo

```bash
git checkout -b feat/initial-parche-mvp
```

### 12.3 Correr frontend

```bash
cd frontend
npm install
npm run dev
```

### 12.4 Correr backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 12.5 Verificación final

```bash
git status
git diff --stat
```

---

## 13. Checklist antes de desarrollar

```txt
[ ] Proyecto GCP seleccionado: ml-lab-ivan
[ ] Región gcloud configurada: us-west1
[ ] Firebase project creado o vinculado: ml-lab-ivan
[ ] Firebase app creada: parche-app
[ ] Firebase Auth habilitado con Email/password
[ ] Firebase Auth habilitado con Google login
[ ] Recuperación de contraseña habilitada
[ ] Verificación de correo considerada
[ ] Firestore creado
[ ] Cloud Storage for Firebase habilitado
[ ] Maps JavaScript API habilitada
[ ] Places API habilitada
[ ] Places API (New) habilitada si aparece
[ ] Geocoding API habilitada
[ ] API Key pública restringida para Google Maps creada
[ ] API Key pública de Google Maps restringida por dominio
[ ] API Key pública de Google Maps restringida por API
[ ] Archivo .env.local creado localmente y no versionado
[ ] Clave general GCP de 33 APIs tratada como secreto backend/Secret Manager
```

---

## 14. Checklist de MVP

```txt
[ ] Usuario puede registrarse como owner.
[ ] Usuario puede registrarse como worker.
[ ] Usuario puede iniciar sesión con email/password.
[ ] Usuario puede iniciar sesión con Google.
[ ] Owner puede registrar local.
[ ] Owner puede registrar dirección usando Google Maps.
[ ] Owner puede publicar necesidad de worker.
[ ] Worker puede ver publicaciones.
[ ] Worker puede filtrar por región, oficio y fecha.
[ ] Worker puede comentar publicación.
[ ] Worker puede postular.
[ ] Owner puede ver postulantes.
[ ] Owner puede aceptar worker.
[ ] Sistema notifica automáticamente a no seleccionados.
[ ] Worker aceptado no puede quedar aceptado en otra publicación con choque horario.
[ ] Owner puede ver historial.
[ ] Worker puede ver historial.
[ ] Se respetan restricciones básicas de visibilidad.
```

---

## 15. Notas de seguridad

```txt
- No subir .env.local.
- No subir claves reales de Firebase.
- No subir API Key sin restricciones.
- No dejar Storage público.
- No dejar Firestore abierto en modo test.
- Validar rol en frontend y backend.
- Validar operaciones críticas en backend.
- Mantener audit_logs para aceptación, rechazo, baja de publicación, retiro de postulación y calificaciones.
```

---

## 16. Primer entregable esperado

El primer entregable de Claude Code debería ser:

```txt
- Estructura base del repositorio.
- Frontend inicial en React + Vite.
- Backend inicial en FastAPI.
- Integración Firebase Auth preparada.
- Firestore preparado.
- Storage preparado.
- Google Maps preparado mediante variable VITE_GOOGLE_MAPS_BROWSER_API_KEY.
- Documentación técnica inicial.
- README con pasos de ejecución local.
- Checklist de pruebas.
```

