# SPEC 04 — Panel administrativo: aprobaciones, verificación, catálogos y auditoría

> **Status:** Borrador
> **Depends on:** SPEC 01, SPEC 02, SPEC 03
> **Date:** 2026-10-06
> **Objective:** Un administrador aprueba, rechaza, suspende y verifica prestadores, gestiona categorías, localidades y roles de usuario, y cada acción queda registrada en un log de auditoría imposible de omitir.

## Scope

**In:**

- Rutas `/admin/*` con acceso solo para `role = 'admin'`, verificado en servidor y en BD.
- Cola de prestadores `/admin/prestadores` con filtro por estado; detalle con vista previa del perfil.
- Acciones: aprobar (`published`), rechazar con motivo, suspender con motivo, reactivar.
- Verificación de identidad: el prestador envía una solicitud con documento (bucket privado) desde `/panel/verificacion`; el admin la aprueba o rechaza y se setea `verified_at`.
- CRUD de categorías (nombre, slug, ícono, orden, activa) y localidades (nombre, tipo, padre, lat/lng, activa).
- Gestión de usuarios: listar, ver rol, asignar o quitar `provider`/`admin`, bloquear usuario.
- Tabla `admin_audit_logs` escrita **dentro** de cada función de administración.
- Vista `/admin/auditoria` con filtros por admin, acción y fecha.
- Script documentado para crear el primer admin (SQL manual con `service_role` local).

**Out of scope (para specs futuros):**

- Moderación de reseñas y resolución de reportes (SPEC 05, que agrega sus pestañas al panel).
- Métricas y gráficos (SPEC 06).
- Gestión de planes y destacados (SPEC 07).
- 2FA para administradores.
- Emails de notificación de aprobación o rechazo.
- Múltiples niveles de admin (solo existe `admin`).

## Data model

Migración `0009_admin.sql`:

```sql
create table admin_audit_logs (
  id uuid pk default gen_random_uuid(),
  admin_id uuid not null references profiles(id),
  action text not null,            -- 'provider.approve', 'provider.reject', 'provider.suspend',
                                   -- 'provider.verify', 'category.update', 'user.set_role', ...
  entity_type text not null,       -- 'provider' | 'category' | 'location' | 'profile'
  entity_id uuid not null,
  before jsonb, after jsonb, reason text,
  created_at timestamptz default now()
);
-- RLS: select solo admin; insert/update/delete denegados a todos (solo las funciones lo escriben).

create type verification_status as enum ('pending', 'approved', 'rejected');
create table verification_requests (
  id uuid pk, provider_id uuid references providers, status verification_status default 'pending',
  document_path text not null,     -- bucket privado 'verification-docs'
  reviewer_id uuid references profiles, review_note text,
  created_at timestamptz default now(), reviewed_at timestamptz
);
-- unique parcial: una sola solicitud 'pending' por prestador.
-- RLS: dueño ve y crea las suyas; admin ve y actualiza todas.

alter table profiles add column is_blocked boolean not null default false;
```

Funciones `security definer`, `set search_path = ''`, todas comienzan con `if not public.is_admin() then raise exception`, y escriben la fila de auditoría en la misma transacción:

| Función | Efecto |
| ------- | ------ |
| `admin_approve_provider(id)` | `pending_review` → `published`, setea `published_at` |
| `admin_reject_provider(id, reason)` | → `draft`, setea `rejection_reason` |
| `admin_suspend_provider(id, reason)` / `admin_reactivate_provider(id)` | `published` ↔ `suspended` |
| `admin_review_verification(request_id, approve, note)` | actualiza solicitud y `providers.verified_at` |
| `admin_upsert_category(...)` / `admin_upsert_location(...)` | crea o edita |
| `admin_set_user_role(user_id, role)` | cambia `profiles.role`; no permite que un admin se quite el rol a sí mismo si es el último admin |
| `admin_set_user_blocked(user_id, blocked)` | marca `is_blocked`; no se puede bloquear a sí mismo |

Storage: bucket `verification-docs` **privado**; solo el dueño sube; solo admin lee mediante URL firmada de 60 segundos; máximo 8 MB; `image/jpeg|png|webp` y `application/pdf`.

El panel nunca usa `service_role` en el navegador. Las funciones se llaman con la sesión del admin.

Estructura nueva:

```
src/app/admin/layout.tsx             # require-admin
src/app/admin/{page,prestadores,categorias,localidades,usuarios,auditoria,verificaciones}/...
src/app/panel/verificacion/page.tsx
src/lib/auth/require-admin.ts
yunta_backend/scripts/make-admin.sql # documentado, solo local o manual con confirmación
```

## Implementation plan

