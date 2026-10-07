# SPEC 07 — Monetización: planes, suscripciones y destacados con Mercado Pago

> **Status:** Borrador
> **Depends on:** SPEC 01, SPEC 02, SPEC 03, SPEC 04, SPEC 06
> **Date:** 2026-10-06
> **Objective:** Un prestador publicado contrata un plan pago con Mercado Pago, un webhook validado en servidor activa su suscripción y su destacado, y el administrador gestiona planes, pagos y destacados.

## Scope

**In:**

- Tablas `plans`, `subscriptions`, `payments` y `featured_listings`.
- Planes creados y editados por el admin (nombre, precio ARS, período, beneficios); no hay precios hardcodeados.
- Compra de plan desde `/panel/plan` con Checkout Pro (pago único por período) en modo sandbox primero.
- Webhook de Mercado Pago como Edge Function en `yunta_backend/supabase/functions/mp-webhook`: valida firma `x-signature`, consulta el pago a la API de Mercado Pago por ID y actualiza BD de forma idempotente.
- Activación, vencimiento y renovación manual de la suscripción; estado visible en el panel.
- Destacados: `featured_listings` con vigencia; `search_providers` ordena destacados vigentes primero dentro de la relevancia y los marca como "Destacado".
- Home "Servicios destacados" pasa a usar destacados reales.
- Admin: `/admin/planes`, `/admin/pagos`, `/admin/destacados` con auditoría.
- Cuenta de prueba y credenciales sandbox en variables de entorno, nunca en el repo.

**Out of scope (para specs futuros):**

- Cobro de trabajos entre clientes y prestadores.
- Split de pagos, comisiones, marketplace y OAuth de vendedores (requiere autorización y requisitos vigentes de Mercado Pago).
- Billetera propia y almacenamiento de tarjetas: nunca.
- Suscripción automática recurrente (preapproval); se evalúa tras validar demanda.
- Facturación electrónica (ARCA) y comprobantes fiscales.
- Cupones, descuentos y planes anuales.
- Reservas y señas.
- Pasar a producción: requiere cuenta real verificada y autorización expresa del titular.

## Pre-requisitos (los hace el titular, no el código)

1. Cuenta de Mercado Pago a nombre de quien cobrará.
2. Crear una aplicación en Mercado Pago Developers y obtener credenciales de **prueba**.
3. Crear usuarios de prueba (vendedor y comprador) en el panel de desarrolladores.
4. Entregar las credenciales de prueba como variables de entorno (no por chat ni commits).
5. Definir el nombre, precio y beneficios de al menos un plan (no se inventan precios).

## Data model

Migración `0014_billing.sql`:

```sql
create table plans (
  id uuid pk default gen_random_uuid(),
  code text unique not null,                 -- 'basic', 'featured', ...
  name text not null, description text,
  price numeric(12,2) not null check (price >= 0),
  currency char(3) not null default 'ARS' check (currency = 'ARS'),
  period_days int not null check (period_days > 0),
  benefits jsonb not null default '{}',      -- p. ej. {"featured": true, "max_images": 20}
  is_active bool not null default false,
  created_at timestamptz default now(), updated_at timestamptz default now()
);

create type subscription_status as enum ('pending', 'active', 'expired', 'cancelled');
create table subscriptions (
  id uuid pk, provider_id uuid not null references providers, plan_id uuid not null references plans,
  status subscription_status not null default 'pending',
  starts_at timestamptz, ends_at timestamptz,
  created_at timestamptz default now()
);
-- unique parcial: una suscripción 'active' por prestador.

create type payment_status as enum ('pending', 'approved', 'rejected', 'refunded', 'cancelled');
create table payments (
  id uuid pk, subscription_id uuid not null references subscriptions,
  provider_id uuid not null references providers,
  mp_preference_id text, mp_payment_id text unique,   -- unique = idempotencia
  amount numeric(12,2) not null, currency char(3) not null default 'ARS' check (currency = 'ARS'),
  status payment_status not null default 'pending',
  raw_status text, created_at timestamptz default now(), updated_at timestamptz default now()
);

create table featured_listings (
  id uuid pk, provider_id uuid not null references providers,
  subscription_id uuid references subscriptions,
  starts_at timestamptz not null, ends_at timestamptz not null check (ends_at > starts_at),
  source text not null check (source in ('plan', 'admin')),
  created_at timestamptz default now()
);
```

