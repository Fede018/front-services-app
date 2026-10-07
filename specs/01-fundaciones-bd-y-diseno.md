# SPEC 01 — Fundaciones: base de datos Supabase, esqueleto Next.js y sistema de diseño

> **Status:** Implementado
> **Depends on:** ninguno
> **Date:** 2026-10-06
> **Objective:** Dejar corriendo en local el esquema núcleo de Supabase (con RLS y datos de referencia) en `yunta_backend`, un proyecto Next.js conectado a él en `yunta_frontend`, y los tokens y componentes base del sistema de diseño de YUNTA.

## Por qué existe este spec

El "SPEC MAESTRO" original abarca 6 fases y más de 5 dominios (BD, búsqueda, auth, admin, reseñas, pagos). No se puede verificar de una vez. Se divide en specs secuenciales. Este es el primero: sin esquema, RLS ni sistema de diseño, ninguno de los siguientes se puede construir ni verificar.

Hoja de ruta (cada uno se escribe con `/spec` cuando toque; **no** forman parte de este spec):

| Spec | Contenido                                                                                                            |
| ---- | -------------------------------------------------------------------------------------------------------------------- |
| 02   | Home con hero `noche_ciudad`, función `search_providers`, resultados, filtros, perfil público, botón WhatsApp        |
| 03   | Auth, registro guiado de prestadores, panel del prestador, imágenes, horarios, disponibilidad                        |
| 04   | Panel admin: aprobaciones, verificación, suspensión, categorías, localidades, usuarios, auditoría                    |
| 05   | Confianza: reseñas, favoritos, reportes, moderación de ambos                                                         |
| 06   | Descubrimiento y medición: eventos de contacto y búsqueda, métricas, SEO, mapas y distancia, páginas institucionales |
| 07   | Monetización: planes, suscripciones, destacados, Mercado Pago, webhooks                                              |

## Estado real detectado al escribir el spec

- `C:\aplicaciones\backend\yunta_backend` existe y está **vacío**.
- `C:\aplicaciones\frontend\yunta_frontend` solo contiene `references/` (`dis_pag.png`, `elem_pag.png`, `noche_ciudad.jpg`). No hay `package.json`, ni git, ni migraciones, ni proyecto Supabase local.
- El texto original asumía migraciones y trabajo previo en Supabase. **No existen.** Se parte de cero.
- Instalado: Node 24.18, npm 11.16, Docker 29.6, git 2.52. No instalado: Supabase CLI (se usa con `npx supabase`).
- El usuario tiene un proyecto Supabase en el navegador, que **no** se toca en este spec.
- `references/dis_pag.png` menciona "pagar con Solana". Eso **no** es parte de YUNTA: el proveedor de pagos es Mercado Pago (SPEC 07).

## Scope

**In:**

- Inicializar Supabase CLI en `yunta_backend` (`supabase/config.toml`, `migrations/`, `seed.sql`, `tests/`) y `git init` local en ambos proyectos.
- Migraciones incrementales con el esquema núcleo: `profiles`, `locations`, `categories`, `providers`, `provider_categories`, `services`, `provider_coverage_areas`, `business_hours`, `availability_status`, `provider_images`.
- Extensiones `pg_trgm` y `unaccent`, columna `providers.search_vector` con trigger e índices. **Sin** la función de búsqueda.
- RLS en todas las tablas. Rol `admin` no asignable por el propio usuario.
- Bucket Storage `provider-images` con política por propietario, tipos MIME y tamaño máximo.
- Datos de referencia reales como migración: 23 categorías y localidades de Jujuy.
- `seed.sql` con prestadores demo, marcados `is_demo = true`, solo para desarrollo local.
- Tests SQL (pgTAP, `supabase test db`) de RLS y escalada de rol.
- Proyecto Next.js (App Router, TypeScript, Tailwind) en `yunta_frontend`.
- Clientes Supabase (server y browser), variables de entorno y tipos generados desde la BD local.
- Tokens de diseño semánticos y componentes base: `Button`, `Input`, `Badge`, `Card`.
- Página temporal `/` que lista categorías leídas de la BD local, y `/dev/design-system` (solo en desarrollo).

