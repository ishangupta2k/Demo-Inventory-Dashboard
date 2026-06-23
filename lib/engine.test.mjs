import assert from "node:assert/strict";
import test from "node:test";
import { excelSerialToDate, rollupMetrics, sheetObjects, suggestedCases, computeLines } from "./engine.mjs";

// Must match vendorScanKey in engine.mjs.
const key = (vendor, scan) => `${vendor}::${scan}`;

test("the order formula matches the operational generator", () => {
  const t21 = { targetDays: 21, inventoryCredit: 0.8 };
  assert.equal(suggestedCases({ salesUsed: 28, inventory: 0, caseQty: 4, ...t21 }), 11);
  assert.equal(suggestedCases({ salesUsed: 28, inventory: 10, caseQty: 4, ...t21 }), 9, "inventory credit reduces order");
  assert.equal(suggestedCases({ salesUsed: 0, inventory: 0, caseQty: 4, ...t21 }), 0, "no sales -> no order");
  assert.equal(suggestedCases({ salesUsed: 50, inventory: 0, caseQty: 0, ...t21 }), 0, "no case qty -> blocked");
});

test("suggested cases use the per-vendor sales window", () => {
  assert.equal(suggestedCases({
    salesUsed: 14, inventory: 0, caseQty: 2, salesWindowDays: 7, targetDays: 10, inventoryCredit: 0.8,
  }), 10);
});

test("linked sales always roll into the orderable item", () => {
  const result = rollupMetrics({
    vendorName: "Vendor",
    scan: "100",
    inv: new Map([["100", { qty: 5 }], ["200", { qty: 24 }]]),
    sales: new Map([["100", 4], ["200", 36]]),
    linksByOrderable: new Map([[key("Vendor", "100"), [{ linkedScan: "200", ratio: 12 }]]]),
  });
  assert.deepEqual(result, { inventory: 5, salesUsed: 7 });
});

test("linked inventory is the fallback when direct inventory is zero", () => {
  const result = rollupMetrics({
    vendorName: "Vendor",
    scan: "100",
    inv: new Map([["100", { qty: 0 }], ["200", { qty: 24 }]]),
    sales: new Map(),
    linksByOrderable: new Map([[key("Vendor", "100"), [{ linkedScan: "200", ratio: 12 }]]]),
  });
  assert.equal(result.inventory, 2);
});

test("Excel Date objects keep their UTC calendar date", () => {
  const parsed = excelSerialToDate(new Date("2026-06-21T00:00:00.000Z"));
  assert.equal(parsed.toISOString().slice(0, 10), "2026-06-21");
});

test("uploaded sheets reject missing required columns", () => {
  assert.throws(
    () => sheetObjects([["Date", "UPC"], [new Date(), "123"]], "InventoryData", [
      ["UPC", "Scan Code"],
      ["Current Qty", "In Stock", "Current Inventory"],
    ]),
    /Current Qty or In Stock or Current Inventory/
  );
});

test("computeLines joins the bundled catalog and rolls a linked single into its pack", () => {
  const fixtures = {
    catalog: [
      { full_scan_code: "100", vendor_name: "V", sku: "PACK", item_description: "Pack", case_qty: 12, active: true, allow_order: true },
      { full_scan_code: "200", vendor_name: "V", sku: "SINGLE", item_description: "Single", case_qty: 1, active: true, allow_order: false },
      { full_scan_code: "300", vendor_name: "V", sku: "OFF", item_description: "Inactive", case_qty: 6, active: false, allow_order: true },
    ],
    vendors: [{ vendor_name: "V", sales_window_days: 14, target_days: 14, inventory_credit: 0.8 }],
    links: [{ vendor_name: "V", orderable_scan_code: "100", linked_scan_code: "200", conversion_ratio: 12 }],
  };
  const inv = new Map([["100", { qty: 0 }]]);
  const sales = new Map([["200", 168]]); // 168 singles / 12 = 14 packs of demand over 14 days
  const lines = computeLines(fixtures, inv, sales);

  assert.equal(lines.length, 1, "only the orderable pack appears (single + inactive excluded)");
  assert.equal(lines[0].full_scan_code, "100");
  assert.equal(lines[0].sales_window, 14, "linked single sales rolled in and divided by ratio");
  // dailyRate 1/day * 14 target days, no inventory credit -> 14 units / 12 per case = 2 cases.
  assert.equal(lines[0].suggested_cases, 2);
});
