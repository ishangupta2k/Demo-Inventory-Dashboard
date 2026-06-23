// lib/engine.mjs — the purchase-order engine for the public demo.
//
// The formula, linked-scan rollup, Excel parsing, and column validation are copied
// VERBATIM from the private operational app's lib/generate.mjs so the demo behaves
// exactly like the real tool. The only change is that the catalog / vendor settings /
// linked mappings come from bundled fixtures instead of a database, and everything
// runs in the browser (no DB, no server writes). Uploaded bytes stay in memory.

const SALES_WINDOW_DAYS = 14;
const MIN_SALES_UNITS = 1;
const DEFAULTS = { target_days: 21, inventory_credit: 0.8 };

// --- helpers (verbatim from the operational generator) ---
const clean = (v) => String(v ?? "").trim();
const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
function normalizeScan(value) {
  let text = clean(value);
  const m = text.match(/^="?([^"]*)"?$/);
  if (m) text = m[1];
  const digits = text.replace(/\D/g, "");
  if (!digits) return "";
  return digits.replace(/^0+/, "") || "0";
}
export function excelSerialToDate(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime()))
    return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
  const text = clean(value);
  if (!text) return null;
  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return new Date(Date.UTC(+iso[1], +iso[2] - 1, +iso[3]));
  const slash = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (slash) return new Date(Date.UTC(slash[3].length === 2 ? +`20${slash[3]}` : +slash[3], +slash[1] - 1, +slash[2]));
  const n = Number(text);
  return Number.isFinite(n) ? new Date(Date.UTC(1899, 11, 30 + Math.floor(n))) : null;
}

// --- the order formula (targetDays + inventoryCredit are PER VENDOR) ---
export function suggestedCases({
  salesUsed,
  inventory,
  caseQty,
  targetDays,
  inventoryCredit,
  salesWindowDays = SALES_WINDOW_DAYS,
}) {
  if (salesUsed < MIN_SALES_UNITS) return 0;              // no/too-little demand
  if (!caseQty || caseQty <= 0) return 0;                 // can't size an order
  if (!salesWindowDays || salesWindowDays <= 0) return 0;
  const dailyRate = salesUsed / salesWindowDays;
  const needed = dailyRate * targetDays - inventoryCredit * Math.max(0, inventory);
  return needed > 0 ? Math.ceil(needed / caseQty) : 0;
}

const vendorScanKey = (vendorName, scan) => `${vendorName}::${normalizeScan(scan)}`;

export function rollupMetrics({ vendorName, scan, inv, sales, linksByOrderable }) {
  const key = normalizeScan(scan);
  const directInventoryInfo = inv.get(key);
  const directInventory = directInventoryInfo?.qty ?? 0;
  const directSales = sales.get(key) ?? 0;
  const links = linksByOrderable.get(vendorScanKey(vendorName, key)) ?? [];

  let linkedInventory = 0;
  let linkedSales = 0;
  for (const link of links) {
    linkedInventory += (inv.get(link.linkedScan)?.qty ?? 0) / link.ratio;
    linkedSales += (sales.get(link.linkedScan) ?? 0) / link.ratio;
  }

  return {
    inventory: directInventoryInfo && directInventory > 0 ? directInventory : linkedInventory,
    salesUsed: directSales + linkedSales,
  };
}

const colOf = (row, ...names) => {
  for (const n of names) if (row[n] !== undefined && clean(row[n]) !== "") return row[n];
  return "";
};

