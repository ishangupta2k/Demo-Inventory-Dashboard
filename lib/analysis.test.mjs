import assert from "node:assert/strict";
import test from "node:test";
import { analyze } from "./engine.mjs";

const catalog = [
  { full_scan_code: "1", vendor_name: "X", item_description: "Stockout item" },
  { full_scan_code: "2", vendor_name: "X", item_description: "Overstocked item" },
  { full_scan_code: "3", vendor_name: "Y", item_description: "Steady seller" },
  { full_scan_code: "4", vendor_name: "Y", item_description: "No-sales item" },
];
const inv = new Map([["1", { qty: 0 }], ["2", { qty: 100 }], ["3", { qty: 20 }], ["4", { qty: 30 }]]);
const sales = new Map([["1", 14], ["2", 7], ["3", 14]]); // scan 4 has no sales
const dailyTotals = new Map([["2026-06-20", 10], ["2026-06-19", 5]]);
const lines = [
  { vendor_name: "X", suggested_cases: 3 },
  { vendor_name: "X", suggested_cases: 2 },
  { vendor_name: "Y", suggested_cases: 4 },
];

const a = analyze({ catalog, lines, inv, sales, dailyTotals, windowDays: 14 });

test("headline totals are plain sums", () => {
  assert.equal(a.totalUnitsSold, 35);
  assert.equal(a.currentInventoryUnits, 150);
  assert.equal(a.totalSuggestedCases, 9);
  assert.equal(a.vendorsRequiringOrder, 2);
});

test("stockout risk = inventory <= 0 and sales > 0", () => {
  assert.equal(a.stockoutRiskCount, 1);
  assert.equal(a.stockoutRisk[0].scan, "1");
});

test("no-sales inventory = inventory > 0 and sales = 0", () => {
  assert.equal(a.noSalesInventory.length, 1);
  assert.equal(a.noSalesInventory[0].scan, "4");
});

test("days of supply = inventory / (sales / windowDays); high stock = > 30 days", () => {
  assert.equal(a.highStock.length, 1);
  assert.equal(a.highStock[0].scan, "2");
  assert.equal(a.highStock[0].daysOfSupply, 200); // 100 / (7/14)
});

test("top sellers are ordered by units sold, highest first", () => {
  assert.equal(a.topSellers.length, 3); // only the three with sales > 0
  assert.equal(a.topSellers[0].sold, 14);
  assert.equal(a.topSellers[a.topSellers.length - 1].scan, "2"); // lowest (7) last
});

test("vendor summary aggregates sales, inventory, and the PO", () => {
  const x = a.vendorSummary.find((v) => v.vendor_name === "X");
  assert.deepEqual(
    { sales: x.sales, inventory: x.inventory, orderLines: x.orderLines, suggestedCases: x.suggestedCases },
    { sales: 21, inventory: 100, orderLines: 2, suggestedCases: 5 }
  );
  assert.equal(a.vendorSummary[0].vendor_name, "X"); // sorted by suggested cases desc
});

test("daily trend fills the full window, including zero days", () => {
  assert.equal(a.dailyTrend.length, 14);
  assert.equal(a.dailyTrend[13].date, "2026-06-20");
  assert.equal(a.dailyTrend[13].units, 10);
  assert.equal(a.dailyTrend[0].units, 0); // 13 days before the latest -> no sales
});
