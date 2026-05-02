# Chat — Parche

## Propósito

El chat permite al owner y al postulante afinarn detalles del turno antes de la aceptación formal. No es sinónimo de aceptación: el owner puede conversar con varios postulantes en paralelo.

## Modelo de datos

```
chats/{chatId}
  owner_uid:       string   — UID del owner
  worker_uid:      string   — UID del worker
  job_post_id:     string   — ID de la publicación
  application_id:  string   — ID de la postulación (1-to-1)
  last_message:    string?  — Último mensaje truncado a 100 chars
  last_message_at: Timestamp?
  created_at:      Timestamp
  updated_at:      Timestamp

chats/{chatId}/messages/{messageId}
  sender_uid:  string   — UID del que envía
  content:     string   — Texto del mensaje
  created_at:  Timestamp
```

Relación: **1 chat por postulación** (`application_id` único). Si el owner abre el chat dos veces, se reutiliza el mismo documento.

## Flujo

1. Owner hace click en "Chat" en la tarjeta del postulante → `getOrCreateChat()` crea o recupera el chat y abre `ChatModal`
2. Worker abre el detalle de su postulación → si existe un chat iniciado por el owner, aparece "Chat con el negocio"
3. Ambos envían mensajes en tiempo real vía `onSnapshot` sobre la subcollección `messages`
4. `sendMessage()` también actualiza `last_message` y `last_message_at` en el documento padre (para futuros listados)

## Componentes

| Componente | Ruta | Descripción |
|---|---|---|
| `ChatModal` | `components/marketplace/ChatModal.tsx` | UI completa: lista de mensajes + input |
| `chat.ts` | `services/chat.ts` | `getOrCreateChat`, `sendMessage`, `subscribeToMessages`, `findChatByApplication` |

## Reglas Firestore

- Solo `owner_uid` y `worker_uid` del chat pueden leer y escribir
- Los mensajes solo los pueden crear participantes del chat, y solo con `sender_uid == uid()`
- Los mensajes no se pueden editar ni borrar

## UX

- Enter (sin Shift) envía el mensaje
- Scroll automático al último mensaje
- Hora de cada mensaje en formato HH:MM
- Mensajes propios en rosa (#C0395B), ajenos en gris claro
