"use client"; // interactive (typing) -> must be a Client Component

import { useState } from "react";

export type Item = {
  full_scan_code: string;
  vendor_name: string;
  sku: string | null;
  item_description: string;
  department: string | null;
  case_qty: number | null;
  active: boolean;
  allow_order: boolean;
};

// Gets all rows from the server page, filters them in the browser as you type.
export default function CatalogTable({ rows }: { rows: Item[] }) {
  const [q, setQ] = useState("");

  const needle = q.trim().toLowerCase();
  const shown = needle
    ? rows.filter(
        (r) =>
          r.item_description.toLowerCase().includes(needle) ||
          r.vendor_name.toLowerCase().includes(needle) ||
          r.full_scan_code.includes(needle)
      )
    : rows;

  const dash = (v: string | number | null) => (v === null || v === "" ? "—" : v);

  return (
    <>
      <div className="toolbar">
        <div className="w-full max-w-lg">
          <label htmlFor="catalog-search" className="mb-1 block text-sm font-semibold">Search catalog</label>
          <input
            id="catalog-search"
            type="search"
            placeholder="Item, vendor, or scan code"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="input"
          />
        </div>
        <p className="badge" aria-live="polite">
          {shown.length.toLocaleString()} of {rows.length.toLocaleString()} items
        </p>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">Vendor</th>
              <th scope="col">Scan Code</th>
              <th scope="col">Item Code</th>
              <th scope="col">Item</th>
              <th scope="col">Dept</th>
              <th scope="col" className="num">Case Qty</th>
              <th scope="col">Active</th>
              <th scope="col">Allow Order</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((item) => (
              <tr key={item.full_scan_code}>
                <td>{item.vendor_name}</td>
                <td className="mono">{item.full_scan_code}</td>
                <td>{dash(item.sku)}</td>
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
    </>
  );
}
