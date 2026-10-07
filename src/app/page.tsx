import { createClient } from "@/lib/supabase/server";
import { getCategoryIcon } from "@/lib/category-icons";

// Pagina temporal del SPEC 01: comprueba la conexion con la base de datos.
// El home definitivo se construye en el SPEC 02.
export default async function Home() {
  const supabase = await createClient();
  const { data: categories, error } = await supabase
    .from("categories")
    .select("id, name, slug, icon")
    .eq("is_active", true)
    .order("sort_order");

  if (error) throw new Error(`No se pudieron cargar las categorías: ${error.message}`);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-12">
      <h1 className="font-display text-4xl font-bold sm:text-5xl">YUNTA</h1>
      <p className="mt-3 max-w-[60ch] text-text-muted">Lo que necesitás, más cerca.</p>

      <h2 className="mb-5 mt-12 text-2xl font-bold">Categorías</h2>
      {categories.length === 0 ? (
        <p className="text-text-muted">Todavía no hay categorías cargadas.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {categories.map((category) => {
            const Icon = getCategoryIcon(category.icon);
            return (
              <li
                key={category.id}
                className="card flex min-h-14 items-center gap-3 px-4 py-3 text-sm font-semibold"
              >
                <Icon className="size-5 shrink-0 text-accent-text" aria-hidden="true" />
                {category.name}
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
