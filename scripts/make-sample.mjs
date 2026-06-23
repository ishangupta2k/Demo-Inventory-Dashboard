// scripts/make-sample.mjs — builds public/sample-inventory.xlsx from the synthetic
// fixtures. Run once (committed output):  npm run sample
//
// SheetJS (xlsx) is used ONLY here, at build time, to WRITE a trusted file we created
// ourselves. It never parses uploaded/untrusted input — uploads use read-excel-file.
//
// The data is seeded (reproducible) and deliberately shaped so the generated POs and
// every analysis metric are non-empty: normal sellers, stockout-risk items
// (inventory 0 + sales), no-sales-inventory items, high-stock items, and the two
// linked single->pack examples from the fixtures.

import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import * as XLSX from "xlsx";
import { catalog } from "../lib/fixtures.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = join(__dirname, "..", "public");

// Deterministic PRNG (mulberry32) so the sample is identical on every run.
function rng(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = rng(20260620);

const WINDOW = 14;
const END = new Date(Date.UTC(2026, 5, 20)); // 2026-06-20
const dayStr = (offsetBack) =>
  new Date(END.getTime() - offsetBack * 86400000).toISOString().slice(0, 10);

// Explicit edge-case items (by scan code) so every analysis section is populated.
const NO_SALES = new Set(["078000039498", "635985000433"]); // inventory but zero sales
const STOCKOUT = new Set(["070847811169", "080660957210"]); // sales but zero inventory
const HIGH_STOCK = new Set(["018200250118", "012000001574"]); // huge inventory, slow sales

const inventoryRows = [];
const salesRows = [];

for (const item of catalog) {
  const scan = item.full_scan_code;
  let dailyRate;       // average units/day
  let inventory;

  if (NO_SALES.has(scan)) {
    dailyRate = 0;
    inventory = 18 + Math.floor(rand() * 30);
  } else if (STOCKOUT.has(scan)) {
    dailyRate = 2 + Math.floor(rand() * 4);
    inventory = 0;
  } else if (HIGH_STOCK.has(scan)) {
    dailyRate = 1; // ~14 sold over the window
    inventory = 220 + Math.floor(rand() * 80); // days of supply well over 30
  } else {
    dailyRate = Math.floor(rand() * 6); // 0..5
    // Roughly a week-ish of stock on hand, with noise.
    inventory = Math.floor(rand() * (dailyRate * 8 + 12));
  }

  // One inventory snapshot per scan, dated at the window end.
  inventoryRows.push({ "Scan Code": scan, Date: dayStr(0), "Current Qty": inventory });

  // 14 days of sales, with per-day variance. Skip zero-sales days (realistic gaps).
  for (let back = WINDOW - 1; back >= 0; back--) {
    if (dailyRate === 0) continue;
    const noise = (rand() - 0.4) * dailyRate;
    const qty = Math.max(0, Math.round(dailyRate + noise));
    if (qty > 0) salesRows.push({ "Scan Code": scan, Date: dayStr(back), "Sold Qty": qty });
  }
}

const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(inventoryRows), "InventoryData");
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(salesRows), "SalesHistory");

mkdirSync(PUBLIC_DIR, { recursive: true });
const out = join(PUBLIC_DIR, "sample-inventory.xlsx");
XLSX.writeFile(wb, out);
console.log(
  `Wrote ${out}\n  InventoryData: ${inventoryRows.length} rows\n  SalesHistory: ${salesRows.length} rows`
);
