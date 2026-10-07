"use client";

import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-start justify-center gap-4 px-4 py-16">
      <TriangleAlert className="size-8 text-warning" aria-hidden="true" />
      <h1 className="font-display text-3xl font-bold">No pudimos cargar esta página</h1>
      <p className="text-text-muted">
        Hubo un problema al conectar con el servidor. Probá de nuevo en unos segundos.
      </p>
      <Button onClick={reset}>Reintentar</Button>
    </main>
  );
}
