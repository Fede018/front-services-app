# SPEC 03 — Autenticación, alta de prestadores y panel del prestador

> **Status:** Borrador
> **Depends on:** SPEC 01, SPEC 02
> **Date:** 2026-10-06
> **Objective:** Una persona crea una cuenta, completa un registro guiado de prestador con borradores, gestiona su perfil desde un panel y envía el perfil a aprobación.

## Scope

**In:**

- Supabase Auth con email y contraseña, confirmación de email obligatoria, recuperación de contraseña.
- Páginas `/acceso`, `/registro`, `/recuperar`, `/restablecer`; cierre de sesión.
- Protección de rutas `/panel/*` en servidor (middleware o `proxy`, según la convención de la versión de Next instalada) y en cada Server Component.
- Registro guiado en `/panel/alta` con pasos: tipo de perfil, datos, categorías, zonas, contacto, horarios, fotos, revisión. Cada paso guarda en BD como borrador.
- Panel `/panel`: resumen y estado (`draft`, `pending_review`, `published`, `suspended`), con motivo de suspensión si existe.
- Edición: `/panel/perfil`, `/panel/servicios`, `/panel/horarios`, `/panel/imagenes`, `/panel/disponibilidad`.
- Subida de imágenes a `provider-images` con validación de tipo, tamaño y firma del archivo, máximo 8 por prestador.
- Envío a aprobación: `draft` pasa a `pending_review` solo si el perfil está completo.
- Dato nuevo `providers.suspension_reason`.
- Generación de `slug` único a partir del nombre.

**Out of scope (para specs futuros):**

- Aprobar o rechazar perfiles desde una UI (SPEC 04). En este spec se aprueba por SQL o Studio local para probar.
- Solicitud y revisión de verificación de identidad (SPEC 04).
- Estadísticas, eventos de contacto y plan futuro en el panel (SPEC 06 y 07).
- Login con Google u otros proveedores.
- Autenticación de dos factores.
- Cuenta de cliente con favoritos y reseñas (SPEC 05); el cliente solo puede registrarse y entrar.
- Notificaciones por email al prestador (aprobado, rechazado).

## Data model

Migración `0008_provider_onboarding.sql`:

```sql
alter table providers add column suspension_reason text;
alter table providers add column rejection_reason text;   -- lo escribe el admin en SPEC 04

-- Completitud mínima para enviar a revisión (función pura, security invoker)
create function public.provider_is_complete(p_id uuid) returns boolean;
-- true si: business_name, description (>= 40 caracteres), whatsapp, location_id,
-- >= 1 categoría, >= 1 servicio activo, >= 1 zona de cobertura, >= 1 imagen.

-- Alta controlada: crea el prestador en draft y sube el rol del usuario a 'provider'.
create function public.create_provider_draft(p_business_name text, p_provider_type provider_type)
  returns providers security definer set search_path = '';

-- Envío a revisión: valida completitud y propiedad, pasa draft|rejected -> pending_review.
create function public.submit_provider_for_review(p_id uuid) returns providers
  security definer set search_path = '';
```

Mecanismo de rol: el trigger de SPEC 01 que bloquea cambios de `profiles.role` permite el cambio solo si `current_user in ('postgres','service_role','supabase_admin')`. Las funciones `security definer` pertenecen a `postgres`, así que pueden subir `client` a `provider`; un usuario `authenticated` no puede. La función nunca asigna `admin`.

Reglas RLS agregadas: `providers` permite `insert` al usuario autenticado solo vía función (se revoca `insert` directo); el dueño puede `update` sus campos editables pero no `status`, `verified_at`, `is_demo`, `published_at`, `owner_id`. Un prestador `published` que edita campos críticos (nombre, WhatsApp) vuelve a `pending_review` (trigger).

Contrato de acciones (Server Actions de Next, sin REST propio):

| Acción | Entrada validada con Zod | Efecto |
| ------ | ------------------------ | ------ |
| `signUp` | email, contraseña (>= 10 caracteres), nombre | `auth.signUp`, redirige a aviso de confirmación |
| `signIn` / `signOut` / `requestPasswordReset` / `updatePassword` | email/contraseña | Supabase Auth |
| `createProviderDraft` | nombre, tipo | `rpc('create_provider_draft')` |
| `saveProviderStep` | paso + campos del paso | `update` sobre tablas del propietario |
| `uploadProviderImage` | archivo | valida MIME (`jpeg/png/webp`), <= 5 MB y firma binaria; sube a `{provider_id}/{uuid}.ext`; inserta `provider_images` |
| `submitForReview` | provider_id | `rpc('submit_provider_for_review')` |

Errores: las acciones devuelven `{ ok: false, fieldErrors?, message }`; nunca lanzan datos internos al cliente.

Estructura nueva:

```
src/app/(auth)/{acceso,registro,recuperar,restablecer}/page.tsx
src/app/panel/layout.tsx          # guarda de sesión y rol
src/app/panel/{page,alta,perfil,servicios,horarios,imagenes,disponibilidad}/...
src/lib/validation/*.ts           # esquemas Zod por paso
src/lib/auth/require-user.ts
src/middleware.ts (o proxy.ts)    # refresco de sesión y redirección
```

## Implementation plan

