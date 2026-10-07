# SPEC 05 — Confianza: reseñas, favoritos y reportes con moderación

> **Status:** Borrador
> **Depends on:** SPEC 01, SPEC 02, SPEC 03, SPEC 04
> **Date:** 2026-10-06
> **Objective:** Los clientes registrados pueden reseñar, guardar favoritos y reportar prestadores, y los administradores moderan reseñas y reportes, de modo que la calificación mostrada sea siempre real y auditable.

## Scope

**In:**

- Tabla `reviews` con calificación 1 a 5, comentario, estado de moderación y respuesta única del prestador.
- Una reseña por usuario y prestador. No se puede reseñar el propio perfil.
- Publicación de reseñas con moderación posterior: nacen `pending` y se muestran al aprobarse (ver Decisions).
- Agregados `providers.rating_avg` y `providers.rating_count` mantenidos por trigger solo con reseñas `approved`.
- Calificación visible en tarjetas y perfil; filtro por calificación mínima y orden por calificación en `search_providers`.
- Tabla `favorites` y botón guardar en tarjeta y perfil; página `/cuenta/favoritos`.
- Tabla `reports` y botón "Reportar perfil" con motivo y detalle opcional.
- Pestañas `/admin/resenas` y `/admin/reportes`: aprobar, rechazar, ocultar, resolver; todo con auditoría (SPEC 04).
- Protección contra abuso: límite por usuario y por IP en reseñas y reportes.
- Cuenta de cliente: `/cuenta` con nombre, favoritos y mis reseñas.

**Out of scope (para specs futuros):**

- Reseñas "de contratación verificada" (no existe un flujo de contratación; abrir WhatsApp no cuenta).
- Fotos en reseñas.
- Votos de utilidad sobre reseñas.
- Notificaciones por email al prestador.
- Detección automática de contenido ofensivo con IA.
- Métricas de reseñas y reportes (SPEC 06).

## Data model

Migración `0010_trust.sql`:

```sql
create type review_status as enum ('pending', 'approved', 'rejected', 'hidden');
create table reviews (
  id uuid pk default gen_random_uuid(),
  provider_id uuid not null references providers on delete cascade,
  author_id uuid not null references profiles on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text check (char_length(comment) between 10 and 1000),
  status review_status not null default 'pending',
  provider_reply text check (char_length(provider_reply) <= 500),
  provider_replied_at timestamptz,
  moderation_note text,
  created_at timestamptz default now(), updated_at timestamptz default now(),
  unique (provider_id, author_id)
);
-- check: author_id <> (select owner_id from providers where id = provider_id)  (trigger)

alter table providers add column rating_avg numeric(3,2), add column rating_count int not null default 0;
-- trigger recalcula con reviews 'approved' tras insert/update/delete.

create table favorites (
  user_id uuid references profiles on delete cascade,
  provider_id uuid references providers on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, provider_id)
);

create type report_reason as enum ('fake_info', 'inappropriate', 'scam', 'wrong_contact', 'other');
create type report_status as enum ('open', 'reviewing', 'resolved', 'dismissed');
create table reports (
  id uuid pk, provider_id uuid references providers on delete cascade,
  reporter_id uuid references profiles on delete set null,
  reason report_reason not null, detail text check (char_length(detail) <= 500),
  status report_status default 'open', resolution_note text,
  resolved_by uuid references profiles, created_at timestamptz default now(), resolved_at timestamptz
);
-- unique parcial: un reporte 'open' por (reporter_id, provider_id).
```

RLS:

| Tabla | Lectura | Escritura |
| ----- | ------- | --------- |
| `reviews` | `anon`: solo `approved` de prestadores publicados; autor ve las suyas; admin todas | autor `insert` (siempre `pending`) y `update` solo si `pending`; prestador solo actualiza `provider_reply` de sus reseñas `approved`; admin vía funciones |
| `favorites` | solo el dueño | solo el dueño |
| `reports` | autor ve los suyos; admin todos | usuario autenticado `insert`; admin vía funciones |

Funciones nuevas con auditoría: `admin_moderate_review(id, status, note)` y `admin_resolve_report(id, status, note)`. Mismo patrón y mismas reglas que SPEC 04.

Cambio en `search_providers`: devuelve `rating_avg` y `rating_count`; agrega `p_min_rating numeric` y `p_sort = 'rating'`. Es una migración nueva que reemplaza la función con `create or replace`, manteniendo compatibilidad de los parámetros existentes.

Abuso: tabla auxiliar `rate_limits(key text, window_start timestamptz, count int)` y función `check_rate_limit(key, max, window)` usada por las acciones; límites iniciales: 3 reseñas por usuario por día, 5 reportes por usuario por día.

Estructura nueva:

```
src/app/cuenta/{page,favoritos,resenas}/page.tsx
src/components/trust/{review-list,review-form,rating-stars,favorite-button,report-dialog}.tsx
src/app/admin/{resenas,reportes}/page.tsx
src/app/panel/resenas/page.tsx        # el prestador ve y responde
```

## Implementation plan

