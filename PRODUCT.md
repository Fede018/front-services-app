# Product

<!-- impeccable:product-schema 1 -->

> Registro derivado del spec maestro de YUNTA que aportó el usuario. No hubo entrevista de init: los hechos no confirmados aparecen como abiertos.

## Platform

web

## Stack

Next.js (App Router), TypeScript, Tailwind CSS, Supabase (PostgreSQL, Auth, Storage), Vercel. Definido por el usuario en el spec maestro. App móvil posible a futuro.

## Users

- Cliente: persona de Jujuy que necesita resolver algo (un electricista, un plomero, una garrafa, comida casera) y puede tener poca familiaridad tecnológica. Suele buscar desde el celular, a menudo con urgencia.
- Prestador: profesional independiente, trabajador, emprendimiento o comercio local que quiere ser encontrado y contactado.
- Administrador: operador de la plataforma que aprueba perfiles, verifica y modera.

## Product Purpose

Responder "¿quién puede solucionar lo que necesito, cuánto puede costar y cuándo puede hacerlo?". Conecta oferta y demanda local. No es propietaria de los servicios publicados ni procesa pagos de trabajos entre cliente y prestador. El contacto inicial es por WhatsApp.

## Positioning

A diferencia de un mapa de negocios, YUNTA está orientada a resolver una necesidad concreta: muestra qué trabajos hace el prestador, dónde, cuánto cobra aproximadamente, cuándo atiende, si va a domicilio o hace delivery y qué reputación tiene.

## Operating Context

Mercado inicial: San Salvador de Jujuy y alrededores, con expansión a otras localidades y provincias. Moneda ARS. Contacto por WhatsApp. La disponibilidad la declara el prestador y se muestra con su última actualización; no se simula tiempo real.

## Capabilities and Constraints

- Búsqueda real en PostgreSQL con filtros combinables.
- Perfiles públicos, registro guiado de prestadores, paneles de prestador y admin, reseñas moderadas.
- Monetización futura (destacados, suscripciones) con Mercado Pago. No se activan cobros todavía.
- Abiertos: contenido y datos de contacto institucional, texto legal, precios de planes.

## Brand Commitments

- Nombre: YUNTA. Concepto: "Lo que necesitás, más cerca."
- Debe transmitir cercanía, confianza, comunidad, profesionalismo, tecnología y economía local.
- Tono: voseo rioplatense ("necesitás", "encontrá").
- Dirección visual definida por el usuario con tres referencias en `references/`:
  - `dis_pag.png`: estética, paleta y lenguaje visual. Tema oscuro azul noche, violeta como acento, bordes sutiles, tarjetas modernas.
  - `elem_pag.png`: elementos funcionales y su jerarquía (buscador, categorías, tarjetas de prestador, botón de WhatsApp).
  - `noche_ciudad.jpg`: fotografía del hero, sin sustituir por una genérica ni deformar.
- Se puede usar contraste claro en superficies puntuales cuando mejore la legibilidad.
- Prohibido: plantillas genéricas, glassmorphism indiscriminado, emojis como iconografía, componentes que no cumplan una función.
- La mención a Solana en las referencias no aplica: los pagos serán con Mercado Pago.

## Evidence on Hand

- Tres imágenes de referencia en `references/`.
- No hay logotipo, testimonios, reseñas, fotos de prestadores ni datos reales. Los prestadores del seed local son ficticios y están marcados `[DEMO]`. No se deben inventar reseñas ni calificaciones.

## Product Principles

1. El buscador es el protagonista funcional.
2. Datos reales o ausencia explícita: nunca información inventada presentada como real.
3. Fácil para quien tiene poca familiaridad tecnológica: pocos pasos, textos claros.
4. Mobile primero.
5. Confianza visible: verificación, reseñas y contacto directo se distinguen entre sí.

## Accessibility & Inclusion

Contraste mínimo WCAG AA, foco visible por teclado, objetivos táctiles de al menos 44 px y respeto de `prefers-reduced-motion`.
