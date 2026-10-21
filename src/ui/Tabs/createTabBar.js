import { el } from "../Element.js";
import { createTab } from "./createTab.js";

/** Create a horizontally scrollable tab strip. */
export function createTabBar(tabs = [], options = {}) {
    const bar = el("div", {
        className: "tabs",
        role: "tablist",
        "aria-label": options.label ?? "Content sections"
    });
    updateTabBar(bar, tabs, options);
    return bar;
}

/** Update tab buttons in-place while preserving the strip and its scroll position. */
export function updateTabBar(bar, tabs = [], {
    activeId,
    onSelect,
    panelId,
    label = "Content sections"
} = {}) {
    const scrollLeft = bar.scrollLeft;
    bar.setAttribute("aria-label", label);
    bar.replaceChildren(...tabs.map(tab => createTab(tab, {
        active: tab.id === activeId,
        onSelect,
        panelId
    })));
    bar.scrollLeft = scrollLeft;
    return bar;
}
