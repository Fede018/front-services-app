# SPEC 02 — MVP público: home, búsqueda, resultados y perfil público

> **Status:** Borrador
> **Depends on:** SPEC 01
> **Date:** 2026-10-06
> **Objective:** Un visitante sin cuenta entra a YUNTA, busca un servicio con localidad y filtros, compara resultados reales de la BD y contacta al prestador por WhatsApp desde su perfil público.

## Scope

**In:**

- Función SQL `search_providers` (migración nueva) con relevancia, tolerancia a errores de escritura y filtros combinables.
- Home `/` con header, hero con `references/noche_ciudad.jpg`, buscador con selector de localidad, categorías populares, servicios destacados, sección de confianza, sección "Cómo funciona" y footer.
- Resultados `/buscar` con filtros: categoría, localidad, disponible ahora, disponible hoy, atención a domicilio, delivery, precio máximo, tipo de prestador. Orden por relevancia o precio.
- Tarjeta de resultado con: nombre, foto de portada, categoría, descripción corta, localidad, precio orientativo, disponibilidad con "actualizado hace X", estado de verificación, botón WhatsApp y enlace al perfil.
- Perfil público `/prestadores/[slug]`: descripción, galería, categorías, servicios con precios, localidades cubiertas, horarios, disponibilidad, modalidad, delivery, WhatsApp, teléfono opcional.
- Utilidad `buildWhatsAppUrl(provider, context)` con mensaje contextual (`wa.me`).
- Navegación responsive mobile-first (menú móvil, filtros en panel inferior en móvil).
- Estados de carga, vacío y error en home, resultados y perfil.
- Aplicación obligatoria de las skills `impeccable` y `frontend-design`.

**Out of scope (para specs futuros):**

- Calificación y reseñas: se muestra "Sin reseñas todavía". No hay filtro por calificación (SPEC 05).
- Distancia en tarjetas y mapa de resultados (SPEC 06).
- Registro de eventos de contacto y de búsqueda (SPEC 06).
- Metadata SEO completa, sitemap, robots, Open Graph (SPEC 06). Solo `title` y `description` básicos por página.
- Favoritos y reportar perfil (SPEC 05).
- Login y acceso: el botón "Acceso" del header enlaza a `/acceso`, que muestra aviso de próximamente hasta el SPEC 03.
- Páginas de Contacto, Términos y Privacidad (SPEC 06, requieren datos y texto legal del titular).
- Destacados pagos: "Servicios destacados" usa prestadores publicados ordenados por `published_at` (SPEC 07 agrega destacados reales).

## Data model

Migración nueva `0007_search_providers.sql` (SPEC 01 dejó 0001 a 0006):

```sql
-- Agrega nombres de servicios al search_vector (trigger sobre services y providers)
-- Función de solo lectura, security invoker: aplica RLS del llamador (anon ve solo published).
create function public.search_providers(
  p_query        text    default null,
  p_location_id  uuid    default null,
  p_category_id  uuid    default null,
  p_availability text    default null,   -- 'now' | 'today' | null
  p_home_visit   boolean default null,
  p_delivery     boolean default null,
  p_price_max    numeric default null,
  p_provider_type provider_type default null,
  p_sort         text    default 'relevance',  -- 'relevance' | 'price_asc'
  p_limit        int     default 20,
  p_offset       int     default 0
) returns table (
  id uuid, slug text, business_name text, provider_type provider_type,
  short_description text, location_name text, category_name text,
  cover_path text, cover_alt text,
  price_from numeric, currency char(3),
  availability_state availability_state, availability_updated_at timestamptz,
  verified boolean, offers_home_visit boolean, offers_delivery boolean,
  rank real, total_count bigint
);
```

Reglas de la función:

- Normaliza con `unaccent` y `lower`. Texto vacío devuelve todos los publicados.
- Relevancia: `ts_rank(search_vector, websearch_to_tsquery('spanish', q))` más `similarity(business_name, q)`; si hay 0 coincidencias exactas, recae en `similarity > 0.3` sobre nombre, servicios y categorías.
- Filtro de localidad incluye prestadores cuya `location_id` o `provider_coverage_areas` coincida con la localidad o su hija.
- `p_availability = 'now'` exige `availability_state = 'available_now'`; `'today'` acepta `available_now` y `available_today`.
- `price_from` es el mínimo de `services.price_from` activos del prestador; `p_price_max` filtra por ese valor.
- Límite máximo `p_limit` = 50 (se recorta dentro de la función).
- Grant `execute` a `anon` y `authenticated`.

