// app/page.tsx -> "/" (Home / landing). Server Component, reads bundled fixtures.
import Link from "next/link";
import { catalog, vendors } from "@/lib/fixtures.mjs";

export default function HomePage() {
  const steps = [
    { n: 1, title: "Bundled catalog", desc: "Items, vendors, scan codes, case sizes, and per-vendor order rules live in the app as fixtures." },
    { n: 2, title: "Upload a POS export", desc: "Drop in an inventory + sales workbook. It's parsed entirely in your browser — nothing is uploaded or stored." },
    { n: 3, title: "Vendor-ready POs + analytics", desc: "Suggested order quantities per vendor, an analysis view, live adjustments, and a CSV export." },
  ];

  const arch = [
    ["Stateless", "No database, no login, no server writes. A refresh resets the whole demo."],
    ["In-browser parsing", "The Excel workbook is read in memory with read-excel-file. Bytes never leave the page."],
    ["Explainable math", "Every order quantity and metric is plain arithmetic — no AI, no machine learning."],
  ];

  return (
    <div className="space-y-10 pb-10">
      <section className="hero-panel">
        <div className="flex flex-col justify-between gap-8">
          <div>
            <p className="eyebrow">Retail operations demo</p>
            <h1 className="page-title max-w-3xl">
              Turn POS exports into vendor purchase orders.
            </h1>
            <p className="page-subtitle">
              A sanitized interactive demo of a private retail operations platform. Upload an
              inventory &amp; sales workbook and get vendor-ready purchase orders computed from
              real demand.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link href="/demo" className="btn btn-primary">Open demo</Link>
            <Link href="/catalog" className="btn">View catalog</Link>
          </div>
        </div>

        <aside className="summary-panel" aria-label="Demo summary">
          <div className="summary-tile">
            <div className="summary-value">{catalog.length}</div>
            <div className="summary-label">Synthetic catalog items</div>
          </div>
          <div className="summary-tile">
            <div className="summary-value">{vendors.length}</div>
            <div className="summary-label">Fictional vendors</div>
          </div>
          <div className="summary-tile">
            <div className="summary-value">0</div>
            <div className="summary-label">Server-side uploaded-file writes</div>
          </div>
        </aside>
      </section>

      <section className="section-panel">
        <h2 className="eyebrow">The problem</h2>
        <p className="mt-3 max-w-4xl text-[1rem] leading-7 text-[color:var(--muted)]">
          A convenience store re-orders hundreds of items from several vendors every week. Done
          by hand in spreadsheets, that means eyeballing sales against shelf counts, item by item,
          for every supplier — slow, error-prone, and easy to over- or under-order. This tool
          replaces that grind: it reads the point-of-sale inventory and sales export and proposes
          how many cases to order from each vendor, with the math you can check.
        </p>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Workflow</p>
            <h2 className="text-2xl font-bold">From export to reviewed order</h2>
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {steps.map((st) => (
            <div key={st.n} className="section-panel">
              <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-[8px] bg-[color:var(--primary)] text-sm font-bold text-white">
                {st.n}
              </div>
              <h3 className="font-semibold">{st.title}</h3>
              <p className="mt-1 text-sm leading-6 text-[color:var(--muted)]">{st.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4">
          <p className="eyebrow">Architecture</p>
          <h2 className="text-2xl font-bold">Public-safe by design</h2>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {arch.map(([t, d]) => (
            <div key={t} className="section-panel">
              <h3 className="font-semibold">{t}</h3>
              <p className="mt-1 text-sm leading-6 text-[color:var(--muted)]">{d}</p>
            </div>
          ))}
        </div>
        <p className="mt-5 text-sm text-[color:var(--muted)]">
          The real operational deployment is private and database-backed. This public demo is a
          sanitized copy with synthetic data and no persistence.
        </p>
      </section>
    </div>
  );
}
