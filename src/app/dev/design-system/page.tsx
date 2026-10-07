import { notFound } from "next/navigation";
import { Search, MapPin, Clock, Star } from "lucide-react";
import { Badge, VerifiedBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export const metadata = { title: "Sistema de diseño — YUNTA", robots: { index: false } };

const swatches = [
  ["bg", "Fondo de página"],
  ["surface", "Superficie"],
  ["surface-raised", "Superficie elevada"],
  ["border", "Borde sutil"],
  ["border-strong", "Borde de control"],
  ["text", "Texto"],
  ["text-muted", "Texto secundario"],
  ["accent", "Acento"],
  ["accent-soft", "Acento suave"],
  ["accent-text", "Texto de acento"],
  ["success", "Éxito / WhatsApp"],
  ["warning", "Aviso"],
  ["danger", "Error"],
  ["focus", "Foco"],
] as const;

const radii = ["sm", "md", "lg", "xl"] as const;
const spacing = [1, 2, 3, 4, 6, 8, 12, 16] as const;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-border py-10">
      <h2 className="mb-6 text-2xl font-bold">{title}</h2>
      {children}
    </section>
  );
}

function Swatches({ light = false }: { light?: boolean }) {
  return (
    <div className={`${light ? "surface-light" : ""} rounded-lg bg-bg p-4`}>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {swatches.map(([token, label]) => (
          <li key={token} className="flex items-center gap-3">
            <span
              className="size-10 shrink-0 rounded-md border border-border-strong"
              style={{ background: `var(--color-${token})` }}
              aria-hidden="true"
            />
            <span className="min-w-0 text-sm">
              <span className="block break-words font-semibold text-text">{label}</span>
              <code className="break-all text-xs text-text-muted">--color-{token}</code>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function DesignSystemPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-24 pt-12">
      <h1 className="font-display text-4xl font-bold sm:text-5xl">Sistema de diseño YUNTA</h1>
      <p className="mt-3 max-w-[60ch] text-text-muted">
        Tokens y componentes base. Esta página existe solo en desarrollo.
      </p>

      <Section title="Color">
        <div className="space-y-4">
          <div>
            <h3 className="mb-2 text-base font-semibold">Ámbito oscuro (identidad)</h3>
            <Swatches />
          </div>
          <div>
            <h3 className="mb-2 text-base font-semibold">
              Superficie clara (<code>.surface-light</code>)
            </h3>
            <Swatches light />
          </div>
        </div>
      </Section>

      <Section title="Tipografía">
        <div className="space-y-5">
          <p className="font-display text-5xl font-extrabold tracking-tight">Servicios locales en Jujuy</p>
          <p className="font-display text-3xl font-bold">Electricistas cerca tuyo</p>
          <p className="font-display text-xl font-semibold">Instalaciones y reparaciones eléctricas</p>
          <p className="max-w-[65ch] text-base">
            Texto de cuerpo en Figtree. Encontrá lo que necesitás, conectá con profesionales y comercios de confianza y
            contactalos directo por WhatsApp.
          </p>
          <p className="text-sm text-text-muted">Texto secundario para detalles, distancias y horarios.</p>
          <p className="tnum text-xl font-semibold">$ 12.000 · $ 118.500 · 4,8</p>
        </div>
      </Section>

      <Section title="Radios, sombras y espaciado">
        <div className="flex flex-wrap items-end gap-6">
          {radii.map((r) => (
            <div key={r} className="text-center text-sm">
              <div
                className="size-16 border border-border-strong bg-surface-raised"
                style={{ borderRadius: `var(--radius-${r})` }}
              />
              <code className="mt-2 block text-xs text-text-muted">radius-{r}</code>
            </div>
          ))}
          <div className="text-center text-sm">
            <div className="size-16 rounded-lg bg-surface shadow-card" />
            <code className="mt-2 block text-xs text-text-muted">shadow-card</code>
          </div>
          <div className="text-center text-sm">
            <div className="size-16 rounded-lg bg-surface-raised shadow-raised" />
            <code className="mt-2 block text-xs text-text-muted">shadow-raised</code>
          </div>
        </div>
        <div className="mt-8 space-y-2">
          {spacing.map((s) => (
            <div key={s} className="flex items-center gap-3 text-xs text-text-muted">
              <code className="w-16">{s * 4} px</code>
              <span className="h-3 rounded-sm bg-accent" style={{ width: `calc(var(--spacing) * ${s})` }} />
            </div>
          ))}
        </div>
      </Section>

      <Section title="Botones">
        <div className="space-y-6">
          {(["primary", "secondary", "ghost", "whatsapp", "danger"] as const).map((v) => (
            <div key={v} className="flex flex-wrap items-center gap-3">
              <code className="w-24 text-xs text-text-muted">{v}</code>
              <Button variant={v}>Normal</Button>
              <Button variant={v} forceState="hover">
                Hover
              </Button>
              <Button variant={v} forceState="focus">
                Foco
              </Button>
              <Button variant={v} disabled>
                Deshabilitado
              </Button>
              <Button variant={v} loading>
                Cargando
              </Button>
            </div>
          ))}
          <div className="flex flex-wrap items-center gap-3">
            <code className="w-24 text-xs text-text-muted">tamaños</code>
            <Button size="sm">Pequeño</Button>
            <Button>Mediano</Button>
            <Button size="lg">Grande</Button>
          </div>
        </div>
      </Section>

      <Section title="Campos de texto">
        <div className="grid gap-6 sm:grid-cols-2">
          <Input
            label="¿Qué servicio necesitás?"
            placeholder="Electricista, plomero, garrafas…"
            icon={<Search className="size-full" />}
          />
          <Input
            label="Localidad"
            defaultValue="San Salvador de Jujuy"
            icon={<MapPin className="size-full" />}
            hint="Elegí la ciudad donde necesitás el servicio."
          />
          <Input label="Con foco" defaultValue="Instalaciones eléctricas" forceState="focus" />
          <Input
            label="WhatsApp"
            defaultValue="3884123456"
            error="Ingresá el número con código de país, por ejemplo +54 9 388 412 3456."
          />
          <Input label="Deshabilitado" defaultValue="No editable" disabled />
        </div>
      </Section>

      <Section title="Etiquetas">
        <div className="flex flex-wrap gap-2">
          <Badge>Neutral</Badge>
          <Badge tone="accent">Electricidad</Badge>
          <Badge tone="success">Disponible ahora</Badge>
          <Badge tone="warning">Pendiente de revisión</Badge>
          <Badge tone="danger">Suspendido</Badge>
          <VerifiedBadge />
        </div>
      </Section>

      <Section title="Tarjetas">
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="p-5">
            <h3 className="text-lg font-semibold">Tarjeta oscura</h3>
            <p className="mt-1 text-sm text-text-muted">Superficie base sobre el fondo de la página.</p>
          </Card>
          <Card raised interactive forceState="hover" className="p-5">
            <h3 className="text-lg font-semibold">Elevada e interactiva</h3>
            <p className="mt-1 text-sm text-text-muted">Estado hover: borde de acento y elevación.</p>
          </Card>
        </div>

        <h3 className="mb-3 mt-10 text-lg font-semibold">Composición: tarjeta de prestador (datos de ejemplo)</h3>
        <Card as="article" light interactive className="max-w-md p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h4 className="text-lg font-bold">[DEMO] Electricidad Jujuy</h4>
              <p className="text-sm text-text-muted">Instalaciones y reparaciones eléctricas</p>
            </div>
            <VerifiedBadge />
          </div>
          <ul className="mt-4 space-y-1.5 text-sm">
            <li className="flex items-center gap-2">
              <MapPin className="size-4 text-text-muted" aria-hidden="true" />
              San Salvador de Jujuy
            </li>
            <li className="flex items-center gap-2">
              <Clock className="size-4 text-text-muted" aria-hidden="true" />
              Disponible ahora · actualizado hace 20 min
            </li>
            <li className="tnum flex items-center gap-2 font-semibold">
              Desde $ 12.000 <span className="font-normal text-text-muted">(aprox.)</span>
            </li>
            <li className="flex items-center gap-2 text-text-muted">
              <Star className="size-4" aria-hidden="true" />
              Sin reseñas todavía
            </li>
          </ul>
          <div className="mt-5 flex gap-2">
            <Button variant="whatsapp" className="flex-1">
              Contactar por WhatsApp
            </Button>
            <Button variant="secondary">Ver perfil</Button>
          </div>
        </Card>
      </Section>
    </main>
  );
}
