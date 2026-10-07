# SPEC 06 — Descubrimiento y medición: eventos, métricas, SEO, mapas y páginas institucionales

> **Status:** Borrador
> **Depends on:** SPEC 01, SPEC 02, SPEC 03, SPEC 04, SPEC 05
> **Date:** 2026-10-06
> **Objective:** Registrar de forma anónima búsquedas, visitas y contactos, mostrarlos en paneles de métricas, mejorar la indexación y sumar mapa y distancia a los resultados.

## Scope

**In:**

- Tabla `contact_events` (clic en WhatsApp o teléfono) y `search_events` (búsquedas), sin datos personales.
- Tabla `profile_views` (visita a perfil) agregada por día, no por persona.
- Registro de eventos mediante RPC con límite de tasa; no bloquea la acción del usuario si falla.
- Panel del prestador: contactos y visitas por día, últimos 30 días (`/panel/estadisticas`).
- Panel admin: búsquedas más frecuentes, categorías populares, búsquedas sin resultados, prestadores activos, conversión búsqueda a contacto, actividad por localidad (`/admin/metricas`).
- SEO: `generateMetadata` por página, Open Graph, `sitemap.ts`, `robots.ts`, datos estructurados `LocalBusiness` en perfiles, canonical, `noindex` para búsquedas con filtros y páginas vacías.
- Páginas por categoría y localidad indexables (`/servicios/[categoria]`, `/servicios/[categoria]/[localidad]`) solo si tienen al menos 1 prestador publicado.
- Mapa de resultados y mapa de ubicación aproximada en el perfil.
- Distancia en tarjetas si el visitante comparte ubicación.
- Páginas institucionales: Contacto, Términos, Privacidad, Cómo funciona.
- Banner de privacidad informativo que explica las métricas anónimas.

**Out of scope (para specs futuros):**

- Cookies de terceros, Google Analytics, píxeles de seguimiento.
- Embudo por usuario, identificación de visitantes, perfiles de comportamiento.
- Domicilio exacto de prestadores: solo ubicación aproximada.
- Navegación paso a paso (ruteo) o cálculo de tiempos de viaje.
- Búsqueda por voz o por imagen.
- Reportes exportables y alertas.
- Facturación y datos de monetización (SPEC 07).

## Data model

Migración `0012_events_metrics.sql`:

```sql
create type contact_channel as enum ('whatsapp', 'phone');

create table contact_events (
  id uuid pk default gen_random_uuid(),
  provider_id uuid not null references providers on delete cascade,
  channel contact_channel not null,
  source text check (source in ('search', 'profile', 'home', 'favorites')),
  location_id uuid references locations,      -- localidad buscada, si hay
  created_at timestamptz default now()
);                                            -- sin user_id, sin IP, sin user agent

create table search_events (
  id uuid pk, query_normalized text, category_id uuid, location_id uuid,
  filters jsonb, result_count int not null, created_at timestamptz default now()
);                                            -- query truncada a 80 caracteres, sin identificadores

create table profile_views (
  provider_id uuid references providers on delete cascade,
  day date, views int not null default 0,
  primary key (provider_id, day)
);                                            -- incremento atómico con upsert
```

RPC con `security definer`, `search_path = ''`: `log_contact_event(...)`, `log_search_event(...)`, `bump_profile_view(provider_id)`. Todas validan que el prestador esté `published`, aplican `check_rate_limit` (SPEC 05) con clave hasheada y no devuelven datos. Nadie puede leer las tablas de eventos directamente.

Vistas con acceso restringido: `provider_stats_daily` (RLS: solo el dueño), y funciones `admin_metrics_*` (solo `is_admin()`).

Mapas y distancia (migración `0013_geo.sql`): se agrega `providers.approx_lat` y `providers.approx_lng` `numeric(9,6)` redondeadas a 3 decimales (~110 m) por trigger; si el prestador es de tipo `professional`, se redondea a 2 decimales (~1,1 km). Distancia con fórmula de Haversine en SQL (`search_providers` recibe `p_lat`, `p_lng` opcionales y devuelve `distance_km`). PostGIS sigue sin usarse.

Proveedor de mapa: se mide con una prueba técnica (paso 7) entre OpenStreetMap con MapLibre y Google Maps; el criterio es costo mensual estimado para 10 000 vistas y calidad de teselas en Jujuy. La decisión se registra en este spec antes de implementar el mapa definitivo.

Estructura nueva:

```
src/app/(public)/servicios/[categoria]/[[...localidad]]/page.tsx
src/app/(public)/{contacto,terminos,privacidad,como-funciona}/page.tsx
src/app/sitemap.ts  src/app/robots.ts
src/app/panel/estadisticas/page.tsx
src/app/admin/metricas/page.tsx
src/components/map/{results-map,provider-map}.tsx
src/lib/events.ts                    # envío con navigator.sendBeacon y fallback silencioso
src/lib/seo.ts                       # helpers de metadata y JSON-LD
```

## Implementation plan

