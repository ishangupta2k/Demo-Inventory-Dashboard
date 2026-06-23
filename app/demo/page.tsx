// app/demo/page.tsx -> "/demo". Thin Server Component wrapper; all interactivity
// lives in the client component (upload -> generate -> review -> analysis).
import DemoClient from "./demo-client";

export default function DemoPage() {
  return <DemoClient />;
}
