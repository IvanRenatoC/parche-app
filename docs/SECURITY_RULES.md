# Reglas de Seguridad — Parche

## Principios

1. **Firebase Auth** identifica al usuario autenticado
2. **Firestore Rules** controla qué puede leer/escribir directamente en la DB
3. **Backend FastAPI** valida todas las operaciones críticas (aceptar, rechazar, notificar)
4. **Storage Rules** protege archivos sensibles
5. **Secretos** nunca en frontend ni en código fuente

## Restricciones por rol

### Owner
- Puede leer/escribir sus propios datos en `users/{uid}` y `owners/{uid}`
- Puede leer/escribir sus propios `businesses`
- Puede crear/editar/cerrar sus propios `job_posts`
- Puede leer `applications` de sus propias publicaciones
- NO puede ver perfiles de otros owners
- NO puede ver workers que no postularon a sus publicaciones
- NO puede editar el perfil de un worker
- NO puede aceptar/rechazar en publicaciones ajenas

### Worker
- Puede leer/escribir sus propios datos en `users/{uid}` y `workers/{uid}`
- Puede leer `job_posts` en estado `published`
- Puede crear/leer sus propias `applications`
- Puede retirar sus propias postulaciones
- NO puede ver perfiles de otros workers
- NO puede editar publicaciones
- NO puede ver postulaciones de otros workers

## Reglas Firestore (conceptuales)

Las reglas reales están en `firebase/firestore.rules`.

```
users/{uid}:
  read: auth.uid == uid
  write: auth.uid == uid

owners/{uid}:
  read: auth.uid == uid
  write: auth.uid == uid

workers/{uid}:
  read: auth.uid == uid
  write: auth.uid == uid

businesses/{businessId}:
  read: resource.data.owner_uid == auth.uid
  write: resource.data.owner_uid == auth.uid || (is new && auth.uid != null)

job_posts/{jobPostId}:
  read: resource.data.status == "published" || resource.data.owner_uid == auth.uid
  write: resource.data.owner_uid == auth.uid

applications/{applicationId}:
  read: resource.data.worker_uid == auth.uid || resource.data.owner_uid == auth.uid
  create: auth.uid == request.resource.data.worker_uid
  update: (auth.uid == resource.data.worker_uid && update is withdraw)
         || (auth.uid == resource.data.owner_uid && update is reject)

notifications/{notificationId}:
  # Modo dual: notificaciones directas (recipient_uid) o broadcast por rol (recipient_role).
  read: resource.data.recipient_uid == auth.uid
       || (resource.data.recipient_role != "" && resource.data.recipient_role == userRole)
  create: auth.uid != null
         && request.resource.data.recipient_uid is string
         && request.resource.data.recipient_role is string
         && request.resource.data.recipient_uid != auth.uid
  update: (recipient_uid == auth.uid OR recipient_role == userRole)
         && only ["read", "read_by"] fields change

# Por qué se permite el create desde el cliente:
# - Worker → owner: cuando el worker postula o desiste, escribe la notificación
#   directa al owner_uid del job_post (que el cliente conoce).
# - Owner → workers: al publicar un turno, el owner crea UNA notificación
#   broadcast con recipient_role="worker"; cada worker la marca como leída
#   agregándose al array read_by (sin necesidad de fan-out por documento).
# Esto evita exponer la colección 'users' o 'workers' (ambos tienen PII)
# para listar destinatarios.

audit_logs/{logId}:
  read: false  # Solo administradores backend
  write: false # Solo el backend
```

## Reglas Storage (conceptuales)

Las reglas reales están en `firebase/storage.rules`.

```
/profile_photos/{uid}/**:
  read: auth != null && auth.uid == uid
  write: auth != null && auth.uid == uid

/identity_documents/{uid}/**:
  read: auth != null && auth.uid == uid
  write: auth != null && auth.uid == uid

/certificates/{uid}/**:
  read: auth != null && auth.uid == uid
  write: auth != null && auth.uid == uid

/business_documents/{ownerUid}/**:
  read: auth != null && auth.uid == ownerUid
  write: auth != null && auth.uid == ownerUid

/job_post_attachments/{jobPostId}/**:
  read: auth != null  # visible para usuarios autenticados
  write: auth != null  # el backend valida ownership
```

## API Keys

| Key | Ubicación | Restricciones |
|---|---|---|
| `VITE_FIREBASE_API_KEY` | Frontend (.env.local) | Restringida por Firebase App |
| `VITE_GOOGLE_MAPS_BROWSER_API_KEY` | Frontend (.env.local) | HTTP referrer + Maps JS/Places/Geocoding only |
| `GCP_GENERAL_API_KEY` | Backend/Secret Manager SOLO | ~33 APIs GCP, NUNCA en frontend |
| `SENDGRID_API_KEY` | Backend/Secret Manager | Email only |

## Validaciones críticas en backend

Todas estas validaciones ocurren en FastAPI, NO en Firestore Rules directamente:

1. **Token validation**: cada request autenticado pasa por `verify_firebase_token()`
2. **Ownership check**: antes de aceptar/rechazar, se verifica que `token.uid == job_post.owner_uid`
3. **Status validation**: no se puede aceptar a alguien en publicación no-published
4. **Horario overlap**: se verifica que el worker no tenga conflicto de horario al aceptar
5. **Rate limiting**: implementar en Cloud Run o API Gateway (pendiente para MVP+)

## Audit trail

Todos los eventos críticos quedan en `audit_logs`:
- Aceptación de worker
- Rechazo de worker
- Baja de publicación
- Retiro de postulación
- Calificaciones
- Cambios de estado de publicación