// Aggregate raw POS rows -> per-scan inventory (latest Current Qty), 14d sales total,
// and per-day sales totals (for the analysis trend chart).
export function aggregate(invRows, salesRows) {
  const inv = new Map();
  for (const r of invRows) {
    const k = normalizeScan(colOf(r, "UPC", "Scan Code"));
    if (!k) continue;
    const d = excelSerialToDate(r["Date"]);
    const prev = inv.get(k);
    if (!prev || (d && (!prev.d || d >= prev.d)))
      inv.set(k, { d, qty: Math.max(0, num(colOf(r, "Current Qty", "In Stock", "Current Inventory"))) });
  }
  let latest = null;
  for (const r of salesRows) { const d = excelSerialToDate(r["Date"]); if (d && (!latest || d > latest)) latest = d; }
  const cutoff = latest ? new Date(latest.getTime() - (SALES_WINDOW_DAYS - 1) * 86400000) : null;
  const sales = new Map();
  const dailyTotals = new Map();
  for (const r of salesRows) {
    const d = excelSerialToDate(r["Date"]);
    if (!d || !latest || d < cutoff || d > latest) continue;
    const k = normalizeScan(colOf(r, "UPC", "Scan Code"));
    if (!k) continue;
    const qty = num(colOf(r, "Qty Sold", "Total Qty", "Sold Qty", "# Sold"));
    sales.set(k, (sales.get(k) || 0) + qty);
    const day = d.toISOString().slice(0, 10);
    dailyTotals.set(day, (dailyTotals.get(day) || 0) + qty);
  }
  return { inv, sales, dailyTotals, latest };
}

export function sheetObjects(data, sheetName, requiredColumnGroups) {
  const [headerRow = [], ...dataRows] = data;
  const headers = headerRow.map((value) => clean(value));
  if (dataRows.length === 0) throw new Error(`${sheetName} has no data rows.`);
  for (const alternatives of requiredColumnGroups) {
    if (!alternatives.some((column) => headers.includes(column))) {
      throw new Error(`${sheetName} needs a ${alternatives.join(" or ")} column.`);
    }
  }
  return dataRows.map((row) => Object.fromEntries(
    headers.flatMap((header, index) => header ? [[header, row[index] ?? ""]] : [])
  ));
}

const INVENTORY_COLUMNS = [
  ["UPC", "Scan Code"],
  ["Date"],
  ["Current Qty", "In Stock", "Current Inventory"],
];
const SALES_COLUMNS = [
  ["UPC", "Scan Code"],
  ["Date"],
  ["Qty Sold", "Total Qty", "Sold Qty", "# Sold"],
];

// Browser parse: read an uploaded File with read-excel-file, validate the two required
// sheets and their columns, then aggregate. Stateless — bytes never leave the browser.
// read-excel-file v9's default export returns every sheet as { sheet, data }.
export async function parseFile(file) {
  const { default: readXlsxFile } = await import("read-excel-file/browser");
  const sheets = await readXlsxFile(file);
  const find = (name) => sheets.find((s) => s.sheet === name)?.data;
  const inventoryData = find("InventoryData");
  const salesData = find("SalesHistory");
  if (!inventoryData || !salesData)
    throw new Error('Workbook must have "InventoryData" and "SalesHistory" sheets.');
  return aggregate(
    sheetObjects(inventoryData, "InventoryData", INVENTORY_COLUMNS),
    sheetObjects(salesData, "SalesHistory", SALES_COLUMNS)
  );
}

// Build the per-orderable linked-scan lookup from the fixtures' linked mappings.
function buildLinks(links) {
  const linksByOrderable = new Map();
  for (const link of links) {
    const key = vendorScanKey(link.vendor_name, link.orderable_scan_code);
    const list = linksByOrderable.get(key) ?? [];
    const linkedScan = normalizeScan(link.linked_scan_code);
    if (!list.some((existing) => existing.linkedScan === linkedScan)) {
      list.push({ linkedScan, ratio: Number(link.conversion_ratio) });
      linksByOrderable.set(key, list);
    }
  }
  return linksByOrderable;
}

// Join aggregated inv/sales with the bundled catalog + per-vendor settings -> order lines.
// Pure replacement for the operational app's DB-backed computeLines.
export function computeLines({ catalog, vendors, links }, inv, sales) {
  const vendorCfg = new Map(vendors.map((v) => [v.vendor_name, v]));
  const linksByOrderable = buildLinks(links);
  const lines = [];
  for (const it of catalog) {
    if (!it.active || !it.allow_order) continue;
    const cfg = vendorCfg.get(it.vendor_name) ?? DEFAULTS;
    const { inventory, salesUsed } = rollupMetrics({
      vendorName: it.vendor_name,
      scan: it.full_scan_code,
      inv,
      sales,
      linksByOrderable,
    });
    const sc = suggestedCases({
      salesUsed, inventory, caseQty: it.case_qty,
      targetDays: Number(cfg.target_days), inventoryCredit: Number(cfg.inventory_credit),
      salesWindowDays: Number(cfg.sales_window_days ?? SALES_WINDOW_DAYS),
    });
    if (sc > 0)
      lines.push({
        vendor_name: it.vendor_name,
        full_scan_code: it.full_scan_code,
        sku: it.sku,
        item_description: it.item_description,
        case_qty: it.case_qty,
        inventory,
        sales_window: salesUsed,
        suggested_cases: sc,
        adjustment: 0,
      });
  }
  return lines;
}

