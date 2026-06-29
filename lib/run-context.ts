// ponytail: a module-level store instead of React Context. The global assistant
// widget only needs the latest demo run at send time — no re-render required — so a
// plain getter/setter is enough. Upgrade to Context only if a component must react
// to changes here. Cleared automatically on refresh (the demo is stateless anyway).
let runContext = "";
export const setRunContext = (s: string) => { runContext = s; };
export const getRunContext = () => runContext;
