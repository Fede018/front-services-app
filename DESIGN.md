---
name: YUNTA
description: Lo que necesitás, más cerca. Marketplace local de servicios de Jujuy, de noche y con acento violeta.
colors:
  bg: "#070b1f"
  surface: "#0e1533"
  surface-raised: "#172049"
  border: "#263060"
  border-strong: "#6872ac"
  text: "#eef1ff"
  text-muted: "#a9b1d8"
  accent: "#6d4ae0"
  accent-hover: "#7a5aea"
  accent-contrast: "#ffffff"
  accent-soft: "#1e1a55"
  accent-text: "#b8a9ff"
  success: "#0e7f44"
  success-hover: "#0b6e3a"
  success-soft: "#0d2b22"
  success-text: "#5ee6a0"
  warning: "#f2b233"
  warning-soft: "#33270b"
  warning-text: "#f7c85c"
  danger: "#cc2b48"
  danger-hover: "#b5223e"
  danger-soft: "#3a1424"
  danger-text: "#ff8fa0"
  focus: "#b2a5ff"
  light-bg: "#f4f5fd"
  light-surface: "#ffffff"
  light-surface-raised: "#eef0fb"
  light-border: "#dde0f3"
  light-text: "#11163a"
  light-text-muted: "#565c86"
  light-accent: "#5b3fd0"
typography:
  display:
    fontFamily: "Bricolage Grotesque, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.25rem, 6vw, 4rem)"
    fontWeight: 800
    lineHeight: 1.12
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Bricolage Grotesque, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.12
  body:
    fontFamily: "Figtree, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Figtree, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.2
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-contrast}"
    rounded: "{rounded.md}"
    height: "44px"
    padding: "0 18px"
  button-primary-hover:
    backgroundColor: "{colors.accent-hover}"
  button-whatsapp:
    backgroundColor: "{colors.success}"
    textColor: "{colors.accent-contrast}"
    rounded: "{rounded.md}"
    height: "44px"
  button-secondary:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
    height: "44px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
    height: "44px"
    padding: "0 14px"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.lg}"
    padding: "20px"
  badge-accent:
    backgroundColor: "{colors.accent-soft}"
    textColor: "{colors.accent-text}"
    rounded: "{rounded.sm}"
---

# Design System: YUNTA

## Overview

**Creative north star: "La ciudad de noche, a tu alcance".** YUNTA se ve como una plataforma comercial seria que ocurre de noche: azul profundo, bordes finos y un único acento violeta que marca lo accionable. La fotografía nocturna de Jujuy (`references/noche_ciudad.jpg`) es el hero; el resto del sistema se mantiene quieto para que el buscador y los resultados lleven el peso.

Dirección fijada por el usuario con tres referencias en `references/`: `dis_pag.png` (estética y paleta), `elem_pag.png` (elementos y jerarquía) y la fotografía del hero. La mención a "Solana" de las referencias no aplica.

Estado: sistema base (SPEC 01). El home, el hero y los resultados se construyen en el SPEC 02.

## Colors

Identidad oscura con un acento. Las superficies claras (`.surface-light`) se usan solo donde la lectura lo pide: tarjetas de prestador, formularios largos, paneles de datos.

- **Azul noche** (`bg` `#070b1f`) es el fondo de página; `surface` y `surface-raised` suben en luminosidad para dar profundidad sin sombras pesadas.
- **Violeta** (`accent` `#6d4ae0`) es el único color de acción primaria: botón de búsqueda, enlaces, foco. Sobre fondo oscuro el texto de acento usa `accent-text` `#b8a9ff`.
- **Verde WhatsApp** (`success` `#0e7f44`) se reserva para contacto directo y estados de disponibilidad. No se usa como decoración.
- **Ámbar** (`warning`) para avisos y estrellas; **rojo** (`danger`) para errores y suspensiones.
- **Foco** `#b2a5ff` (oscuro) y `#5b3fd0` (claro), siempre visible por teclado.

Todos los pares texto/fondo cumplen WCAG AA; se verifican con `npm run check:contrast`.

### Reglas
- **Un acento por vista.** El violeta señala lo que se puede accionar; no se reparte como adorno.
- **Sin degradados decorativos ni texto con degradado.** La profundidad sale de la luminosidad de las superficies.
- **El claro es una superficie, no un tema.** Se aplica con `.surface-light` sobre un contenedor y los componentes heredan los tokens.

## Typography

- **Display y títulos:** Bricolage Grotesque, variable. Carácter propio, buen peso en pantallas pequeñas.
- **Cuerpo e interfaz:** Figtree. Legible a tamaños chicos y con buenos numerales.

Escala: display `clamp(2.25rem, 6vw, 4rem)` con tracking `-0.02em`; título de sección 1.5 a 2rem; cuerpo 1rem; detalle 0.875rem; etiquetas 0.75rem. Cuerpo máximo 65ch. Encabezados con `text-wrap: balance`. Precios, calificaciones y métricas usan `.tnum` (numerales tabulares).

### Reglas
- **Sin etiquetas sobre los títulos** (kickers) ni numeración decorativa de secciones.
- **Sin mayúsculas sostenidas** para etiquetas; sentence case.
- **Voseo rioplatense** en todo el copy: "buscá", "contactá", "necesitás".

## Layout

Mobile primero. Contenedores de 64 rem como máximo (`max-w-5xl` en la guía; las páginas públicas pueden ir más anchas). Gutter lateral de 16 px en móvil. Espaciado sobre la escala de 4 px de Tailwind; más espacio arriba de un título que debajo. Objetivo táctil mínimo de 44 px. Sin scroll horizontal desde 375 px.

## Elevation & Depth

Dos sombras, ambas con desplazamiento y desenfoque: `shadow-card` (reposo) y `shadow-raised` (elevada o hover). En oscuro son sombras profundas azul-negras; en `.surface-light` son suaves y teñidas de violeta. Nunca halos sin desplazamiento ni sombras duras.

## Shapes

Radios `8 / 12 / 16 / 24 px`. Controles e inputs `12`, tarjetas `16`, etiquetas `8`. Sin círculos como contenedor de contenido; los avatares son la excepción.

## Components

- **Button:** primario violeta, secundario con borde de control, fantasma, WhatsApp (verde) y peligro. Alto de 44 px (36 y 52 como variantes). Estados: hover, foco visible, deshabilitado y cargando.
- **Input:** etiqueta siempre visible, ayuda y error con icono y `role="alert"`, texto de 16 px para evitar el zoom de iOS, icono opcional a la izquierda.
- **Badge:** neutral, acento, éxito, aviso, peligro y `Verificado`. La verificación se muestra solo si existe `verified_at`.
- **Card:** oscura por defecto, `raised`, `interactive` (borde de acento y elevación en hover) y `light` para superficie clara.
- **Iconos:** Lucide, trazo uniforme, siempre `aria-hidden` cuando acompañan texto. Las categorías guardan el nombre del icono Lucide en la base de datos.

## Do's and Don'ts

### Do
- Usá tokens semánticos (`bg-surface`, `text-text-muted`), nunca hex sueltos.
- Mostrá "Sin reseñas todavía" y "Sin información" antes que inventar datos.
- Probá cada pantalla en 375 px y con teclado.

### Don't
- No uses emojis como iconos.
- No encierres todo en tarjetas idénticas de icono, título y texto.
- No agregues glassmorphism, degradados de relleno ni sombras sin desplazamiento.
- No sustituyas la fotografía de `noche_ciudad` por una genérica ni la deformes.