1. Migración `0008` con columnas, `provider_is_complete`, `create_provider_draft`, `submit_provider_for_review`, restricciones RLS y trigger de re-revisión. Tests pgTAP de cada regla.
2. Regenerar tipos. Agregar `zod`.
3. Middleware de sesión y `require-user`. Verificar que `/panel` redirige a `/acceso` sin sesión.
4. Páginas de registro, acceso, recuperación. Verificar en Inbucket local (`http://127.0.0.1:54324`) que llega el email de confirmación.
5. Panel base `/panel` con layout propio (distinto del home) y estado del perfil.
6. Alta guiada pasos 1 a 3 (tipo, datos, categorías) con guardado de borrador y retomar donde quedó.
7. Pasos 4 y 5 (zonas, contacto) con validación de WhatsApp E.164 y ayuda de formato argentino.
8. Paso 6 y página `/panel/horarios` (editor semanal) y `/panel/disponibilidad` (cambio de estado con nota, guarda `updated_at`).
9. Pasos de fotos e `/panel/imagenes`: subida, portada, orden, borrado, alt.
10. Paso de revisión y `submitForReview`. Verificar bloqueo si falta algún requisito.
11. `/panel/servicios` con alta, edición y baja lógica de servicios y precios ARS.
12. Estados `pending_review`, `suspended` en el panel (solo lectura con mensaje). Aplicar skills `impeccable` y `frontend-design`.
13. Cierre: `lint`, `tsc`, `vitest`, `build`, `supabase test db`, prueba manual del flujo completo.

## Acceptance criteria

- [ ] Registrarse con email nuevo envía el email de confirmación (visible en Inbucket) y no permite acceder al panel hasta confirmar.
- [ ] Contraseñas menores a 10 caracteres son rechazadas con mensaje por campo.
- [ ] `/panel` sin sesión redirige a `/acceso`.
- [ ] Un usuario recién registrado tiene `profiles.role = 'client'`; tras `createProviderDraft` pasa a `provider`.
- [ ] Ningún flujo de la UI ni llamada directa con la clave anon puede dejar `role = 'admin'`.
- [ ] Llamar a `create_provider_draft` crea un `providers` con `status = 'draft'` y `owner_id = auth.uid()`.
- [ ] Un `insert` directo en `providers` con clave anon y sesión de usuario falla.
- [ ] Cerrar el navegador a mitad del alta y volver retoma en el paso guardado, con los datos cargados.
- [ ] `submit_provider_for_review` falla si falta cualquiera de: descripción >= 40 caracteres, WhatsApp, localidad, categoría, servicio, zona o imagen.
- [ ] Con el perfil completo, el envío cambia `status` a `pending_review` y el panel muestra "En revisión".
- [ ] El dueño no puede cambiar su `status` a `published` ni modificar `verified_at` con una llamada directa (test pgTAP).
- [ ] El usuario A no puede leer ni editar `services`, `business_hours` ni imágenes del prestador de B.
- [ ] Subir `.pdf`, un archivo de más de 5 MB o un `.jpg` falso (extensión cambiada) es rechazado con mensaje claro.
- [ ] No se pueden subir más de 8 imágenes por prestador.
- [ ] Cambiar la disponibilidad actualiza `availability_status.updated_at` y el perfil público muestra la nueva hora.
- [ ] Editar el WhatsApp de un prestador publicado lo devuelve a `pending_review` y deja de verse en `/buscar`.
- [ ] Un prestador `suspended` ve el motivo y no puede editar ni publicar.
- [ ] Ningún error del servidor muestra stack trace ni mensajes SQL al usuario.
- [ ] El alta completa se puede hacer en 375 px sin scroll horizontal.
- [ ] `npm run lint`, `npx tsc --noEmit`, `npx vitest run`, `npm run build` y `npx supabase test db` terminan con código 0.

## Decisions

- **Sí:** email y contraseña con confirmación obligatoria. Razón: simple, funciona sin proveedores externos y evita cuentas falsas.
- **No:** Google OAuth ahora. Razón: requiere credenciales externas; se puede sumar después sin cambiar el esquema.
- **Sí:** el alta se hace por RPC `security definer`, con `search_path` vacío. Razón: único punto que sube de `client` a `provider`, auditado por tests.
- **Sí:** el borrador es una fila real de `providers` con `status = 'draft'`. Razón: reutiliza RLS y evita una tabla paralela.
- **Sí:** aprobación manual obligatoria antes de publicar. Razón: evita publicaciones basura en el lanzamiento; es la regla de arranque (por defecto, sin confirmar).
- **Sí:** editar nombre o WhatsApp de un perfil publicado fuerza nueva revisión. Razón: impide cambiar un perfil aprobado por datos engañosos.
- **Sí:** validar firma binaria de imágenes en servidor además del MIME. Razón: el MIME lo declara el cliente.
- **No:** subidas desde el navegador directo a Storage sin validación servidor. Razón: se evita el bypass de validación.
- **No:** emails transaccionales de aprobación en este spec. Razón: requiere proveedor de email; queda como mejora posterior.
- **Definición rápida sin clarificación detallada:** spec redactado sin ronda de preguntas, a pedido del usuario. Revisar: mínimo de 10 caracteres de contraseña, tope de 8 imágenes y la regla de completitud.

## Risks

| Riesgo | Mitigación |
| ------ | ---------- |
| Escalada de rol vía RPC mal escrita | Tests pgTAP con usuarios de distintos roles; la RPC nunca recibe el rol como parámetro |
| Spam de registros | Rate limiting de Supabase Auth en `config.toml`; captcha queda para spec posterior si aparece abuso |
| Email de confirmación no llega en cloud | SMTP propio requerido antes de producción; anotado como pre-requisito de despliegue |
| Borradores abandonados acumulados | Fuera de alcance; limpieza programada en spec futuro |
| Cambio de convención `middleware`/`proxy` entre versiones de Next | Verificar la convención de la versión instalada en el paso 3 |

## What is **not** in this spec

- UI de aprobación y verificación (SPEC 04).
- Reseñas, favoritos, reportes.
- Estadísticas, planes y pagos en el panel.
- Login social, 2FA, emails de aprobación.

Cada uno va en su propio spec.