// Explainable, rule-based analytics over the parsed data + generated lines.
// No AI/ML — every number is plain arithmetic defined in the README.
export function analyze({ catalog, lines, inv, sales, dailyTotals, windowDays = SALES_WINDOW_DAYS }) {
  const byScan = new Map(catalog.map((c) => [normalizeScan(c.full_scan_code), c]));

  // Per-scan rows that have any activity (sales or inventory), joined to the catalog.
  const scanKeys = new Set([...inv.keys(), ...sales.keys()]);
  const items = [];
  for (const k of scanKeys) {
    const meta = byScan.get(k);
    const inventory = inv.get(k)?.qty ?? 0;
    const sold = sales.get(k) ?? 0;
    items.push({
      scan: k,
      description: meta?.item_description ?? "(uncatalogued scan)",
      vendor: meta?.vendor_name ?? "—",
      inventory,
      sold,
      daysOfSupply: sold > 0 ? inventory / (sold / windowDays) : null,
    });
  }

  const totalUnitsSold = [...sales.values()].reduce((s, v) => s + v, 0);
  const currentInventoryUnits = [...inv.values()].reduce((s, v) => s + v.qty, 0);
  const totalSuggestedCases = lines.reduce((s, l) => s + l.suggested_cases, 0);
  const vendorsRequiringOrder = new Set(lines.map((l) => l.vendor_name)).size;

  const stockoutRisk = items.filter((i) => i.inventory <= 0 && i.sold > 0)
    .sort((a, b) => b.sold - a.sold);
  const noSalesInventory = items.filter((i) => i.inventory > 0 && i.sold === 0)
    .sort((a, b) => b.inventory - a.inventory);
  const highStock = items.filter((i) => i.daysOfSupply !== null && i.daysOfSupply > 30)
    .sort((a, b) => b.daysOfSupply - a.daysOfSupply);

  const topSellers = items.filter((i) => i.sold > 0)
    .sort((a, b) => b.sold - a.sold)
    .slice(0, 10);

  // Per-vendor summary: sales + inventory from the parsed data, order lines + cases from the PO.
  const vendorMap = new Map();
  const vendorOf = (name) => {
    if (!vendorMap.has(name))
      vendorMap.set(name, { vendor_name: name, sales: 0, inventory: 0, orderLines: 0, suggestedCases: 0 });
    return vendorMap.get(name);
  };
  for (const i of items) if (i.vendor !== "—") {
    const v = vendorOf(i.vendor);
    v.sales += i.sold;
    v.inventory += i.inventory;
  }
  for (const l of lines) {
    const v = vendorOf(l.vendor_name);
    v.orderLines += 1;
    v.suggestedCases += l.suggested_cases;
  }
  const vendorSummary = [...vendorMap.values()].sort((a, b) => b.suggestedCases - a.suggestedCases);

  // 14-day daily trend, filled so every day in the window appears (even zero-sales days).
  const dailyTrend = [];
  if (dailyTotals.size > 0) {
    const days = [...dailyTotals.keys()].sort();
    const latest = new Date(days[days.length - 1] + "T00:00:00Z");
    for (let i = windowDays - 1; i >= 0; i--) {
      const d = new Date(latest.getTime() - i * 86400000).toISOString().slice(0, 10);
      dailyTrend.push({ date: d, units: dailyTotals.get(d) ?? 0 });
    }
  }

  return {
    totalUnitsSold,
    currentInventoryUnits,
    totalSuggestedCases,
    vendorsRequiringOrder,
    stockoutRiskCount: stockoutRisk.length,
    dailyTrend,
    topSellers,
    vendorSummary,
    stockoutRisk,
    noSalesInventory,
    highStock,
  };
}
