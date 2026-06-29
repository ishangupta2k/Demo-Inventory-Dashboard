"use client"; // file input, in-memory parsing, and live editing -> Client Component

import { useMemo, useRef, useState } from "react";
import { fixtures } from "@/lib/fixtures.mjs";
import { computeLines, analyze, parseFile } from "@/lib/engine.mjs";
import PoTable, { finalOf, type Line } from "./po-table";
import AnalysisView, { type Analysis } from "./analysis";
import { setRunContext } from "@/lib/run-context";

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
type Tab = "upload" | "pos" | "analysis";

// Serialize the run so the global assistant widget can ground on it (lib/run-context).
function runGrounding(a: Analysis) {
  const item = (i: Analysis["topSellers"][number]) =>
    `${i.description} (vendor ${i.vendor}): sold ${i.sold}, on hand ${i.inventory}` +
    (i.daysOfSupply === null ? "" : `, ~${Math.round(i.daysOfSupply)}d supply`);
  return [
    `Total units sold (14d): ${a.totalUnitsSold}`,
    `Current inventory units: ${a.currentInventoryUnits}`,
    `Total suggested cases: ${a.totalSuggestedCases}`,
    `Vendors requiring an order: ${a.vendorsRequiringOrder}`,
    `Items at stockout risk: ${a.stockoutRiskCount}`,
    ``, `Top sellers:`, ...a.topSellers.slice(0, 10).map((i) => `- ${item(i)}`),
    ``, `Stockout risk:`, ...a.stockoutRisk.slice(0, 10).map((i) => `- ${item(i)}`),
    ``, `Overstock:`, ...a.highStock.slice(0, 10).map((i) => `- ${item(i)}`),
    ``, `Vendor summary:`,
    ...a.vendorSummary.map(
      (v) => `- ${v.vendor_name}: ${v.sales} sold, ${v.inventory} on hand, ${v.suggestedCases} cases / ${v.orderLines} lines`
    ),
  ].join("\n");
}

