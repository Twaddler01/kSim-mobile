import { el } from "../Element.js";

/** Create one accessible tab button. */
export function createTab(tab, { active = false, onSelect, panelId } = {}) {
  return el("button", {
    type: "button",
    className: "tab-button",
    role: "tab",
    id: `ksim-tab-${tab.id}`,
    text: tab.label,
    "aria-selected": active ? "true" : "false",
    "aria-controls": panelId,
    tabIndex: active ? 0 : -1,
    onClick: () => onSelect?.(tab.id),
  });
}
