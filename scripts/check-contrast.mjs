// Valida contraste WCAG de los tokens definidos en src/app/globals.css (ambito oscuro y .surface-light).
// Uso: npm run check:contrast
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../src/app/globals.css", import.meta.url), "utf8");

function block(startPattern) {
  const start = css.search(startPattern);
  if (start === -1) throw new Error(`No se encontro el bloque ${startPattern}`);
  const open = css.indexOf("{", start);
  let depth = 0;
  for (let i = open; i < css.length; i++) {
    if (css[i] === "{") depth++;
    if (css[i] === "}" && --depth === 0) return css.slice(open + 1, i);
  }
  throw new Error("Bloque sin cerrar");
}

function tokens(body) {
  const out = {};
  for (const m of body.matchAll(/--color-([a-z-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)) out[m[1]] = m[2];
  return out;
}

const dark = tokens(block(/@theme static/));
const light = { ...dark, ...tokens(block(/\.surface-light\s*\{/)) };

const lum = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

// [primer plano, fondo, minimo]. 4.5 texto normal, 3 componentes de interfaz y foco.
const pairs = [
  ["text", "bg", 4.5], ["text", "surface", 4.5], ["text", "surface-raised", 4.5],
  ["text-muted", "bg", 4.5], ["text-muted", "surface", 4.5], ["text-muted", "surface-raised", 4.5],
  ["accent-contrast", "accent", 4.5], ["accent-contrast", "accent-hover", 4.5],
  ["accent-text", "bg", 4.5], ["accent-text", "surface", 4.5], ["accent-text", "surface-raised", 4.5], ["accent-text", "accent-soft", 4.5],
  ["success-contrast", "success", 4.5], ["success-contrast", "success-hover", 4.5],
  ["success-text", "surface", 4.5], ["success-text", "success-soft", 4.5],
  ["warning-text", "surface", 4.5], ["warning-text", "warning-soft", 4.5],
  ["danger-contrast", "danger", 4.5], ["danger-contrast", "danger-hover", 4.5],
  ["danger-text", "surface", 4.5], ["danger-text", "danger-soft", 4.5],
  ["focus", "bg", 3], ["focus", "surface", 3],
  ["border-strong", "bg", 3], ["border-strong", "surface", 3],
];

let failed = 0;
for (const [scopeName, scope] of [["oscuro", dark], ["claro", light]]) {
  for (const [fg, bg, min] of pairs) {
    if (!scope[fg] || !scope[bg]) continue;
    const r = ratio(scope[fg], scope[bg]);
    const ok = r >= min;
    if (!ok) failed++;
    console.log(`${ok ? "OK  " : "FALLA"} [${scopeName}] ${fg} ${scope[fg]} sobre ${bg} ${scope[bg]}: ${r.toFixed(2)} (min ${min})`);
  }
}
console.log(failed ? `\n${failed} pares no cumplen WCAG AA` : "\nTodos los pares cumplen WCAG AA");
process.exit(failed ? 1 : 0);
