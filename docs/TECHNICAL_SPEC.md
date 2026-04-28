# Especificación Técnica — Parche

## Objetivo

Parche es una plataforma web que conecta owners de locales gastronómicos y similares con workers disponibles para cubrir turnos temporales.

## Roles

### Owner
- Administra uno o más locales (businesses)
- Publica necesidades de personal (job_posts)
- Acepta o rechaza workers postulantes
- Ve historial y estadísticas de sus publicaciones
- Califica a workers después del turno

### Worker
- Crea su perfil laboral con oficios y experiencia
- Busca y filtra publicaciones disponibles
- Postula a publicaciones
- Puede retirar su postulación con motivo
- Califica al local/owner después del turno

## Pantallas

### 1. Login
- Email + contraseña
- Login con Google (preparado)
- Enlace "¿Olvidaste tu contraseña?"
- Enlace "Regístrate"

### 2. Registro
- Selector owner / worker

**Owner:**
- RUT persona, nombre, apellido
- Datos del local: RUT, nombre, tipo, subtipo
- Dirección con Google Maps Places Autocomplete
- Lat/lng, región, comuna
- Opción "+" para agregar más locales

**Worker:**
- RUT, nombre, apellido
- Foto de carnet/pasaporte
- Nacionalidad
- Oficios y años de experiencia
- Certificados opcionales
- Foto de perfil (retrato)

### 3. Marketplace / Publicaciones

**Vista Owner:**
- Crear, editar, bajar publicaciones
- Ver postulantes
- Ver/responder comentarios
- Aceptar workers
- Registrar ingreso
- Cerrar publicación

**Vista Worker:**
- Ver publicaciones activas (published)
- Filtros: región, comuna, oficio, fecha
- Ver detalle
- Comentar
- Postular
- Retirar postulación con motivo

### 4. Perfil / Historial

**Owner:**
- Datos personales
- Locales administrados
- Metadata de publicaciones por local
- Total dinero invertido
- Cantidad publicaciones / workers aceptados
- Estadísticas por oficio
- Calificaciones dadas y recibidas

**Worker:**
- Datos personales
- Oficios y experiencia
- Certificados
- Historial de postulaciones (aceptadas, rechazadas)
- Total dinero recibido
- Calificaciones dadas y recibidas

## Reglas de negocio principales

1. Un owner solo puede ver workers que postularon a sus publicaciones
2. Un worker solo puede ver sus propias postulaciones
3. Nadie puede autocalificarse
4. Solo el owner de la publicación puede aceptar/rechazar postulantes
5. Un worker no puede quedar aceptado en dos publicaciones con choque de horario
6. Al aceptar un worker, los demás postulantes no seleccionados reciben notificación automática

## Flujo crítico: aceptación de worker

```
POST /applications/{application_id}/accept
Authorization: Bearer <firebase_id_token>
```

Pasos del servicio `accept_application(application_id, owner_uid)`:

1. Validar que el usuario autenticado sea el owner de la publicación
2. Validar que la publicación esté en estado `published`
3. Validar que la postulación exista y esté en estado `applied`
4. Validar que el worker no tenga otra postulación `accepted` con choque horario
5. Cambiar postulación a `accepted`
6. Incrementar `accepted_workers_count` en el job_post
7. Si `accepted_workers_count >= required_workers`, cambiar job_post.status a `filled`
8. Buscar todas las postulaciones `applied` restantes de esa publicación
9. Cambiarlas a `not_selected`
10. Crear notificación interna para cada worker no seleccionado
11. Si `EMAIL_PROVIDER != stub`, enviar correo automático
12. Registrar evento en `audit_logs`

## Estados

### job_posts
- `draft`: borrador, no visible
- `published`: activa, visible para workers
- `closed`: cerrada manualmente por owner
- `cancelled`: cancelada con motivo
- `filled`: cupos completos
- `expired`: fecha de inicio pasada sin completarse

### applications
- `applied`: postulación activa
- `withdrawn`: retirada por el worker
- `accepted`: aceptada por el owner
- `rejected`: rechazada por el owner
- `not_selected`: marcada automáticamente al llenarse los cupos
- `cancelled`: cancelada por sistema

## Stack técnico

| Capa | Tecnología | Versión |
|---|---|---|
| Frontend | React + TypeScript | 18.x / 5.x |
| Build | Vite | 5.x |
| Estilos | Tailwind CSS | 3.x |
| Backend | FastAPI + Python | 0.111.x / 3.11+ |
| Auth | Firebase Auth | SDK Web 10.x |
| Base de datos | Firestore | Cloud Firestore |
| Storage | Firebase Storage | Cloud Storage |
| Hosting | Firebase Hosting | — |
| Backend infra | Cloud Run | GCP us-west1 |
| Mapas | Google Maps JS API | Weekly |

## Restricciones de seguridad

- `GCP_GENERAL_API_KEY` (clave de ~33 APIs): solo backend/Secret Manager, nunca frontend
- `VITE_GOOGLE_MAPS_BROWSER_API_KEY`: restringida por dominio y solo Maps/Places/Geocoding
- Secretos nunca en código fuente ni en `.env` versionado
- Firestore Rules validan rol y propiedad
- Backend valida Firebase ID token en todas las rutas protegidas
- Operaciones críticas solo se realizan en el backend
