// app/catalog/page.tsx -> "/catalog". Server Component: loads fixture rows, hands
// them to the client table (which adds the search box).
import { catalog } from "@/lib/fixtures.mjs";
import CatalogTable, { type Item } from "./table";

export default function CatalogPage() {
  const rows = [...(catalog as Item[])].sort((a, b) =>
    a.vendor_name.localeCompare(b.vendor_name) || a.item_description.localeCompare(b.item_description)
  );

  return (
    <div>
      <header className="page-header">
        <div>
          <p className="eyebrow">Synthetic reference data</p>
          <h1 className="page-title">Catalog</h1>
          <p className="page-subtitle">Search the fictional products used by the demo purchase-order engine.</p>
        </div>
      </header>
      <CatalogTable rows={rows} />
    </div>
  );
}
