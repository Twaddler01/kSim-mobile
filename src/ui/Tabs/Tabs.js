import { el } from "../Element.js";
import { Component } from "../Component.js";
import { createTabBar, updateTabBar } from "./createTabBar.js";
import { createTabPanel } from "./createTabPanel.js";

/**
 * Reusable accessible tabs component.
 *
 * tabs: [{ id, label, render() }]
 * activeId: selected tab ID
 * onChange(id, tab): called after a user selects a different tab
 *
 * The root, tab strip, and panel are stable DOM nodes. Updates replace only
 * the tab buttons and active panel content, preserving horizontal scroll.
 */
export class Tabs extends Component {
    constructor({
        tabs = [],
        activeId,
        onChange,
        label = "Content sections",
        className = ""
    } = {}) {
        super({ className });
        this.tabs = Array.isArray(tabs) ? tabs : [];
        this.activeId = this.tabs.some(tab => tab.id === activeId)
            ? activeId
            : (this.tabs[0]?.id ?? null);
        this.onChange = onChange;
        this.label = label;
        this.panelId = `ksim-tab-panel-${Tabs.nextId++}`;
        this.tabBar = null;
        this.panel = null;
        this.render();
    }

    get activeTab() {
        return this.tabs.find(tab => tab.id === this.activeId) ?? this.tabs[0] ?? null;
    }

    createElement() {
        this.tabBar = createTabBar([], {
            activeId: this.activeId,
            panelId: this.panelId,
            label: this.label
        });
        this.panel = createTabPanel(null, null, { panelId: this.panelId });
        return el("div", {
            className: ["tabs-component", this.className].filter(Boolean).join(" ")
        }, [this.tabBar, this.panel]);
    }

    update() {
        if (!this.element || !this.tabBar || !this.panel) return this;
        const tab = this.activeTab;
        updateTabBar(this.tabBar, this.tabs, {
            activeId: this.activeId,
            panelId: this.panelId,
            label: this.label,
            onSelect: id => this.selectTab(id)
        });

        this.panel.setAttribute("aria-labelledby", tab ? `ksim-tab-${tab.id}` : "");
        const content = tab?.render?.() ?? tab?.content ?? null;
        this.panel.replaceChildren(...(content == null ? [] : [content]));
        return this;
    }

    setTabs(tabs, { activeId = this.activeId } = {}) {
        this.tabs = Array.isArray(tabs) ? tabs : [];
        this.activeId = this.tabs.some(tab => tab.id === activeId)
            ? activeId
            : (this.tabs[0]?.id ?? null);
        this.render();
        return this;
    }

    setActiveTab(id, { notify = false } = {}) {
        if (!this.tabs.some(tab => tab.id === id)) return this;
        const changed = this.activeId !== id;
        this.activeId = id;
        this.render();
        if (notify && changed) this.onChange?.(id, this.activeTab);
        return this;
    }

    selectTab(id) {
        if (!this.tabs.some(tab => tab.id === id) || this.activeId === id) return this;
        this.activeId = id;
        this.render();
        this.onChange?.(id, this.activeTab);
        return this;
    }

    onDestroy() {
        this.tabs = [];
        this.tabBar = null;
        this.panel = null;
        this.onChange = null;
    }
}

Tabs.nextId = 1;
export default Tabs;