Contrato frontend/backend (sin servidor propio, según SPEC 01):

| Consumidor | Llamada | Respuesta |
| ---------- | ------- | --------- |
| `/buscar` (Server Component) | `supabase.rpc('search_providers', {...})` con cliente server y clave anon | filas de arriba; error → pantalla de error, sin filas → estado vacío |
| `/prestadores/[slug]` | `from('providers').select('*, services(*), business_hours(*), availability_status(*), provider_images(*), provider_categories(categories(*)), provider_coverage_areas(locations(*))').eq('slug', slug).maybeSingle()` | `null` → `notFound()` |
| Home | `from('categories')` activas y `search_providers` con límite 6 | — |

Parámetros de URL de `/buscar`: `q`, `localidad` (slug), `categoria` (slug), `disponibilidad` (`ahora|hoy`), `domicilio=1`, `delivery=1`, `precio_max`, `tipo` (`profesional|comercio`), `orden`, `pagina`. Los slugs se resuelven a UUID en servidor; valores inválidos se ignoran.

Estructura de frontend nueva:

```
src/app/(public)/page.tsx
src/app/(public)/buscar/page.tsx
src/app/(public)/prestadores/[slug]/page.tsx
src/app/(public)/acceso/page.tsx
src/components/home/{hero,category-grid,featured-providers,trust-strip,how-it-works}.tsx
src/components/search/{search-box,filters-panel,provider-card,result-list}.tsx
src/components/provider/{gallery,services-table,hours-table,whatsapp-button}.tsx
src/components/layout/{header,mobile-menu,footer}.tsx
src/lib/whatsapp.ts
src/lib/search-params.ts
public/images/hero-noche-ciudad.jpg   # copia de references/noche_ciudad.jpg (el original no se mueve)
```

Mensaje de WhatsApp: `Hola, encontré tu perfil en YUNTA. Quisiera consultar por tu servicio.` Si viene desde un servicio concreto agrega `: {nombre del servicio}`. El texto va con `encodeURIComponent`.

## Implementation plan

1. Migración `0007`: trigger que agrega `services.name` al `search_vector`, función `search_providers`. Verificar con `db reset` y consultas SQL contra el seed demo.
2. Tests pgTAP de `search_providers`: coincidencia por servicio, por categoría, sin tildes, error tipográfico (`electrisista`), filtro de localidad, filtro disponibilidad, `anon` no ve borradores. Verificar `supabase test db`.
3. Regenerar `src/types/database.ts`.
4. Layout público: `Header`, `MobileMenu`, `Footer` con tokens de SPEC 01. Verificar navegación a 375 px y 1280 px.
5. `lib/search-params.ts` (parseo y validación de parámetros) y `lib/whatsapp.ts`. Tests unitarios (Vitest, se agrega como dependencia de desarrollo).
6. Componentes `ProviderCard` y `SearchBox`; página `/buscar` solo con `q` y localidad. Verificar con datos demo.
7. `FiltersPanel` con todos los filtros, panel inferior en móvil. Verificar que los filtros se combinan y que la URL refleja el estado.
8. Paginación (20 por página) y orden.
9. Perfil público `/prestadores/[slug]` con galería, servicios, horarios, WhatsApp. `notFound()` y `loading.tsx`.
10. Home: hero con `hero-noche-ciudad.jpg` (`next/image`, `priority`, overlay y degradado oscuro), categorías, destacados, confianza, cómo funciona. Releer `references/dis_pag.png` y `elem_pag.png` y aplicar `impeccable` y `frontend-design` antes de escribir.
11. `error.tsx`, `not-found.tsx` y `/acceso` provisional.
12. Cierre: `lint`, `tsc`, `vitest`, `build`, `supabase test db`, revisión manual en 375, 768 y 1280 px.

## Acceptance criteria

