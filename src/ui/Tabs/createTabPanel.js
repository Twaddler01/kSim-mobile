import { el } from "../Element.js";

/** Create the stable container that displays the selected tab's content. */
export function createTabPanel(tab = null, content = null, { panelId } = {}) {
    return el("div", {
        className: "tab-panel",
        id: panelId,
        role: "tabpanel",
        "aria-labelledby": tab ? `ksim-tab-${tab.id}` : null,
        tabIndex: 0
    }, content == null ? [] : [content]);
}