1. Migración `0012`: tablas, RPC, vistas y funciones de métricas con RLS. Tests pgTAP: nadie lee `contact_events` directo; el dueño solo ve sus estadísticas; las RPC ignoran prestadores no publicados.
2. `lib/events.ts` y registro de contacto en el botón WhatsApp (SPEC 02). Verificar que abrir WhatsApp funciona aunque el registro falle.
3. Registro de búsquedas y visitas en `/buscar` y perfil.
4. `/panel/estadisticas`.
5. `/admin/metricas`.
6. Metadata, Open Graph, `sitemap.ts`, `robots.ts`, JSON-LD y `noindex` condicional.
7. Prueba técnica de proveedor de mapa; registrar la decisión en este documento.
8. Migración `0013` (coordenadas aproximadas, distancia) y captura de ubicación aproximada en el alta (SPEC 03, paso de zonas).
9. Mapa en resultados y perfil; permiso de ubicación del visitante y distancia en tarjetas.
10. Páginas por categoría y localidad con `generateStaticParams` limitado a combinaciones con prestadores.
11. Páginas institucionales con datos reales de contacto proporcionados por el titular y texto legal revisado por una persona responsable (pre-requisito: el titular entrega esos datos y textos).
12. Cierre: Lighthouse móvil, `lint`, `tsc`, `vitest`, `build`, `supabase test db`.

## Acceptance criteria

- [ ] Las tablas `contact_events`, `search_events` y `profile_views` no tienen columnas de usuario, IP ni user agent.
- [ ] Con clave anon, `select` sobre `contact_events` y `search_events` falla.
- [ ] Un clic en WhatsApp crea una fila en `contact_events` con `channel = 'whatsapp'` y el enlace se abre aunque la RPC devuelva error.
- [ ] Registrar un evento para un prestador no publicado es rechazado.
- [ ] Más de 30 eventos por minuto desde la misma clave devuelven error de límite.
- [ ] La query de `search_events` se guarda en minúsculas, sin tildes y con máximo 80 caracteres.
- [ ] `/panel/estadisticas` muestra solo datos del propio prestador; otro usuario no puede leerlos por RPC.
- [ ] `/admin/metricas` lista búsquedas sin resultados, categorías populares y actividad por localidad con rango de fechas.
- [ ] "Contactos" nunca se muestra como "trabajos contratados".
- [ ] `/sitemap.xml` incluye perfiles `published` y excluye borradores, suspendidos y demo.
- [ ] `/robots.txt` bloquea `/panel`, `/admin`, `/cuenta` y `/api`.
- [ ] `/buscar` con filtros tiene `noindex`; `/servicios/<categoria>` sin prestadores devuelve 404.
- [ ] Cada perfil público tiene `title`, `description`, Open Graph, canonical y JSON-LD `LocalBusiness` válido sin domicilio exacto.
- [ ] El mapa de un perfil muestra una zona aproximada y no el punto exacto (coordenadas redondeadas en BD).
- [ ] La distancia solo se muestra si el visitante dio permiso de ubicación y el prestador tiene coordenadas.
- [ ] Lighthouse móvil en home y perfil: Performance >= 85, SEO >= 95, Accesibilidad >= 90.
- [ ] Las páginas Contacto, Términos y Privacidad existen con el contenido proporcionado por el titular, sin texto de relleno.
- [ ] `npm run lint`, `npx tsc --noEmit`, `npx vitest run`, `npm run build` y `npx supabase test db` terminan con código 0.

## Decisions

- **Sí:** métricas propias en Postgres, anónimas. Razón: cumple "evitar datos personales innecesarios" y evita depender de terceros.
- **No:** Google Analytics. Razón: cookies y datos personales; si se necesita luego, va en spec propio con aviso de consentimiento.
- **Sí:** `profile_views` agregado por día. Razón: no almacena un registro por visitante.
- **Sí:** el evento de contacto se llama "contacto iniciado". Razón: el maestro prohíbe afirmar contratación.
- **Sí:** coordenadas aproximadas redondeadas por trigger en BD. Razón: no exponer domicilios aunque el frontend falle.
- **No:** PostGIS por ahora. Razón: Haversine alcanza para ordenar por distancia con volumen chico; se migra si hay degradación medida.
- **Pendiente con criterio de decisión:** proveedor de mapas (OpenStreetMap + MapLibre o Google Maps) se decide en el paso 7 con costo y calidad medidos.
- **Sí:** páginas por categoría y localidad solo con contenido real. Razón: el maestro prohíbe páginas vacías o duplicadas.
- **Sí:** contenido institucional lo provee el titular. Razón: datos de contacto y texto legal no se inventan.
- **Definición rápida sin clarificación detallada:** spec redactado sin ronda de preguntas, a pedido del usuario. Revisar: alcance (agrupa 4 dominios; si resulta grande, dividir mapas en un SPEC 06b), umbrales de Lighthouse y retención de eventos.

## Risks

| Riesgo | Mitigación |
| ------ | ---------- |
| Spec grande (métricas, SEO, mapas, institucional) | Pasos independientes y commiteables; separar mapas en otro spec si el paso 7 muestra alto costo |
| Inflado de métricas con bots | Límite de tasa y exclusión de user agents conocidos de bots en la RPC (se evalúa sin guardarlo) |
| Costo de Google Maps | Prueba técnica previa y alternativa MapLibre + teselas OpenStreetMap con atribución |
| Reidentificación por combinaciones raras de evento y localidad | Sin timestamp exacto en vistas agregadas; retención de eventos crudos limitada (por definir en revisión) |
| Texto legal incorrecto | No se escribe texto legal sin revisión del titular |

## What is **not** in this spec

- Analytics de terceros y seguimiento por persona.
- Domicilio exacto, ruteo y tiempos de viaje.
- Reportes exportables.
- Planes, pagos y destacados.

Cada uno va en su propio spec.
