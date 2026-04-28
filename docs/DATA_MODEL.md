# Modelo de datos — Parche (Firestore)

## Colecciones

```
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

---

## users/{uid}

Perfil base de todos los usuarios autenticados (owner o worker).

```typescript
{
  uid: string;                  // Firebase UID (= document ID)
  email: string;
  role: "owner" | "worker";
  rut: string;                  // Formato: 12.345.678-9
  first_name: string;
  last_name: string;
  profile_completed: boolean;
  email_verified: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

---

## owners/{uid}

Datos adicionales del owner.

```typescript
{
  uid: string;                  // Firebase UID (= document ID)
  // Referencia directa a businesses[] para locales
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

---

## workers/{uid}

Datos adicionales del worker.

```typescript
{
  uid: string;                  // Firebase UID (= document ID)
  rut: string;
  nationality: string;
  profile_photo_url: string;    // URL Cloud Storage
  identity_document_url: string;
  occupations: Array<{
    name: string;               // barman, garzón, etc.
    years_experience: number;
  }>;
  certificates: Array<{
    name: string;
    url: string;                // URL Cloud Storage
  }>;
  status: "active" | "suspended";
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

---

## businesses/{businessId}

Local registrado por un owner.

```typescript
{
  owner_uid: string;            // Firebase UID del owner
  business_rut: string;         // RUT del local
  business_name: string;
  business_type: "restaurante" | "bar" | "restobar" | "disco" | "tienda" | "convenience_store" | "otro";
  business_subtype: "comida_china" | "thai" | "chilena" | "peruana" | "sushi" | "seafood" | "rapida" | "otro";
  address: string;              // Dirección completa formateada
  place_id: string;             // Google Place ID
  lat: number;
  lng: number;
  region: string;
  commune: string;
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

---

## job_posts/{jobPostId}

Publicación de turno temporal.

```typescript
{
  owner_uid: string;
  business_id: string;
  title: string;
  occupation: string;
  description: string;
  requirements: string;         // Requisitos opcionales
  start_date: string;           // "YYYY-MM-DD"
  end_date: string;             // "YYYY-MM-DD"
  start_time: string;           // "HH:MM"
  end_time: string;             // "HH:MM"
  required_workers: number;
  accepted_workers_count: number;
  salary_total_clp: number;
  region: string;
  commune: string;
  status: "draft" | "published" | "closed" | "cancelled" | "filled" | "expired";
  close_reason: string | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

**Transiciones de estado válidas:**
- `draft` → `published` (owner publica)
- `published` → `closed` (owner baja manualmente)
- `published` → `cancelled` (owner cancela con motivo)
- `published` → `filled` (automático al completar cupos)
- `published` → `expired` (automático si pasa la fecha sin completarse)
- Cualquier estado → `closed` (owner puede cerrar)

---

## applications/{applicationId}

Postulación de un worker a una publicación.

```typescript
{
  job_post_id: string;
  owner_uid: string;            // Desnormalizado para facilitar queries del owner
  worker_uid: string;
  status: "applied" | "withdrawn" | "accepted" | "rejected" | "not_selected" | "cancelled";
  withdraw_reason: string | null;
  rejection_reason: string | null;
  auto_rejection_message_sent: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

**Regla:** Un worker no puede tener dos postulaciones en estado `accepted` con horarios que se solapen.

---

## comments/{commentId}

Comentarios públicos en publicaciones.

```typescript
{
  job_post_id: string;
  author_uid: string;
  author_role: "owner" | "worker";
  author_name: string;          // Desnormalizado para display
  content: string;
  parent_id: string | null;     // Para respuestas (threading simple)
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

---

## ratings/{ratingId}

Calificaciones post-turno.

```typescript
{
  from_uid: string;             // Quien califica
  to_uid: string;               // A quien califica
  from_role: "owner" | "worker";
  job_post_id: string;
  score: number;                // 1-5
  comment: string;
  created_at: Timestamp;
}
```

**Restricción:** `from_uid !== to_uid` (no autocalificarse).

---

## notifications/{notificationId}

Notificaciones internas del sistema.

```typescript
{
  recipient_uid: string;
  type: "application_not_selected" | "application_accepted" | "application_rejected" | "job_post_filled" | "new_application" | "general";
  title: string;
  message: string;
  related_job_post_id: string | null;
  related_application_id: string | null;
  read: boolean;
  created_at: Timestamp;
}
```

---

## audit_logs/{logId}

Registro inmutable de eventos del sistema.

```typescript
{
  event_type: string;           // Ej: "application_accepted", "job_post_closed"
  actor_uid: string;            // Usuario que ejecutó la acción
  affected_uid: string | null;  // Usuario afectado (si aplica)
  resource_type: string;        // "application" | "job_post" | "user"
  resource_id: string;          // ID del recurso afectado
  metadata: Record<string, any>;// Datos adicionales del evento
  created_at: Timestamp;
}
```

---

## Relaciones clave

```
users (1) ─── (1) owners
users (1) ─── (1) workers
owners (1) ─── (N) businesses
businesses (1) ─── (N) job_posts
job_posts (1) ─── (N) applications
job_posts (1) ─── (N) comments
applications (N) ─── (1) workers
users (N) ─── (N) ratings  [vía from_uid/to_uid]
```

## Índices Firestore recomendados

```
job_posts: status ASC, created_at DESC
job_posts: region ASC, status ASC, created_at DESC
job_posts: occupation ASC, status ASC, start_date ASC
job_posts: owner_uid ASC, status ASC
applications: job_post_id ASC, status ASC
applications: worker_uid ASC, status ASC, created_at DESC
notifications: recipient_uid ASC, read ASC, created_at DESC
audit_logs: actor_uid ASC, created_at DESC
```
