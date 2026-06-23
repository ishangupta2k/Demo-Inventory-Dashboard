// Presentational analysis view. Every number is computed by analyze() in lib/engine.mjs
// with plain, explainable arithmetic — no AI or machine learning.

type AItem = {
  scan: string;
  description: string;
  vendor: string;
  inventory: number;
  sold: number;
  daysOfSupply: number | null;
};
type VendorRow = {
  vendor_name: string;
  sales: number;
  inventory: number;
  orderLines: number;
  suggestedCases: number;
};
export type Analysis = {
  totalUnitsSold: number;
  currentInventoryUnits: number;
  totalSuggestedCases: number;
  vendorsRequiringOrder: number;
  stockoutRiskCount: number;
  dailyTrend: { date: string; units: number }[];
  topSellers: AItem[];
  vendorSummary: VendorRow[];
  stockoutRisk: AItem[];
  noSalesInventory: AItem[];
  highStock: AItem[];
};

const n = (v: number) => Math.round(v).toLocaleString();
const dos = (v: number | null) => (v === null ? "—" : `${Math.round(v)}d`);

function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="metric-card">
      <div className="metric-value">{value}</div>
      <div className="metric-label">{label}</div>
      {hint && <div className="metric-hint">{hint}</div>}
    </div>
  );
}

function TrendChart({ data }: { data: { date: string; units: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.units));
  return (
    <figure className="section-panel">
      <figcaption className="mb-4">
        <div className="text-base font-bold">Daily units sold</div>
        <div className="text-sm text-[color:var(--muted)]">14-day sales trend, peak {max.toLocaleString()} units</div>
      </figcaption>
      <div className="grid grid-cols-[repeat(14,minmax(0,1fr))] gap-1" role="img" aria-label={`Daily sales for ${data.length} days, peak ${max} units`}>
        {data.map((d) => (
          <div key={d.date} className="flex min-w-0 flex-col items-center gap-1" title={`${d.date}: ${d.units} units`}>
            <div className="flex h-32 w-full items-end">
              <div
                className="w-full rounded-t-[6px] bg-[color:var(--primary)]"
                style={{ height: `${(d.units / max) * 100}%`, minHeight: d.units > 0 ? 4 : 0 }}
              />
            </div>
            <span className="text-[10px] text-[color:var(--faint)]">{d.date.slice(5)}</span>
          </div>
        ))}
      </div>
    </figure>
  );
}

function ItemTable({
  title,
  rule,
  rows,
  columns,
}: {
  title: string;
  rule: string;
  rows: AItem[];
  columns: { header: string; cell: (r: AItem) => string | number; num?: boolean }[];
}) {
  return (
    <section>
      <h3 className="font-semibold">{title}</h3>
      <p className="mb-2 text-xs text-[color:var(--muted)]">{rule}</p>
      {rows.length === 0 ? (
        <p className="text-sm text-[color:var(--muted)]">None in this dataset.</p>
      ) : (
        <div className="table-wrap compact-table-wrap" style={{ maxHeight: "20rem" }}>
          <table className="data-table compact-data-table">
            <thead>
              <tr>{columns.map((c) => <th key={c.header} scope="col" className={c.num ? "num" : ""}>{c.header}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.scan}>
                  {columns.map((c) => <td key={c.header} className={c.num ? "num" : ""}>{c.cell(r)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default function AnalysisView({ a }: { a: Analysis }) {
  return (
    <div className="analysis-view space-y-8">
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-5">
        <Stat label="Units sold (14d)" value={n(a.totalUnitsSold)} />
        <Stat label="Current inventory units" value={n(a.currentInventoryUnits)} />
        <Stat label="Suggested cases" value={n(a.totalSuggestedCases)} />
        <Stat label="Vendors needing an order" value={a.vendorsRequiringOrder} />
        <Stat label="Stockout-risk items" value={a.stockoutRiskCount} hint="inventory ≤ 0, sales > 0" />
      </div>

      <TrendChart data={a.dailyTrend} />

      <section>
        <h3 className="font-semibold">Top 10 fastest-selling products</h3>
        <p className="mb-2 text-xs text-[color:var(--muted)]">Ranked by units sold over the 14-day window.</p>
        <div className="table-wrap analysis-table-wrap" style={{ maxHeight: "24rem" }}>
          <table className="data-table analysis-table">
            <thead>
              <tr>
                <th scope="col" className="num">#</th>
                <th scope="col">Item</th>
                <th scope="col">Vendor</th>
                <th scope="col" className="num">Sold</th>
                <th scope="col" className="num">On hand</th>
                <th scope="col" className="num">Days supply</th>
              </tr>
            </thead>
            <tbody>
              {a.topSellers.map((r, i) => (
                <tr key={r.scan}>
                  <td className="num">{i + 1}</td>
                  <td>{r.description}</td>
                  <td>{r.vendor}</td>
                  <td className="num">{n(r.sold)}</td>
                  <td className="num">{n(r.inventory)}</td>
                  <td className="num">{dos(r.daysOfSupply)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h3 className="font-semibold">Vendor summary</h3>
        <p className="mb-2 text-xs text-[color:var(--muted)]">Sales and on-hand from the upload; order lines and cases from the generated PO.</p>
        <div className="table-wrap analysis-table-wrap" style={{ maxHeight: "24rem" }}>
          <table className="data-table analysis-table">
            <thead>
              <tr>
                <th scope="col">Vendor</th>
                <th scope="col" className="num">Units sold</th>
                <th scope="col" className="num">On hand</th>
                <th scope="col" className="num">Order lines</th>
                <th scope="col" className="num">Suggested cases</th>
              </tr>
            </thead>
            <tbody>
              {a.vendorSummary.map((v) => (
                <tr key={v.vendor_name}>
                  <td>{v.vendor_name}</td>
                  <td className="num">{n(v.sales)}</td>
                  <td className="num">{n(v.inventory)}</td>
                  <td className="num">{v.orderLines}</td>
                  <td className="num">{v.suggestedCases}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-3">
        <ItemTable
          title="Stockout risk"
          rule="Inventory ≤ 0 and sales > 0 — selling but out of stock."
          rows={a.stockoutRisk}
          columns={[
            { header: "Item", cell: (r) => r.description },
            { header: "Sold", cell: (r) => n(r.sold), num: true },
          ]}
        />
        <ItemTable
          title="No-sales inventory"
          rule="Inventory > 0 and sales = 0 — capital sitting on the shelf."
          rows={a.noSalesInventory}
          columns={[
            { header: "Item", cell: (r) => r.description },
            { header: "On hand", cell: (r) => n(r.inventory), num: true },
          ]}
        />
        <ItemTable
          title="High stock"
          rule="More than 30 days of supply at the current sales rate."
          rows={a.highStock}
          columns={[
            { header: "Item", cell: (r) => r.description },
            { header: "Days supply", cell: (r) => dos(r.daysOfSupply), num: true },
          ]}
        />
      </div>
    </div>
  );
}