export default function DemoClient() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<Tab>("upload");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const [lines, setLines] = useState<Line[]>([]);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [salesDate, setSalesDate] = useState<string | null>(null);
  const [vendor, setVendor] = useState<string>("");

  const hasResult = analysis !== null;

  const vendorNames = useMemo(
    () => [...new Set(lines.map((l) => l.vendor_name))].sort(),
    [lines]
  );
  const rowsForVendor = useMemo(
    () =>
      lines
        .filter((l) => l.vendor_name === vendor)
        .sort((a, b) => a.item_description.localeCompare(b.item_description)),
    [lines, vendor]
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const file = fileRef.current?.files?.[0];
    if (!file) return setError("Please choose an .xlsx file.");
    if (!file.name.toLowerCase().endsWith(".xlsx"))
      return setError("The upload must be an .xlsx workbook.");
    if (file.size > MAX_UPLOAD_BYTES)
      return setError("The workbook must be 25 MB or smaller.");

    setPending(true);
    try {
      // Parsed entirely in the browser — bytes are never uploaded, logged, or stored.
      const { inv, sales, dailyTotals, latest } = await parseFile(file);
      const computed: Line[] = computeLines(fixtures, inv, sales);
      if (computed.length === 0) {
        setError(
          "That workbook parsed, but no catalog items needed ordering. Make sure scan codes match the synthetic catalog (try the sample workbook)."
        );
        return;
      }
      const a: Analysis = analyze({ catalog: fixtures.catalog, lines: computed, inv, sales, dailyTotals });
      setLines(computed);
      setAnalysis(a);
      setRunContext(runGrounding(a));
      setSalesDate(latest ? latest.toISOString().slice(0, 10) : null);
      setVendor([...new Set(computed.map((l) => l.vendor_name))].sort()[0] ?? "");
      setTab("pos");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read that file.");
    } finally {
      setPending(false);
    }
  }

  function onAdjust(fullScanCode: string, raw: string) {
    setLines((ls) => ls.map((l) => (l.full_scan_code === fullScanCode ? { ...l, adjustment: raw } : l)));
  }

  function downloadCsv() {
    const esc = (v: string | number) => {
      const s = String(v ?? "");
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const header = ["Vendor", "Scan Code", "Item Code", "Item Description", "Current Inv", "Sales (14d)", "Suggested Cases", "Adjustment", "Final Order"];
    const body = rowsForVendor.map((r) =>
      [r.vendor_name, r.full_scan_code, r.sku ?? "", r.item_description, Math.round(r.inventory), Math.round(r.sales_window * 10) / 10, r.suggested_cases, Number(r.adjustment) || 0, finalOf(r)]
        .map(esc)
        .join(",")
    );
    const csv = [header.join(","), ...body].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${vendor.replace(/[^\w]+/g, "-").replace(/^-|-$/g, "")}-purchase-order.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const tabBtn = (id: Tab, label: string, disabled = false) => (
    <button
      type="button"
      onClick={() => setTab(id)}
      disabled={disabled}
      aria-current={tab === id ? "page" : undefined}
      className={"tab-button " + (tab === id ? "is-active" : "")}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-6">
      <header className="page-header">
        <div>
          <p className="eyebrow">Demo workspace</p>
          <h1 className="page-title">Purchase orders</h1>
          <p className="page-subtitle">
            Upload the synthetic workbook, review vendor purchase orders, edit adjustments,
            and inspect the demand analysis in one browser session.
          </p>
        </div>
        {hasResult && (
          <div className="summary-panel min-w-[14rem] sm:grid-cols-3 lg:grid-cols-1">
            <div className="summary-tile">
              <div className="summary-value">{vendorNames.length}</div>
              <div className="summary-label">Vendors in current run</div>
            </div>
            <div className="summary-tile">
              <div className="summary-value">{lines.length}</div>
              <div className="summary-label">Order lines generated</div>
            </div>
            <div className="summary-tile">
              <div className="summary-value">{analysis?.totalSuggestedCases ?? 0}</div>
              <div className="summary-label">Suggested cases</div>
            </div>
          </div>
        )}
      </header>

      <div className="tab-row">
        {tabBtn("upload", "Upload")}
        {tabBtn("pos", "Purchase orders", !hasResult)}
        {tabBtn("analysis", "Analysis", !hasResult)}
      </div>

      {tab === "upload" && (
        <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
          <section className="section-panel">
            <p className="eyebrow">Step 1</p>
            <h2 className="mt-1 text-xl font-bold">Start with sample data</h2>
            <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
              The sample workbook includes matching scan codes and realistic 14-day sales patterns,
              so the order and analysis views populate immediately.
            </p>
            <a href="/sample-inventory.xlsx" download className="btn btn-primary mt-5">
              Download workbook
            </a>
          </section>

          <form onSubmit={onSubmit} className="section-panel">
            <p className="eyebrow">Step 2</p>
            <h2 className="mt-1 text-xl font-bold">Upload and generate</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
              <div>
                <label htmlFor="workbook" className="mb-1 block text-sm font-semibold">Workbook file</label>
                <input
                  id="workbook"
                  ref={fileRef}
                  type="file"
                  name="file"
                  accept=".xlsx"
                  className="input file:mr-3 file:rounded-[6px] file:border-0 file:bg-[color:var(--surface-muted)] file:px-3 file:py-1 file:text-sm file:font-semibold file:text-[color:var(--ink)]"
                />
              </div>
              <button disabled={pending} className="btn btn-primary">
                {pending ? "Generating..." : "Generate order"}
              </button>
            </div>
            {error && <p className="mt-3 text-sm font-semibold text-[color:var(--danger)]" role="alert">{error}</p>}
            <p className="mt-4 text-xs leading-5 text-[color:var(--muted)]">
              Files are parsed in the browser. Uploaded bytes are not logged, saved, or sent to a database.
            </p>
          </form>

          <section className="section-panel lg:col-span-2">
            <h2 className="text-base font-bold">Accepted workbook shape</h2>
            <p className="mt-1 text-sm text-[color:var(--muted)]">
              One <strong>.xlsx</strong> workbook, 25 MB or smaller, with two sheets named exactly:
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="spec-box">
                <div className="mono text-sm font-semibold text-[color:var(--primary-strong)]">InventoryData</div>
                <ul className="mt-3 space-y-1 text-sm text-[color:var(--muted)]">
                  <li><span className="mono font-semibold text-[color:var(--ink)]">Scan Code</span> or <span className="mono">UPC</span></li>
                  <li><span className="mono font-semibold text-[color:var(--ink)]">Date</span></li>
                  <li><span className="mono font-semibold text-[color:var(--ink)]">Current Qty</span>, <span className="mono">In Stock</span>, or <span className="mono">Current Inventory</span></li>
                </ul>
              </div>
              <div className="spec-box">
                <div className="mono text-sm font-semibold text-[color:var(--primary-strong)]">SalesHistory</div>
                <ul className="mt-3 space-y-1 text-sm text-[color:var(--muted)]">
                  <li><span className="mono font-semibold text-[color:var(--ink)]">Scan Code</span> or <span className="mono">UPC</span></li>
                  <li><span className="mono font-semibold text-[color:var(--ink)]">Date</span></li>
                  <li><span className="mono font-semibold text-[color:var(--ink)]">Sold Qty</span>, <span className="mono">Qty Sold</span>, <span className="mono">Total Qty</span>, or <span className="mono"># Sold</span></li>
                </ul>
              </div>
            </div>
            <p className="mt-3 text-xs leading-5 text-[color:var(--faint)]">Column names are case-sensitive. Extra columns are ignored. Dates may be Excel dates or YYYY-MM-DD / M/D/YYYY.</p>
          </section>
        </div>
      )}

      {tab === "pos" && hasResult && (
        <div className="space-y-4">
          <div className="toolbar">
            <div>
              <label htmlFor="vendor-select" className="mb-1 block text-sm font-semibold">Vendor</label>
              <select
                id="vendor-select"
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                className="input min-w-[16rem]"
              >
                {vendorNames.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
              {salesDate && <div className="mt-1 text-xs text-[color:var(--muted)]">Sales through {salesDate}</div>}
            </div>
            <button type="button" onClick={downloadCsv} className="btn">Download CSV</button>
          </div>
          <PoTable rows={rowsForVendor} onAdjust={onAdjust} />
          <p className="text-xs leading-5 text-[color:var(--muted)]">
            Final Order = max(0, Suggested + Adjustment). Edit any Adjustment to override the suggestion;
            totals update live. Adjustments live in this browser session only.
          </p>
        </div>
      )}

      {tab === "analysis" && analysis && <AnalysisView a={analysis} />}
    </div>
  );
}