RLS: `plans` activos son legibles por `authenticated`; escritura solo admin. `subscriptions`, `payments` y `featured_listings`: el dueño del prestador lee los suyos; nadie escribe desde el cliente; solo funciones `security definer` y la Edge Function con `service_role` (clave que vive solo como secreto de Supabase, nunca en el frontend).

Flujo:

1. `/panel/plan`: Server Action `startCheckout(plan_id)` valida propiedad, estado `published` y plan activo; crea `subscriptions` en `pending` y `payments` en `pending`, y llama a Mercado Pago para crear la preferencia con `external_reference = payments.id`. El monto sale de `plans.price`, nunca del cliente.
2. El usuario paga en Mercado Pago y vuelve a `/panel/plan?resultado=...`. El resultado de la URL **no** activa nada.
3. Mercado Pago llama a `mp-webhook`. La función valida `x-signature`, consulta `GET /v1/payments/{id}`, compara monto, moneda y `external_reference`, y llama a `apply_payment_result(...)`.
4. `apply_payment_result` es idempotente: con `approved` marca el pago, activa la suscripción (`starts_at`, `ends_at = starts_at + period_days`) y crea `featured_listings` si el plan lo incluye. Eventos repetidos no duplican nada.
5. Job programado (`pg_cron` o Edge Function agendada) pasa suscripciones vencidas a `expired`.

Cambio en `search_providers`: devuelve `is_featured` y ordena `is_featured desc` solo como desempate sobre la relevancia, para no ocultar mejores coincidencias.

Variables de entorno (ninguna con prefijo `NEXT_PUBLIC_` excepto la clave pública de MP si hace falta): `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET`, `MP_PUBLIC_KEY`, `NEXT_PUBLIC_SITE_URL`. `.env.example` solo con placeholders.

Estructura nueva:

```
yunta_backend/supabase/functions/mp-webhook/index.ts
yunta_backend/supabase/functions/expire-subscriptions/index.ts
src/app/panel/plan/page.tsx
src/app/admin/{planes,pagos,destacados}/page.tsx
src/lib/billing/checkout.ts          # solo servidor
```

## Implementation plan

1. Migración `0014`, funciones `apply_payment_result` y `admin_*` de planes y destacados con auditoría. Tests pgTAP, incluida idempotencia.
2. Regenerar tipos. CRUD de planes en `/admin/planes`.
3. `/panel/plan`: listado de planes y estado actual (sin pagar todavía).
4. `startCheckout` contra sandbox. Verificar creación de preferencia y redirección.
5. Edge Function `mp-webhook` con validación de firma, tests con firmas válidas e inválidas, ejecución local con `supabase functions serve`.
6. Prueba de punta a punta en sandbox con usuarios de prueba: pago aprobado, rechazado, pendiente.
7. Destacados: `search_providers`, etiqueta en tarjeta, home con destacados reales, gestión manual en `/admin/destacados`.
8. Vencimientos: función programada y UI de estado.
9. `/admin/pagos` con filtros y estado.
10. Cierre: `lint`, `tsc`, `vitest`, `build`, `supabase test db`, checklist de seguridad de secretos. El paso a producción queda bloqueado hasta autorización expresa.

## Acceptance criteria