1. Migración `0010`: tablas, triggers, RLS, `rate_limits`, funciones admin. Tests pgTAP de cada regla.
2. Migración `0011`: `search_providers` con calificación. Tests de filtro y orden.
3. Regenerar tipos. Componentes `RatingStars` y `ReviewList`; mostrar calificación real en tarjetas y perfil (sin reseñas: "Sin reseñas todavía").
4. Formulario de reseña con validación Zod y límite. Verificar que queda `pending` y no se ve públicamente.
5. Moderación en `/admin/resenas`. Verificar que al aprobar cambia `rating_avg` y aparece en el perfil.
6. Respuesta del prestador en `/panel/resenas`.
7. Favoritos: botón, `/cuenta/favoritos`; para anónimos el botón lleva a `/acceso` con retorno.
8. Reportes: diálogo, `/admin/reportes`, resolución con nota.
9. Filtro y orden por calificación en `/buscar`.
10. Cierre: `lint`, `tsc`, `vitest`, `build`, `supabase test db`, prueba manual con tres usuarios.

## Acceptance criteria

- [ ] Un usuario sin sesión no puede crear reseña, favorito ni reporte (error de RLS y redirección en UI).
- [ ] Crear una reseña la deja en `pending` y no aparece para `anon`.
- [ ] Un mismo usuario no puede crear una segunda reseña para el mismo prestador.
- [ ] El dueño de un prestador no puede reseñar su propio perfil.
- [ ] Comentarios de menos de 10 o más de 1000 caracteres son rechazados.
- [ ] Aprobar una reseña actualiza `rating_avg` y `rating_count` del prestador; rechazarla u ocultarla los recalcula.
- [ ] `rating_avg` es `null` y no se muestran estrellas cuando `rating_count = 0`.
- [ ] El prestador solo puede editar `provider_reply` de reseñas aprobadas de su perfil, máximo 500 caracteres.
- [ ] Un cuarto intento de reseña en el mismo día de un mismo usuario es bloqueado por el límite.
- [ ] Agregar y quitar favorito funciona y `/cuenta/favoritos` solo muestra los del usuario actual.
- [ ] El usuario A no puede leer favoritos del usuario B.
- [ ] Un reporte duplicado `open` del mismo usuario al mismo prestador es rechazado.
- [ ] Resolver un reporte y moderar una reseña dejan cada uno una fila en `admin_audit_logs`.
- [ ] `/buscar?calificacion_min=4` devuelve solo prestadores con `rating_avg >= 4`.
- [ ] Un prestador suspendido deja de mostrar sus reseñas públicamente.
- [ ] Eliminar un prestador elimina en cascada sus reseñas, favoritos y reportes.
- [ ] No hay ninguna calificación inventada en seed ni en UI: los prestadores demo sin reseñas aprobadas muestran "Sin reseñas todavía".
- [ ] `npm run lint`, `npx tsc --noEmit`, `npx vitest run`, `npm run build` y `npx supabase test db` terminan con código 0.

## Decisions

- **Sí:** moderación previa (`pending` → `approved`). Razón: base chica, riesgo alto de spam o reseñas falsas en el arranque; se puede pasar a posterior con un cambio de default (por defecto, sin confirmar).
- **Sí:** cualquier cliente registrado puede reseñar, y la UI nunca lo llama "contratación verificada". Razón: el maestro exige diferenciar identidad verificada, perfil publicado y reputación; no hay flujo que pruebe un trabajo realizado.
- **No:** reseñas anónimas. Razón: sin cuenta no hay forma de limitar abuso.
- **Sí:** un único `unique (provider_id, author_id)` y respuesta única del prestador. Razón: simplicidad.
- **Sí:** agregados materializados en `providers` por trigger. Razón: ordenar y filtrar por calificación sin `join` y `avg` en cada búsqueda.
- **Sí:** `reporter_id on delete set null`. Razón: conservar el reporte si el usuario se elimina.
- **Sí:** límites de tasa en BD (`rate_limits`). Razón: aplican aunque se llame la API directo.
- **No:** captcha en este spec. Razón: se evalúa si los límites no alcanzan.
- **Definición rápida sin clarificación detallada:** spec redactado sin ronda de preguntas. Revisar: moderación previa vs posterior, y el motivo de la lista cerrada de `report_reason`.

## Risks

| Riesgo | Mitigación |
| ------ | ---------- |
| Reseñas falsas cruzadas entre prestadores amigos | Moderación previa y reportes; revisión manual de patrones; fuera de alcance detección automática |
| Prestador presiona o difama a reseñadores | Reseña mostrada solo con nombre corto (nombre y inicial); sin datos de contacto del autor |
| Trigger de agregados lento o inconsistente | Recalcular solo el prestador afectado; test que compara con `avg()` directo |
| Cola de moderación crece sin atención | Contador pendiente en el dashboard admin; métricas completas en SPEC 06 |
| `create or replace` de `search_providers` rompe consumidores | Parámetros nuevos con `default`; tests de SPEC 02 se ejecutan sin cambios |

## What is **not** in this spec

- Contratación verificada, fotos o votos en reseñas.
- Emails de notificación.
- Detección automática de contenido ofensivo.
- Métricas, eventos de contacto, SEO y mapas.

Cada uno va en su propio spec.
