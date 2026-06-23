// app/vendors/page.tsx -> "/vendors". Vendor cards with item counts + order settings.
import Link from "next/link";
import { catalog, vendors } from "@/lib/fixtures.mjs";

type Item = { vendor_name: string };
type Vendor = { vendor_name: string; sales_window_days: number; target_days: number; inventory_credit: number };

export default function VendorsPage() {
  const counts = new Map<string, number>();
  for (const it of catalog as Item[])
    counts.set(it.vendor_name, (counts.get(it.vendor_name) ?? 0) + 1);

  const list = [...(vendors as Vendor[])].sort((a, b) => a.vendor_name.localeCompare(b.vendor_name));

  return (
    <div>
      <header className="page-header">
        <div>
          <p className="eyebrow">Vendor configuration</p>
          <h1 className="page-title">Vendors</h1>
          <p className="page-subtitle">{list.length} fictional suppliers with per-vendor order settings.</p>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((v) => (
          <Link
            key={v.vendor_name}
            href={`/vendors/${encodeURIComponent(v.vendor_name)}`}
            className="section-panel group block transition-colors hover:border-[color:var(--primary)] hover:bg-[#f7fbf8]"
          >
            <div className="flex items-center justify-between">
              <div className="font-bold">{v.vendor_name}</div>
              <span className="text-[color:var(--primary)] transition-transform group-hover:translate-x-0.5">→</span>
            </div>
            <div className="mt-1 text-sm text-[color:var(--muted)]">{(counts.get(v.vendor_name) ?? 0).toLocaleString()} catalog items</div>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="badge">Target {v.target_days}d</span>
              <span className="badge">Window {v.sales_window_days}d</span>
              <span className="badge">Inv credit {v.inventory_credit}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
