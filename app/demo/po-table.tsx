// Editable purchase-order table for one vendor. Adjustments are held in the parent's
// React state (no server, no persistence) — Final Order and totals recompute live.

export type Line = {
  vendor_name: string;
  full_scan_code: string;
  sku: string | null;
  item_description: string;
  case_qty: number | null;
  inventory: number;
  sales_window: number;
  suggested_cases: number;
  adjustment: number | string; // string while typing (e.g. "-")
};

export const finalOf = (r: Line) => Math.max(0, r.suggested_cases + (Number(r.adjustment) || 0));

const fmt = (v: number) => (Number.isInteger(v) ? v.toLocaleString() : v.toFixed(1));

export default function PoTable({
  rows,
  onAdjust,
}: {
  rows: Line[];
  onAdjust: (fullScanCode: string, raw: string) => void;
}) {
  const totSug = rows.reduce((s, r) => s + r.suggested_cases, 0);
  const totFinal = rows.reduce((s, r) => s + finalOf(r), 0);

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th scope="col">Scan Code</th>
            <th scope="col">Item Code</th>
            <th scope="col">Item Description</th>
            <th scope="col" className="num">Current Inv</th>
            <th scope="col" className="num">Sales (14d)</th>
            <th scope="col" className="num">Suggested</th>
            <th scope="col" className="num">Adjustment</th>
            <th scope="col" className="num">Final Order</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.full_scan_code}>
              <td className="mono">{r.full_scan_code}</td>
              <td>{r.sku ?? "—"}</td>
              <td>{r.item_description}</td>
              <td className="num">{fmt(r.inventory)}</td>
              <td className="num">{fmt(r.sales_window)}</td>
              <td className="num">{r.suggested_cases}</td>
              <td className="num">
                <label className="sr-only" htmlFor={`adj-${r.full_scan_code}`}>
                  Adjustment for {r.item_description}
                </label>
                <input
                  id={`adj-${r.full_scan_code}`}
                  type="text"
                  inputMode="numeric"
                  value={r.adjustment}
                  onChange={(e) => onAdjust(r.full_scan_code, e.target.value)}
                  className="adjustment-input"
                />
              </td>
              <td className="num font-semibold">{finalOf(r)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td>TOTAL</td>
            <td /><td /><td /><td />
            <td className="num">{totSug}</td>
            <td />
            <td className="num">{totFinal}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
