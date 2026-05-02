# Resultado — Trust, identidad, pagos y chat Parche

## Rama trabajada
- `feat/trust-identity-payments-flow` (creada desde `main`)

## Commits realizados
1. `feat(chat): restrict chat to owner-initiated, add worker confirm-parche flow`
2. `feat(identity): add worker photo onboarding and data consent`
3. `feat(infra): add payments/publication_charges Firestore rules and indexes`
4. `feat(payments): add disabled publication payment gate (USD 1.5 stub)`
5. `chore: update env.example files with new feature flag variables`
6. `merge: trust identity payments flow` (merge commit a main)
7. `merge: sync main → feat/initial-parche-mvp` (merge commit al default branch de GitHub)

## Push realizado
- Sí — `feat/trust-identity-payments-flow` pusheada a origin

## Merge a main
- Sí — merge --no-ff a `main` y push a origin/main
- Sí — sync a `feat/initial-parche-mvp` (default branch de GitHub)

---

## Qué quedó implementado

### 1. Chat controlado
- El Negocio es el único que puede iniciar un chat (solo `getOrCreateChat` desde la UI del Negocio).
- El Trabajador solo puede ver/responder si el chat ya existe para su postulación.
- Si no existe chat, el Trabajador ve: *"El negocio aún no ha iniciado una conversación."*
- Botón del Negocio: **"Abrir chat"** con texto ayuda *"Puedes escribirle al postulante antes de decidir."*
- Botón del Trabajador (si chat existe): **"Chat con el negocio"**
- `findChatByApplication()` usado del lado del worker para lookup readonly.
- Reglas Firestore: solo participantes (`owner_uid` / `worker_uid`) pueden leer/escribir, `sender_uid == uid()` obligatorio en mensajes.

### 2. Publicación bajada automáticamente al aceptar
- `application_service.py`: al aceptar postulante, la publicación pasa a `filled`.
- Las demás postulaciones activas pasan a `not_selected` con notificación automática.
- Mensaje exacto para no seleccionados: *"En esta oportunidad hemos seleccionado a otro postulante. Estuvo difícil la decisión y te invitamos a estar atento/a a próximas oportunidades en Parche."*
- Al aceptar, el worker recibe notificación: *"¡Te seleccionaron para el turno! Confirma tu participación..."*
- Worker acepta con botón **"✓ Confirmar parche"** → se graba `worker_confirmed_at` en la aplicación.
- Cuando el worker confirma, el owner recibe notificación: *"Trabajador confirmó el turno."*
- Una vez confirmado, el worker puede iniciar chat con el negocio.
- El worker (aceptado) puede ver su aplicación incluso cuando `post.status === 'filled'`.

### 3. Fotos de identidad del Trabajador
- **Onboarding multi-paso** para workers: Paso 1 → datos básicos | Paso 2 → consentimiento | Paso 3 → fotos.
- Indicador de pasos visual (barra de progreso).
- `IdentityUpload` component: dos slots con preview, soporte imagen/PDF, validación de campos.
- `storage.ts`: `uploadProfilePhoto`, `uploadIdentityDocument`, `uploadCertificate`, `deleteFile`.
- Paths en Storage: `profile_photos/{uid}/`, `identity_documents/{uid}/`.
- Firestore `workers/{uid}`: `profile_photo_url`, `profile_photo_path`, `identity_document_url`, `identity_document_path`, `identity_review_status: "pending_owner_review"`, `identity_uploaded_at`, `profile_photo_uploaded_at`.
- `WorkerVerificationPanel`: overlay para el Negocio con foto de perfil + documento, disclaimer de no-reconocimiento-facial, badge de estado de revisión.
- Botón **"Verificar"** en la fila del postulante (solo si tiene fotos).
- Flag `VITE_REQUIRE_WORKER_ID_UPLOADS=true` controla si las fotos son obligatorias (por defecto: true).

### 4. Consentimiento de datos
- Consent step agregado para **Trabajadores** (paso 2 de 3) y **Negocios** (al fondo del form único).
- Texto completo visible en caja scrollable antes del checkbox.
- Checkbox obligatorio: *"Acepto el tratamiento de mis datos personales para usar Parche."*
- Si no acepta: no puede avanzar. Error en línea.
- Guardado en Firestore `users/{uid}`:
  - `data_processing_consent_accepted: true`
  - `data_processing_consent_accepted_at: ISO string`
  - `data_processing_consent_version: "2026-05-02-v1"`
  - `data_processing_consent_user_agent: string`
- Tipos actualizados en `types/index.ts`.

### 5. Infraestructura local/GCP-ready
- `firestore.rules`: nuevas colecciones `payments` y `publication_charges` (owner-read, backend-write-only).
- `firestore.indexes.json`: índices para `ratings`, `chats`, `publication_charges`, `payments` agregados.
- Storage paths documentados: `profile_photos/`, `identity_documents/`, `certificates/`, `business_documents/`, `job_post_attachments/`.
- Colecciones Firestore documentadas en uso: `users`, `owners`, `workers`, `businesses`, `job_posts`, `applications`, `chats`, `ratings`, `notifications`, `audit_logs`, `payments`, `publication_charges`.