**Out of scope (para specs futuros):**

- Función `search_providers`, filtros, resultados, home final, hero, perfil público (SPEC 02).
- Auth UI, registro de prestadores, paneles (SPEC 03 y 04).
- Tablas `reviews`, `favorites`, `reports` (SPEC 05) y `contact_events`, `search_events` (SPEC 06).
- Tablas `plans`, `subscriptions`, `payments`, `featured_listings` y Mercado Pago (SPEC 07).
- `admin_audit_logs` (SPEC 04, junto con el panel admin).
- Mapas, PostGIS y cálculo de distancia (SPEC 06).
- Aplicar migraciones al proyecto Supabase cloud (paso manual posterior, con confirmación expresa).
- Deploy a Vercel, remoto git, CI.
- App móvil.
- Zonas/barrios de San Salvador de Jujuy (no se inventan; se cargan cuando haya fuente confiable).

## Data model

Convenciones: PK `uuid default gen_random_uuid()`, `created_at`/`updated_at timestamptz default now()` con trigger `set_updated_at`, precios en `numeric(12,2)` con `currency char(3) check (currency = 'ARS')`, nombres en inglés snake_case.

```sql
-- Enums
create type user_role        as enum ('client', 'provider', 'admin');
create type provider_type    as enum ('professional', 'business');
create type provider_status  as enum ('draft', 'pending_review', 'published', 'suspended');
create type availability_state as enum ('available_now', 'available_today', 'unavailable');
create type location_kind    as enum ('province', 'city', 'zone');

-- profiles: 1:1 con auth.users. role siempre 'client' al crearse.
profiles(id uuid pk references auth.users on delete cascade,
         full_name text, avatar_url text, role user_role not null default 'client')

locations(id, parent_id uuid references locations, name text, slug text unique,
          kind location_kind, lat numeric(9,6), lng numeric(9,6),
          is_active bool default false, sort_order int)

categories(id, parent_id uuid references categories, name text, slug text unique,
           icon text,            -- nombre de ícono de la librería elegida, no emoji
           is_active bool default true, sort_order int)

providers(id, owner_id uuid references profiles, slug text unique,
          business_name text, provider_type provider_type, description text,
          whatsapp text check (whatsapp ~ '^\+[1-9][0-9]{7,14}$'),  -- E.164
          phone text, location_id uuid references locations,
          offers_home_visit bool default false, offers_delivery bool default false,
          status provider_status default 'draft',
          verified_at timestamptz,          -- null = no verificado
          is_demo bool default false,
          published_at timestamptz,
          search_vector tsvector)           -- trigger: nombre + descripción + categorías, config 'spanish' + unaccent

provider_categories(provider_id, category_id, primary key (provider_id, category_id))

services(id, provider_id, name text, description text,
         price_from numeric(12,2), price_to numeric(12,2),
         currency char(3) default 'ARS' check (currency = 'ARS'),
         price_unit text,                   -- 'por hora', 'por trabajo', etc.
         is_active bool default true,
         check (price_to is null or price_to >= price_from))

provider_coverage_areas(provider_id, location_id, primary key (provider_id, location_id))

business_hours(id, provider_id, weekday smallint check (weekday between 0 and 6),
               opens_at time, closes_at time, check (closes_at > opens_at))

availability_status(provider_id pk, state availability_state default 'unavailable',
                    note text, updated_at timestamptz default now())
                    -- declarada por el prestador; updated_at se muestra como "última actualización"

provider_images(id, provider_id, storage_path text, alt text,
                sort_order int default 0, is_cover bool default false)
```

Índices mínimos: `providers(status, location_id)`, `providers using gin(search_vector)`, `providers using gin(business_name gin_trgm_ops)` sobre `business_name`, `services(provider_id)`, `provider_categories(category_id)`, `business_hours(provider_id, weekday)`.

Reglas RLS:

| Tabla                                                                                    | Lectura pública (anon)                | Escritura                                                                                          |
| ---------------------------------------------------------------------------------------- | ------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `categories`, `locations`                                                                | solo `is_active`                      | solo `is_admin()`                                                                                  |
| `providers`                                                                              | solo `status = 'published'`           | dueño sobre las suyas (no puede pasar `status` a `published` ni cambiar `verified_at`); admin todo |
| hijas de `providers` (`services`, `business_hours`, `provider_*`, `availability_status`) | solo si el prestador está `published` | dueño del prestador; admin todo                                                                    |
| `profiles`                                                                               | cada usuario su fila; admin todas     | usuario edita su fila **sin** poder cambiar `role`; admin cambia `role`                            |

Función `public.is_admin()`: `security definer`, `set search_path = ''`, lee `profiles.role`.

Storage `provider-images`: lectura pública, escritura solo en la carpeta `{provider_id}/` si el usuario es dueño, MIME `image/jpeg|png|webp`, máximo 5 MB.

Datos de referencia (migración, aplican también en cloud):

- Localidades: provincia Jujuy; ciudades San Salvador de Jujuy y Palpalá con `is_active = true`; Perico, El Carmen, San Pedro y Libertador General San Martín con `is_active = false`.
- Categorías: las 23 de la sección 21 del spec maestro, con `slug` y `icon`, todas `is_active = true`.

`seed.sql` (solo local): 6 a 8 prestadores demo con `is_demo = true`, `business_name` con prefijo `[DEMO]`, `whatsapp` con formato válido pero ficticio y servicios con precios ARS. Nunca se aplica al cloud.

Frontend, estructura nueva:

```
yunta_frontend/
  .env.example                  # NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
  src/app/globals.css           # tokens semánticos con @theme
  src/app/page.tsx              # temporal: lista categorías
  src/app/dev/design-system/page.tsx   # notFound() si NODE_ENV === 'production'
  src/components/ui/{button,input,badge,card}.tsx
  src/lib/supabase/{server,browser}.ts
  src/types/database.ts         # generado, no editar a mano
```

Backend, estructura nueva:

```
yunta_backend/
  README.md                     # cómo levantar, resetear y linkear
  supabase/{config.toml, seed.sql}
  supabase/migrations/          # 0001..000N, solo incrementales
  supabase/tests/               # *.test.sql (pgTAP)
```

Tokens semánticos (nombres fijos; los valores hex se afinan en el paso 11 con las skills de diseño, partiendo de `dis_pag`): `--color-bg`, `--color-surface`, `--color-surface-raised`, `--color-border`, `--color-text`, `--color-text-muted`, `--color-accent` (violeta), `--color-accent-contrast`, `--color-success` (verde WhatsApp), `--color-warning`, `--color-danger`, `--radius-sm|md|lg`, `--shadow-card`, `--shadow-raised`.

## Implementation plan

Cada paso deja el sistema ejecutable y es commiteable por separado.

1. **Backend init.** En `C:\aplicaciones\backend\yunta_backend`: `git init`, `.gitignore`, `npx supabase init`, `README.md`. Verificar: `npx supabase start` levanta y Studio abre en `http://127.0.0.1:54323`.
2. **Migración 0001 base.** Extensiones `pg_trgm`, `unaccent`; enums; función `set_updated_at()`. Verificar: `npx supabase db reset` sin errores.
3. **Migración 0002 profiles.** Tabla, trigger `handle_new_user` (siempre `role = 'client'`), trigger que bloquea cambio de `role` salvo `service_role`/admin, `is_admin()`, RLS. Verificar: crear usuario en Studio genera su fila con `role = 'client'`.
4. **Migración 0003 locations y categories** con RLS e índices.
5. **Migración 0004 datos de referencia** (23 categorías, localidades). Verificar: `select count(*) from categories` = 23.
6. **Migración 0005 providers y tablas hijas**, constraints, índices, trigger de `search_vector`, RLS.
7. **Migración 0006 Storage** bucket `provider-images` y políticas.
8. **`seed.sql` demo** y `db reset`. Verificar: los demo existen y `search_vector` no es nulo.
9. **Tests pgTAP** en `supabase/tests/`. Verificar: `npx supabase test db` pasa.
10. **Frontend scaffold.** `create-next-app` (TypeScript, Tailwind, App Router, `src/`, alias `@/*`, ESLint) en `yunta_frontend` preservando `references/` y `specs/`. `git init`. Verificar: `npm run dev` sirve la página por defecto.
11. **Skills de diseño y tokens.** Invocar `impeccable` y `frontend-design`, releer `references/dis_pag.png` y `elem_pag.png`, definir tokens en `globals.css`, tipografía con `next/font` (máx. 2 familias) y los 4 componentes base con todos sus estados (hover, focus visible, disabled, error). Verificar: `/dev/design-system` los muestra.
12. **Conexión a Supabase.** `npm i @supabase/supabase-js @supabase/ssr`, `.env.example`, `.env.local` con claves **locales** que imprime `supabase start`, clientes en `src/lib/supabase/`, `npx supabase gen types typescript --local > src/types/database.ts` (ejecutado desde `yunta_backend`). Verificar: tipos generados compilan.
13. **Página `/` temporal** que lista categorías activas desde la BD local, con estados de carga y error. Verificar en el navegador a 375 px y 1280 px.
14. **Cierre.** `npm run lint`, `npx tsc --noEmit`, `npm run build`, `npx supabase test db`.