1. Migración `0009`: tablas, enum, `is_blocked`, bucket y funciones `admin_*`. Tests pgTAP: un `client` y un `provider` no pueden ejecutar ninguna función `admin_*`; cada función genera exactamente una fila de auditoría.
2. Regenerar tipos. `require-admin` y layout `/admin` con navegación propia.
3. Cola de prestadores y detalle con vista previa; acciones aprobar y rechazar. Verificar que un prestador aprobado aparece en `/buscar` (SPEC 02).
4. Suspender y reactivar. Verificar que el suspendido desaparece de `/buscar` y de su URL pública.
5. Solicitud de verificación en `/panel/verificacion` y revisión en `/admin/verificaciones` con URL firmada.
6. CRUD de categorías y localidades. Verificar que una categoría desactivada desaparece del home.
7. Gestión de usuarios y bloqueo. Un usuario bloqueado no puede entrar al panel.
8. Vista de auditoría con filtros y paginación.
9. `make-admin.sql` y README. Aplicar skills `impeccable` y `frontend-design` con estética densa y funcional, distinta del home.
10. Cierre: `lint`, `tsc`, `vitest`, `build`, `supabase test db`, recorrido manual.

## Acceptance criteria

- [ ] Un usuario no admin que abre `/admin` recibe redirección o 404, no la página.
- [ ] Un `provider` que llama por RPC a `admin_approve_provider` recibe error de permisos.
- [ ] Aprobar un `pending_review` lo pasa a `published` y crea una fila en `admin_audit_logs` con `before` y `after`.
- [ ] Rechazar exige motivo no vacío; el motivo se ve en el panel del prestador.
- [ ] Suspender saca al prestador de `search_providers` y su perfil devuelve 404 a `anon`.
- [ ] Ninguna función `admin_*` puede ejecutarse sin dejar fila de auditoría (test pgTAP por función).
- [ ] `anon` y `authenticated` no pueden hacer `insert`, `update` ni `delete` sobre `admin_audit_logs`.
- [ ] Un admin no puede quitarse el rol si es el último admin.
- [ ] Un admin no puede bloquearse a sí mismo.
- [ ] Un usuario bloqueado es expulsado del panel y no puede enviar el alta.
- [ ] El documento de verificación no es accesible por URL pública; la URL firmada deja de funcionar después de 60 segundos.
- [ ] Aprobar la verificación setea `providers.verified_at` y el badge aparece en tarjeta y perfil.
- [ ] No puede haber dos solicitudes `pending` del mismo prestador.
- [ ] Crear una categoría con `slug` repetido devuelve error de validación, no error 500.
- [ ] Desactivar una categoría la oculta del home y de los filtros, sin borrar prestadores asociados.
- [ ] `/admin/auditoria` filtra por acción y rango de fechas y muestra el admin que actuó.
- [ ] Ninguna página `/admin` incluye `service_role` ni claves en el bundle (`grep` sobre `.next` en build).
- [ ] `npm run lint`, `npx tsc --noEmit`, `npx vitest run`, `npm run build` y `npx supabase test db` terminan con código 0.

## Decisions

- **Sí:** toda mutación admin pasa por funciones SQL que auditan en la misma transacción. Razón: no se puede olvidar el log desde la aplicación.
- **No:** triggers de auditoría genéricos sobre todas las tablas. Razón: ruido y sin contexto de "quién y por qué".
- **Sí:** un solo rol `admin`. Razón: un solo operador al inicio; roles granulares se evalúan si hace falta.
- **Sí:** primer admin creado a mano por SQL. Razón: ninguna ruta pública puede otorgarlo.
- **Sí:** documentos de verificación en bucket privado con URL firmada corta. Razón: datos personales sensibles.
- **No:** guardar el número de documento en la BD. Razón: minimizar datos personales; el admin lo ve en el archivo.
- **Sí:** reportes y reseñas se moderan en SPEC 05, no acá. Razón: sus tablas no existen todavía.
- **Definición rápida sin clarificación detallada:** spec redactado sin ronda de preguntas, a pedido del usuario. Revisar: qué documento se pide para verificar, y si el rechazo devuelve a `draft` o a un estado propio `rejected`.

## Risks

| Riesgo | Mitigación |
| ------ | ---------- |
| Función `security definer` sin chequeo de admin | Cada función empieza con `is_admin()`; test pgTAP recorre todas por catálogo `pg_proc` con prefijo `admin_` |
| Admin único bloqueado o sin rol | Guardas de último admin y de autobloqueo; script de recuperación manual en el README |
| Fuga de documentos de identidad | Bucket privado, URL firmada de 60 s, sin listado público; revisión de políticas en tests |
| Cuenta admin comprometida | 2FA fuera de alcance; anotado como pre-requisito antes de abrir al público |

## What is **not** in this spec

- Moderación de reseñas y reportes.
- Métricas y gráficos.
- Planes y destacados.
- Emails de notificación y 2FA.

Cada uno va en su propio spec.
