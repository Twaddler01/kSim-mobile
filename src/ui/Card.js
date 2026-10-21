import { el } from "./Element.js";
export function Card(title, children, subtitle = "") {
  const panel = el("section", { className:"panel" });
  const header = el("div", { className:"panel-heading" }, [el("h2", { text:title }), el("small", { text:subtitle })]);
  panel.append(header, ...(Array.isArray(children) ? children : [children])); return panel;
}