## Acceptance criteria

- [x] `npx supabase start` en `yunta_backend` levanta sin errores y `npx supabase db reset` aplica migraciones y seed sin errores.
- [x] Existen las 10 tablas del esquema núcleo y todas tienen RLS habilitado (`select relrowsecurity` es `true` para cada una).
- [x] `select count(*) from categories where is_active` devuelve 23.
- [x] `select count(*) from locations where kind = 'city' and is_active` devuelve 2 (San Salvador de Jujuy y Palpalá).
- [x] Como `anon`, `select` sobre `providers` devuelve solo filas con `status = 'published'`.
- [x] Como `anon`, `insert`, `update` y `delete` sobre cualquier tabla núcleo fallan.
- [x] Un usuario autenticado `client` que ejecuta `update profiles set role = 'admin'` sobre su fila falla o no cambia el valor.
- [x] Un usuario autenticado nuevo tiene `profiles.role = 'client'` aunque envíe `role: 'admin'` en `raw_user_meta_data`.
- [x] Un prestador no puede poner `status = 'published'` ni `verified_at` en su propia fila; sí puede pasar `draft` a `pending_review`.
- [x] Un prestador no puede leer ni editar `services` de otro prestador no publicado.
- [x] Insertar `services` con `currency = 'USD'` falla.
- [x] Insertar `providers.whatsapp = '3884123456'` (sin `+54`) falla por el check E.164.
- [x] Subir a `provider-images` un archivo `.pdf` o de más de 5 MB falla; subir un `.jpg` de 1 MB en la carpeta propia funciona.
- [x] Todos los prestadores del seed tienen `is_demo = true` y `business_name` que empieza con `[DEMO]`.
- [x] `npx supabase test db` termina con todos los tests en verde.
- [x] Ningún archivo versionado contiene `service_role` ni claves reales (verificado con `git grep -i service_role` y revisión de `.env*` en `.gitignore`).
- [x] `npm run lint`, `npx tsc --noEmit` y `npm run build` terminan con código 0.
- [x] `/dev/design-system` muestra `Button`, `Input`, `Badge` y `Card` con estados hover, focus visible, disabled y error; el foco se ve con teclado.
- [x] En producción (`npm run build && npm start`) `/dev/design-system` responde 404.
- [x] `/` lista las 23 categorías leídas de la BD local y muestra mensaje de error si la BD está apagada.
- [x] `/` no genera scroll horizontal a 375 px de ancho.
- [x] Los contrastes texto/fondo de los tokens cumplen WCAG AA (4.5:1 texto normal) verificado con herramienta.
- [x] `references/` y `specs/` siguen intactos en `yunta_frontend`.
- [x] Ninguna migración fue aplicada al proyecto Supabase cloud.

## Decisions