- [ ] Ningún precio ni nombre de plan está en el código fuente; todos vienen de `plans`.
- [ ] El cliente no puede cambiar el monto: manipular el cuerpo de la petición no altera `payments.amount`.
- [ ] Un webhook con firma inválida responde 401 y no modifica la BD.
- [ ] Un webhook cuyo monto o `external_reference` no coincide con el pago registrado es rechazado y queda registrado como inconsistente.
- [ ] Un pago `approved` en sandbox activa la suscripción con `ends_at = starts_at + period_days`.
- [ ] Reenviar el mismo webhook cinco veces deja una sola suscripción activa, un solo pago `approved` y un solo destacado.
- [ ] Volver a `/panel/plan?resultado=approved` sin webhook no activa la suscripción.
- [ ] Un pago `rejected` o `cancelled` no activa nada y el panel lo muestra.
- [ ] No puede haber dos suscripciones `active` del mismo prestador.
- [ ] Un prestador no `published` no puede iniciar el checkout.
- [ ] Una suscripción vencida pasa a `expired` y su destacado deja de aplicar.
- [ ] En `/buscar` un destacado vigente muestra la etiqueta "Destacado"; un destacado vencido no.
- [ ] Un destacado nunca desplaza a un resultado con mejor relevancia por más de una posición de desempate (test con datos controlados).
- [ ] Con clave anon y sesión de usuario no se puede hacer `insert` ni `update` en `subscriptions`, `payments` ni `featured_listings`.
- [ ] El usuario A no puede leer pagos del usuario B.
- [ ] `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET` y `service_role` no aparecen en el bundle del frontend ni en el repositorio (`grep`).
- [ ] Cambiar un plan, un pago o un destacado desde admin deja una fila en `admin_audit_logs`.
- [ ] El sistema usa solo credenciales de prueba; no existe ruta que cobre con credenciales reales.
- [ ] `npm run lint`, `npx tsc --noEmit`, `npx vitest run`, `npm run build` y `npx supabase test db` terminan con código 0.

## Decisions

- **Sí:** Mercado Pago Argentina, cobro a prestadores por plan. Razón: definido en el spec maestro.
- **Sí:** Checkout Pro con pago único por período en lugar de suscripción automática. Razón: más simple de verificar y sin cobros recurrentes sin consentimiento claro (por defecto, sin confirmar).
- **No:** split de pagos, comisiones ni OAuth de vendedores. Razón: requieren autorización y requisitos de marketplace vigentes; el cobro de trabajos entre cliente y prestador no existe.
- **Sí:** activar solo por webhook validado, nunca por la URL de retorno. Razón: la URL la controla el usuario.
- **Sí:** consultar el pago a la API de MP por ID en el webhook. Razón: no confiar en el contenido del mensaje recibido.
- **Sí:** idempotencia con `payments.mp_payment_id unique` y funciones transaccionales. Razón: MP reintenta notificaciones.
- **Sí:** webhook como Edge Function en `yunta_backend`. Razón: es el único código de servidor del backend y respeta la separación frontend/backend.
- **Sí:** los planes se crean por admin, inactivos por defecto. Razón: no hay precios definidos; el modelo comercial lo decide el titular.
- **Sí:** el destacado solo desempata. Razón: no degradar la calidad de la búsqueda.
- **No:** guardar tarjetas, datos de pago ni wallet propia. Razón: prohibido en el maestro.
- **No:** facturación electrónica en este spec. Razón: depende de la situación fiscal del titular.
- **Definición rápida sin clarificación detallada:** spec redactado sin ronda de preguntas, a pedido del usuario. Revisar: Checkout Pro vs preapproval, qué incluye cada plan y política de reembolsos.

## Risks

| Riesgo | Mitigación |
| ------ | ---------- |
| Cobrar sin definir modelo comercial | Planes inactivos por defecto; este spec se implementa solo con autorización expresa |
| Webhook falsificado o repetido | Firma validada, consulta a la API, idempotencia, tests con firmas inválidas |
| Fuga de `MP_ACCESS_TOKEN` o `service_role` | Solo en secretos del servidor y de Supabase; `grep` en cierre; nunca `NEXT_PUBLIC_` |
| Cambios en la API o documentación de Mercado Pago | Releer la documentación vigente de Checkout Pro y webhooks antes del paso 4 |
| Pago aprobado pero webhook perdido | Reconciliación manual desde `/admin/pagos` consultando la API de MP por ID |
| Reembolsos y contracargos | Estado `refunded` contemplado; el proceso operativo lo define el titular |
| Requisitos fiscales para cobrar a prestadores | Fuera de alcance; consulta con contador antes de producción |

## What is **not** in this spec

- Cobro de trabajos entre clientes y prestadores.
- Split de pagos, comisiones y marketplace.
- Suscripciones recurrentes automáticas, cupones, planes anuales.
- Facturación electrónica.
- Paso a producción.

Cada uno va en su propio spec.
