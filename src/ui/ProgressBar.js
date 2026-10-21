import { el } from "./Element.js";
export function ProgressBar({ label, value = 0, max = 100, format } = {}) {
  const wrap = el("div", { className: "progress-block" });
  const labelRow = el("div", { className: "progress-label" }, [
    el("span", { text: label ?? "Progress" }),
    el("span", { className: "progress-value", text: format ? format(value, max) : `${Math.floor(value)}/${max}` })
  ]);
  const track = el("div", { className: "progress-track", role: "progressbar", "aria-valuemin": 0, "aria-valuemax": max, "aria-valuenow": value });
  const fill = el("div", { className: "progress-fill" }); track.append(fill); wrap.append(labelRow, track);
  wrap.setValue = (next, nextMax = max) => {
    max = Math.max(1, Number(nextMax) || 1); value = Math.max(0, Number(next) || 0);
    fill.style.width = `${Math.min(100, value / max * 100)}%`;
    track.setAttribute("aria-valuemax", String(max)); track.setAttribute("aria-valuenow", String(Math.min(value, max)));
    labelRow.lastChild.textContent = format ? format(value, max) : `${Math.floor(value)}/${max}`;
  };
  wrap.setValue(value, max); return wrap;
}
