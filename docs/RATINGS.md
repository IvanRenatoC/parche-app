# Calificaciones — Parche

## Propósito

Después de cada turno completado, ambas partes deben calificarse mutuamente en una escala de 1 a 5 estrellas. La calificación es **obligatoria**: bloquea la siguiente acción crítica hasta completarla.

| Rol | Acción bloqueada |
|---|---|
| Owner | No puede publicar un nuevo turno |
| Worker | No puede postular a un nuevo turno |

## Modelo de datos

```
ratings/{ratingId}
  from_uid:    string   — UID del que califica
  to_uid:      string   — UID del calificado
  from_role:   'owner' | 'worker'
  job_post_id: string   — ID de la publicación relacionada
  score:       number   — 1 a 5
  comment:     string   — Comentario opcional (puede ser vacío)
  created_at:  Timestamp
```

Una calificación por par `(from_uid, job_post_id)` — no se puede editar ni borrar.

## Cuándo se activa el gate

Una calificación pendiente existe cuando:

1. Existe una `application` con `status == 'accepted'` del usuario
2. El `end_date` de la publicación es estrictamente anterior a hoy (`end_date < today`)
3. No existe ninguna `rating` con `from_uid == uid` y `job_post_id == ...` en esa publicación

## Flujo del gate

```
Usuario hace click en "Publicar turno" o "Postular"
    ↓
getPendingRatings(uid, role)
    ↓ Si hay pendientes
RatingModal [calificación 1 de N]
    ↓ Enviada
RatingModal [calificación 2 de N]  (si quedan)
    ↓ Cola vacía
Acción original (publicar / postular) continúa
```

## Visualización de promedios

| Ubicación | Qué muestra |
|---|---|
| Lista de turnos (worker) | Promedio del owner bajo el oficio de la publicación |
| Modal de detalle del turno (worker) | Promedio del owner bajo el título |
| Panel expandible del postulante (owner) | Promedio del worker |

Si el usuario no tiene calificaciones se muestra `"Sin calificaciones"`.

## Componentes

| Componente | Ruta | Descripción |
|---|---|---|
| `RatingModal` | `components/ratings/RatingModal.tsx` | Modal con selector de estrellas y comentario |
| `StarDisplay` | `components/ratings/StarDisplay.tsx` | Muestra estrellas + puntaje + cantidad |
| `ratings.ts` | `services/ratings.ts` | `createRating`, `getUserAverageRating`, `getPendingRatings` |

## Reglas Firestore

- **Escritura**: solo el propio usuario puede crear una calificación (`from_uid == uid` y `from_uid != to_uid`)
- **Lectura**: cualquier usuario autenticado puede leer (necesario para calcular promedios en cliente). **Trade-off MVP** — en v2, el backend calcula y almacena el promedio en el perfil del usuario, permitiendo volver a `from_uid == uid || to_uid == uid` para lectura individual.
- No se permite `update` ni `delete`

## Limitaciones conocidas (MVP)

- El cálculo de promedio hace N lecturas de Firestore al cargar cada card/row. Aceptable con volumen bajo; en producción se recomienda un Cloud Function que actualice `users/{uid}.rating_average` en cada nueva calificación.
- El bloqueo del gate es solo en frontend. Un usuario con acceso directo a la API de Firestore podría saltarlo. Para v2, validar desde el backend antes de cualquier write crítico.
