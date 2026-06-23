// app/vendors/[vendor]/page.tsx -> "/vendors/<name>". One vendor's items + settings.
// [vendor] is a DYNAMIC SEGMENT: the URL part arrives as params.vendor.
import Link from "next/link";
import { notFound } from "next/navigation";
import { catalog, vendors } from "@/lib/fixtures.mjs";

type Item = {
  full_scan_code: string;
  vendor_name: string;
  sku: string | null;
  item_description: string;
  department: string | null;
  case_qty: number | null;
  active: boolean;
  allow_order: boolean;
};
type Vendor = { vendor_name: string; sales_window_days: number; target_days: number; inventory_credit: number };

// params is a Promise in this Next version, so we await it.
export default async function VendorItemsPage({
  params,
}: {
  params: Promise<{ vendor: string }>;
}) {
  const { vendor: vendorRaw } = await params;
  const vendor = decodeURIComponent(vendorRaw); // this Next version does NOT auto-decode

  const settings = (vendors as Vendor[]).find((v) => v.vendor_name === vendor);
  if (!settings) notFound();

  const items = (catalog as Item[])
    .filter((it) => it.vendor_name === vendor)
    .sort((a, b) => a.item_description.localeCompare(b.item_description));

  const dash = (v: string | number | null) => (v === null || v === "" ? "—" : v);

  return (
    <div>
      <Link href="/vendors" className="mb-5 inline-flex text-sm font-semibold text-[color:var(--primary)] hover:underline">← All vendors</Link>
      <header className="page-header">
        <div>
          <p className="eyebrow">Vendor profile</p>
          <h1 className="page-title">{vendor}</h1>
          <p className="page-subtitle">{items.length} catalog items with synthetic settings and scan codes.</p>
        </div>
      </header>

      <dl className="mb-5 grid gap-3 sm:grid-cols-3">
        <div className="metric-card">
          <dt className="metric-label">Sales window</dt>
          <dd className="metric-value text-[1.4rem]">{settings.sales_window_days}d</dd>
        </div>
        <div className="metric-card">
          <dt className="metric-label">Target days of stock</dt>
          <dd className="metric-value text-[1.4rem]">{settings.target_days}d</dd>
        </div>
        <div className="metric-card">
          <dt className="metric-label">Inventory credit</dt>
          <dd className="metric-value text-[1.4rem]">{settings.inventory_credit}</dd>
        </div>
      </dl>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">Scan Code</th>
              <th scope="col">Item</th>
              <th scope="col">Dept</th>
              <th scope="col" className="num">Case Qty</th>
              <th scope="col">Active</th>
              <th scope="col">Allow Order</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.full_scan_code}>
                <td className="mono">{item.full_scan_code}</td>
                <td>{item.item_description}</td>
                <td>{dash(item.department)}</td>
                <td className="num">{dash(item.case_qty)}</td>
                <td>{item.active ? "Yes" : "No"}</td>
                <td>{item.allow_order ? "Yes" : "No"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
