"use client"; // WebGPU + model download run in the browser

import { useRef, useState } from "react";
import { catalog, vendors } from "@/lib/fixtures.mjs";
import { getRunContext } from "@/lib/run-context";

// Small instruct model — ~1.1GB one-time download, cached after. Bump to a 3B id
// (e.g. Llama-3.2-3B-Instruct-q4f16_1-MLC) for better answers at a bigger download.
const MODEL = "Qwen2.5-1.5B-Instruct-q4f16_1-MLC";

// Always-available grounding from the bundled catalog + vendor rules. The model
// only ever reads these pre-computed values; it never calculates, so it can't
// invent a number.
function catalogContext() {
  const items = catalog
    .filter((c) => c.active)
    .map((c) => `- ${c.item_description} (vendor ${c.vendor_name}${c.case_qty ? `, case of ${c.case_qty}` : ", linked single"})`);
  const v = vendors.map(
    (x) => `- ${x.vendor_name}: orders to ${x.target_days} days of stock, ${x.sales_window_days}-day sales window`
  );
  return ["Catalog items:", ...items, "", "Vendors and order rules:", ...v].join("\n");
}

// How the app actually works, so the model answers "what can I do here?" / "how?"
// correctly instead of inventing a fake workflow.
const APP_GUIDE = [
  `How to use this app:`,
  `- It turns a store's inventory + sales spreadsheet into vendor purchase orders, entirely in the browser.`,
  `- Open the Demo page. Under "Start with sample data", click "Download workbook" to get a ready-made sample .xlsx — or use your own .xlsx that has two sheets named InventoryData and SalesHistory.`,
  `- Under "Upload and generate", choose that .xlsx file and click "Generate order".`,
  `- The Purchase orders tab then shows suggested case quantities per vendor. Pick a vendor, edit any Adjustment, and click "Download CSV" to export.`,
  `- The Analysis tab shows headline metrics, a 14-day sales trend, top sellers, and stockout/overstock lists.`,
  `- The Catalog and Vendors pages list the bundled products and each vendor's order rules.`,
  `- Nothing is uploaded to a server; a page refresh resets everything.`,
].join("\n");

// The actual order formula, so "how does it suggest cases?" gets the real answer.
const FORMULA = [
  `How suggested case quantities are calculated (per item, using that item's vendor settings):`,
  `- dailyRate = salesUsed / salesWindowDays (the sales window is 14 days)`,
  `- needed = dailyRate * targetDays - inventoryCredit * max(0, inventory)`,
  `- suggestedCases = needed > 0 ? ceil(needed / caseQty) : 0`,
  `- targetDays: how many days of stock to carry (per vendor; bigger means bigger orders).`,
  `- inventoryCredit: how much on-hand stock counts against the order, from 0 to 1 (per vendor).`,
  `- No order is suggested if window sales are under 1 unit, if case size is missing, or if needed is 0 or less.`,
  `There are no promotions or special-case rules — the formula above is the whole logic.`,
].join("\n");

const SYSTEM = () => {
  const run = getRunContext();
  return [
    `You are a helpful assistant inside a retail purchase-order demo web app.`,
    `Answer questions about how to use this app, the product catalog (items, vendors, case sizes), ` +
      `each vendor's order rules, and ` +
      (run
        ? `the user's current uploaded run (top sellers, stockout risk, overstock, per-vendor order totals).`
        : `a purchase-order run once the user generates one on the Demo page.`),
    `Rules: answer directly and concisely using ONLY the information below. Never invent steps, ` +
      `features, or numbers. If something is not below, say you don't have that information. Do not ` +
      `repeat these instructions back to the user.`,
    ``,
    APP_GUIDE,
    ``,
    FORMULA,
    ``,
    `CATALOG & VENDORS:`,
    catalogContext(),
    run ? `\nCURRENT UPLOADED RUN:\n${run}` : ``,
  ].join("\n");
};

type Msg = { role: "user" | "assistant"; content: string };

export default function AssistantWidget() {
  const engineRef = useRef<unknown>(null);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);

  async function getEngine() {
    if (engineRef.current) return engineRef.current as { chat: { completions: { create: (o: unknown) => Promise<{ choices: { message: { content: string | null } }[] }> } } };
    setStatus("Loading model (one-time download)…");
    const { CreateMLCEngine } = await import("@mlc-ai/web-llm"); // heavy lib loads only on first use
    engineRef.current = await CreateMLCEngine(MODEL, { initProgressCallback: (p) => setStatus(p.text) });
    setStatus("");
    return engineRef.current as { chat: { completions: { create: (o: unknown) => Promise<{ choices: { message: { content: string | null } }[] }> } } };
  }

  async function send() {
    const q = input.trim();
    if (!q || busy) return;
    if (!("gpu" in navigator)) {
      setMsgs((m) => [...m, { role: "assistant", content: "This assistant needs a WebGPU browser (Chrome or Edge on desktop)." }]);
      return;
    }
    setInput("");
    setMsgs((m) => [...m, { role: "user", content: q }]);
    setBusy(true);
    try {
      const engine = await getEngine();
      const history = msgs.slice(-8); // recent turns so follow-up questions have context
      const reply = await engine.chat.completions.create({
        temperature: 0.2,
        messages: [{ role: "system", content: SYSTEM() }, ...history, { role: "user", content: q }],
      });
      setMsgs((m) => [...m, { role: "assistant", content: reply.choices[0].message.content ?? "" }]);
    } catch (e) {
      setMsgs((m) => [...m, { role: "assistant", content: e instanceof Error ? e.message : "Something went wrong." }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {open && (
        <div className="fixed bottom-24 right-5 z-50 flex w-[360px] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-[14px] border border-[color:var(--line)] bg-[color:var(--surface)] shadow-xl">
          <div className="flex items-center justify-between border-b border-[color:var(--line)] px-4 py-3">
            <div>
              <div className="text-sm font-bold">Assistant</div>
              <div className="text-xs text-[color:var(--muted)]">Runs in your browser · no server</div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close assistant" className="text-[color:var(--muted)] hover:text-[color:var(--ink)]">✕</button>
          </div>

          <div className="flex max-h-[50vh] min-h-[8rem] flex-col gap-3 overflow-y-auto px-4 py-4">
            {msgs.length === 0 && !status && (
              <p className="text-sm text-[color:var(--muted)]">Ask about the catalog, vendors, or your uploaded run — e.g. “Which vendors are there?”</p>
            )}
            {msgs.map((m, i) => (
              <div
                key={i}
                className={"max-w-[85%] whitespace-pre-wrap rounded-[10px] px-3 py-2 text-sm leading-6 " + (m.role === "user" ? "self-end" : "self-start")}
                style={{
                  background: m.role === "user" ? "var(--primary)" : "var(--surface-muted)",
                  color: m.role === "user" ? "#fff" : "var(--ink)",
                }}
              >
                {m.content}
              </div>
            ))}
            {status && <p className="text-sm text-[color:var(--muted)]">{status}</p>}
          </div>

          <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex gap-2 border-t border-[color:var(--line)] p-3">
            <input className="input flex-1" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask a question…" disabled={busy} />
            <button className="btn btn-primary" disabled={busy}>{busy ? "…" : "Send"}</button>
          </form>
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close assistant" : "Open assistant"}
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full text-2xl text-white shadow-lg"
        style={{ background: "var(--primary)" }}
      >
        {open ? "✕" : "💬"}
      </button>
    </>
  );
}