- [ ] `select * from search_providers('electricista')` sobre el seed devuelve solo prestadores con `status = 'published'`.
- [ ] `search_providers('electrisista')` (error tipográfico) devuelve al menos al mismo prestador que `'electricista'`.
- [ ] `search_providers('plomeria')` encuentra categorías escritas con tilde (`Plomería`).
- [ ] Combinar `p_availability='now'`, `p_delivery=true` y `p_price_max` devuelve solo filas que cumplen las tres condiciones.
- [ ] `p_limit = 1000` devuelve como máximo 50 filas.
- [ ] `/` carga sin errores en consola y muestra el hero con la imagen `noche_ciudad` sin deformarla.
- [ ] El título del hero es legible: contraste mínimo 4.5:1 sobre la zona de texto.
- [ ] Buscar "electricista" con localidad "San Salvador de Jujuy" desde el home lleva a `/buscar?q=electricista&localidad=...` con resultados.
- [ ] Cada filtro cambia la URL y los resultados; recargar la URL conserva el estado.
- [ ] Un valor inválido en la URL (`?precio_max=abc`) no rompe la página.
- [ ] Una búsqueda sin coincidencias muestra estado vacío con sugerencia de quitar filtros.
- [ ] Toda tarjeta muestra la disponibilidad con su fecha de "última actualización", o "Sin información" si no hay.
- [ ] Ninguna tarjeta ni perfil muestra estrellas o puntaje inventado; sin reseñas muestra "Sin reseñas todavía".
- [ ] El badge de verificación aparece solo si `verified_at` no es nulo.
- [ ] Los prestadores `is_demo` muestran la etiqueta `[DEMO]` en el nombre y no aparecen en ningún dato real.
- [ ] El botón WhatsApp abre `https://wa.me/<número sin +>?text=<mensaje codificado>`.
- [ ] `/prestadores/<slug inexistente>` devuelve 404.
- [ ] `/prestadores/<slug de un borrador>` devuelve 404 como `anon`.
- [ ] A 375 px no hay scroll horizontal en `/`, `/buscar` ni el perfil.
- [ ] El menú móvil se abre y cierra con teclado y su foco queda atrapado mientras está abierto.
- [ ] `npm run lint`, `npx tsc --noEmit`, `npx vitest run` y `npm run build` terminan con código 0.

## Decisions

- **Sí:** búsqueda en una función SQL `security invoker`. Razón: la lógica de relevancia vive en la BD y RLS se aplica sola; el frontend no filtra resultados.
- **Sí:** URLs en español (`/buscar`, `/prestadores/[slug]`) con slugs legibles. Razón: público local, SEO futuro.
- **Sí:** estado de filtros en la URL. Razón: se pueden compartir y recargar.
- **Sí:** tolerancia a typos con `pg_trgm` como respaldo, no como método principal. Razón: evita ruido en resultados cuando hay coincidencia exacta.
- **No:** Algolia, Typesense o Meilisearch. Razón: sobreingeniería para el volumen inicial.
- **No:** mostrar calificaciones hasta tener reseñas reales. Razón: el maestro prohíbe presentar datos inventados.
- **No:** copiar el mock de `dis_pag`/`elem_pag` literal ni su contenido de "Solana". La composición se interpreta; el diseño final lo guían las skills.
- **Sí:** copiar `noche_ciudad.jpg` a `public/images/` en vez de mover. Razón: `references/` queda intacto como fuente.
- **Sí (por defecto, sin confirmar):** `/acceso` provisional hasta SPEC 03.
- **Definición rápida sin clarificación detallada:** este spec se redactó sin ronda de preguntas, a pedido del usuario, a partir del spec maestro. Revisar especialmente: orden por defecto, tamaño de página y contenido de la sección de confianza.

## Risks

| Riesgo | Mitigación |
| ------ | ---------- |
| Seed demo es demasiado chico para validar relevancia | El seed de SPEC 01 incluye 6 a 8 prestadores con categorías variadas; se amplía en este spec si hace falta |
| `search_providers` lenta con muchos prestadores | Índices GIN y trigram de SPEC 01; medir con `explain analyze` y 1000 filas generadas en local |
| Hero pesado afecta LCP | `next/image` con `priority`, `sizes`, versión redimensionada (máx. 2000 px de ancho) |
| Texto sobre foto ilegible | Overlay y degradado oscuro; verificación de contraste en criterios |
| Número de WhatsApp inválido en datos | Check E.164 en BD (SPEC 01); el botón no se renderiza si falta |

## What is **not** in this spec

- Reseñas, calificaciones, favoritos, reportes.
- Mapa, distancia, eventos de contacto, métricas, SEO completo.
- Login, registro, paneles.
- Pagos y destacados pagos.
- Páginas Contacto, Términos y Privacidad.

Cada uno va en su propio spec.