### 6. Pago USD 1.5 apagado
- `backend/app/config.py`: `PAYMENTS_ENABLED=False`, `PUBLICATION_PRICE_USD=1.5`, `PAYMENT_PROVIDER="stub"`.
- `payment_service.py`: `is_publication_payment_required()`, `create_publication_charge()`, `mark_charge_paid()`, `can_owner_publish()`.
- Cuando `PAYMENTS_ENABLED=False`: `can_owner_publish()` retorna `True`, no bloquea el flujo.
- Cuando `PAYMENTS_ENABLED=True`: retorna `False` (stub, requiere integración real).
- `CreateJobPostModal.tsx`: `PublicationChargeNote` muestra nota discreta según flag:
  - Desactivado: *"Cobro por publicación: USD 1.5. Actualmente desactivado durante pruebas."*
  - Activado: *"Para publicar este turno, debes pagar USD 1.5."*
- Modelo Firestore para `publication_charges` y `payments` documentado.

---

## Archivos modificados
- `backend/.env.example`
- `backend/app/config.py`
- `backend/app/services/application_service.py`
- `firebase/firestore.indexes.json`
- `firebase/firestore.rules`
- `frontend/.env.example`
- `frontend/src/components/marketplace/CreateJobPostModal.tsx`
- `frontend/src/components/marketplace/JobPostDetailModal.tsx`
- `frontend/src/pages/OnboardingPage.tsx`
- `frontend/src/services/jobPosts.ts`
- `frontend/src/types/index.ts`
- `frontend/src/components/worker/IdentityUpload.tsx` *(era nuevo)*

## Archivos creados
- `backend/app/services/payment_service.py`
- `frontend/src/components/worker/IdentityUpload.tsx`
- `frontend/src/components/worker/WorkerVerificationPanel.tsx`
- `frontend/src/services/storage.ts`

---

## Variables nuevas

### Frontend (`frontend/.env.example`)
- `VITE_PAYMENTS_ENABLED=false`
- `VITE_PUBLICATION_PRICE_USD=1.5`
- `VITE_REQUIRE_WORKER_ID_UPLOADS=true`

### Backend (`backend/.env.example`)
- `PAYMENTS_ENABLED=false`
- `PUBLICATION_PRICE_USD=1.5`
- `PAYMENT_PROVIDER=stub`

---

## Cómo probar ahora

1. **Chat controlado**: Postular como worker → login como owner → "Abrir chat" → mensaje aparece en ambos lados. Como worker antes de que owner inicie chat: ver mensaje "El negocio aún no ha iniciado una conversación."

2. **Confirmar parche**: Owner acepta postulante → Worker recibe notificación → Worker hace click en "✓ Confirmar parche" → Owner recibe notificación de confirmación → Worker puede chatear con el negocio.

3. **Onboarding worker**: Crear nueva cuenta como Trabajador → pasar los 3 pasos (básico → consentimiento → fotos) → verificar en Firestore que `data_processing_consent_accepted=true` y `identity_review_status="pending_owner_review"`.

4. **Verificación visual**: Owner abre postulante con fotos → botón "Verificar" → ver foto de perfil y documento lado a lado.

5. **Nota de pago**: En "Publicar turno" ver nota gris "Cobro por publicación: USD 1.5. Actualmente desactivado durante pruebas."

6. **Activar pagos** (test): Setear `VITE_PAYMENTS_ENABLED=true` en `.env.local` → nota cambia a amarilla "Para publicar este turno, debes pagar USD 1.5."

---

## Validaciones ejecutadas
- `npm run build`: ✅ OK (1865 módulos, 0 errores TypeScript)
- `python -c "from app.main import app; print('Backend import OK')"`: ✅ OK
- `git status` post-commit: ✅ limpio (solo `INSTRUCCIONES_ADICIONALES_20260502.md` sin trackear)

---

## Pendientes
- Integrar proveedor de pagos real (Stripe o MercadoPago) cuando `PAYMENTS_ENABLED=True`.
- Mostrar consentimiento y estado de verificación en `ProfilePage.tsx`.
- Backend route para `can_owner_publish()` como guard en `POST /job-posts`.
- Revisión visual del documento de identidad por parte del Negocio: feedback loop (aprobar/rechazar) con actualización de `identity_review_status`.
- Deploy de `firestore.rules` e `firestore.indexes.json` a Firebase (`firebase deploy --only firestore`).

## Riesgos
- Las fotos de perfil subidas via `getDownloadURL()` generan URLs públicas por Firebase Storage. Para documentos de identidad, considerar restringir acceso con tokens firmados en producción.
- `payment_service.py` llama a `get_db()` directamente; si el backend no tiene credenciales GCP en local, la función fallará (no está expuesta como route todavía, por lo que no rompe el flujo actual).
- Sin reconocimiento facial: la comparación visual queda 100% a cargo del negocio — documentado y con disclaimer visible en la UI.