- **Sí:** Supabase-first. Migraciones, RLS y funciones SQL viven en `yunta_backend/supabase`. No hay servidor Node propio. Razón: menos piezas, RLS ya cumple "permisos también en base de datos", despliegue solo Vercel + Supabase.
- **No:** API Node/NestJS aparte. Razón: mantenimiento y hosting extra sin necesidad en un MVP. Se reevalúa si el SPEC 07 lo exige (los webhooks de Mercado Pago pueden ser Edge Functions).
- **Sí:** desarrollo local con Docker + Supabase CLI, y `db push` a cloud como paso manual confirmado. Razón: cero riesgo sobre el proyecto real.
- **No:** aplicar migraciones al cloud en este spec. Razón: regla de no tocar servicios externos sin confirmación.
- **Sí:** esquema núcleo de 10 tablas. **No:** las 17 del maestro. Razón: reseñas, pagos y auditoría sin UI ni lógica serían RLS sin verificar.
- **Sí:** datos de referencia como migración y datos demo solo en `seed.sql`. Razón: `db push` no ejecuta seed, así que los demo no llegan al cloud por accidente.
- **Sí:** prestadores demo marcados `is_demo` con prefijo `[DEMO]`. Razón: el spec prohíbe presentar datos inventados como reales.
- **No:** barrios/zonas inventados. Razón: sin fuente confiable; `locations` ya admite `kind = 'zone'`.
- **Sí:** `search_vector`, `pg_trgm` y `unaccent` ya en este spec; **No:** la RPC `search_providers`. Razón: la función se diseña junto a la UI de resultados (SPEC 02) y esto evita rehacer la migración.
- **No:** PostGIS. Razón: lat/lng numéricos alcanzan hasta el mapa de resultados; se agrega con migración incremental si hace falta.
- **Sí:** WhatsApp en formato E.164 validado en BD. Razón: el enlace `wa.me` falla con formatos locales.
- **Sí:** rol `admin` solo asignable por otro admin o `service_role`. Razón: requisito de seguridad del maestro.
- **Sí:** skills `impeccable` y `frontend-design` obligatorias antes de cualquier componente visual (paso 11).
- **No:** emojis como iconos. Los íconos son nombres de una librería (se elige en el paso 11).
- **Sí:** ignorar la mención a Solana en `dis_pag.png`. Pagos = Mercado Pago, SPEC 07.
- **Mercado Pago, pendiente para SPEC 07:** no hace falta crear cuentas ahora. Al empezar esa fase se crea la app en Mercado Pago Developers con usuarios de prueba (vendedor y comprador) y se verifica la cuenta real solo al pasar a producción. Split de pagos queda descartado hasta confirmar requisitos de marketplace vigentes.
- **Decisión de proceso:** el spec maestro se dividió en 6 specs secuenciales en lugar de ejecutarse de una vez.

## Risks

| Riesgo                                                                  | Mitigación                                                                                    |
| ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Docker en Windows consume mucha RAM con todos los servicios de Supabase | Desactivar servicios no usados en `config.toml` (analytics, edge runtime) si hace falta       |
| `create-next-app` se queja por directorio no vacío                      | Generar en carpeta temporal y mover archivos preservando `references/` y `specs/`             |
| Escalada de rol vía `raw_user_meta_data` o `update profiles`            | Trigger de bloqueo de `role` + tests pgTAP específicos                                        |
| Políticas RLS con `security definer` mal configuradas                   | `set search_path = ''` y nombres de esquema calificados; test con usuarios de distintos roles |
| Versiones de Next/Tailwind/Supabase cambian entre redacción y ejecución | Fijar versiones resultantes en `package.json` y anotarlas en el cierre del paso 10            |
| Claves locales de `supabase start` se confunden con las del cloud       | `.env.local` ignorado por git; `.env.example` solo con placeholders                           |
| Referencia `dis_pag` incluye contenido de Solana                        | Se ignora; se anota en decisiones                                                             |

## What is **not** in this spec

- Home final, hero, buscador, función `search_providers`, filtros, resultados y perfil público.
- Login, registro, paneles de prestador y admin.
- Reseñas, favoritos, reportes, métricas, SEO y mapas.
- Planes, suscripciones, pagos y cualquier integración con Mercado Pago.
- Aplicar migraciones al Supabase cloud, deploy a Vercel y remoto git.

Cada uno de esos puntos va en su propio spec.
