import { el } from "../Element.js";
import { Component } from "../Component.js";
import { createTabBar, updateTabBar } from "./createTabBar.js";
import { createTabPanel } from "./createTabPanel.js";
import Badge from "../Badge.js";

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
        unreadManager = null,
        onChange,
        label = "Content sections",
        className = ""
    } = {}) {
        super({ className });
        this.tabs = Array.isArray(tabs) ? tabs : [];
        this.activeId = this.tabs.some(tab => tab.id === activeId)
            ? activeId
            : (this.tabs[0]?.id ?? null);
        this.unreadManager = unreadManager;
        this.onChange = onChange;
        this.label = label;
        this.panelId = `ksim-tab-panel-${Tabs.nextId++}`;
        this.tabBar = null;
        this.panel = null;

        this.leftArrow = null;
        this.rightArrow = null;
        this.handleTabScroll = () => this.updateScrollIndicators();
        this.resizeObserver = null;
        this.scrollPositions = new Map();

        this.render();
    }

    get activeTab() {
        return (
            this.tabs.find(tab => tab.id === this.activeId) ??
            this.tabs[0] ??
            null
        );
    }

    createElement() {
        this.tabBar = createTabBar([], {
            activeId: this.activeId,
            panelId: this.panelId,
            label: this.label
        });

        this.leftArrow = el("button", {
            type: "button",
            className: "tab-scroll-arrow tab-scroll-arrow-left",
            text: "‹",
            "aria-label": "Scroll tabs left",
            onClick: () => this.scrollTabs(-1),
            hidden: true
        });

        this.rightArrow = el("button", {
            type: "button",
            className: "tab-scroll-arrow tab-scroll-arrow-right",
            text: "›",
            "aria-label": "Scroll tabs right",
            onClick: () => this.scrollTabs(1),
            hidden: true
        });

        const tabBarContainer = el("div", { className: "tabs-bar-container" }, [
            this.leftArrow,
            this.tabBar,
            this.rightArrow
        ]);

        this.panel = createTabPanel(null, null, {
            panelId: this.panelId
        });

        const root = el(
            "div",
            {
                className: ["tabs-component", this.className]
                    .filter(Boolean)
                    .join(" ")
            },
            [tabBarContainer, this.panel]
        );

        this.tabBar.addEventListener("scroll", this.handleTabScroll, {
            passive: true
        });

        if (typeof ResizeObserver !== "undefined") {
            this.resizeObserver = new ResizeObserver(() => {
                this.updateScrollIndicators();
                this.scheduleArrowGeometry();
            });

            this.resizeObserver.observe(root);
            this.resizeObserver.observe(this.tabBar);
        }

        this.scheduleArrowGeometry();

        return root;
    }

    update({ refreshContent = true } = {}) {
        if (!this.element || !this.tabBar || !this.panel) return this;

        const tab = this.activeTab;

        updateTabBar(this.tabBar, this.tabs, {
            activeId: this.activeId,
            panelId: this.panelId,
            label: this.label,
            onSelect: id => this.selectTab(id)
        });

        this.refreshUnreadIndicators();
        this.updateScrollIndicators();
        this.updateArrowGeometry();

        this.panel.setAttribute(
            "aria-labelledby",
            tab ? `ksim-tab-${tab.id}` : ""
        );

        if (refreshContent) {
            const content = tab?.render?.() ?? tab?.content ?? null;
            this.panel.replaceChildren(...(content == null ? [] : [content]));
        }

        return this;
    }

    rememberScrollPosition(tabId = this.activeId) {
        if (!this.panel || !tabId) return this;

        this.scrollPositions.set(tabId, this.panel.scrollTop);
        return this;
    }

    restoreScrollPosition(tabId = this.activeId) {
        if (!this.panel || !tabId) return this;

        this.panel.scrollTop = this.scrollPositions.get(tabId) ?? 0;
        return this;
    }

    setScrollPosition(position = 0) {
        if (!this.panel) return this;

        this.panel.scrollTop = Math.max(0, Number(position) || 0);
        this.rememberScrollPosition();
        return this;
    }

    setTabs(tabs, { activeId = this.activeId } = {}) {
        const previousId = this.activeId;

        this.rememberScrollPosition(previousId);

        this.tabs = Array.isArray(tabs) ? tabs : [];
        this.activeId = this.tabs.some(tab => tab.id === activeId)
            ? activeId
            : (this.tabs[0]?.id ?? null);

        this.render();
        this.restoreScrollPosition();

        return this;
    }

    addTab(tab, { index = this.tabs.length, activate = false, notify = activate } = {}) {
        if (!tab?.id) {
            throw new Error("A tab definition requires an id.");
        }

        if (this.tabs.some(item => item.id === tab.id)) {
            throw new Error(`Tab "${tab.id}" already exists.`);
        }

        const nextTabs = [...this.tabs];
        const insertAt = Math.max(0, Math.min(nextTabs.length, index));

        nextTabs.splice(insertAt, 0, tab);

        this.setTabs(nextTabs);

        if (activate) {
            this.setActiveTab(tab.id, { notify });
        }

        return this;
    }

    removeTab(id, { notify = true } = {}) {
        const index = this.tabs.findIndex(tab => tab.id === id);

        if (index === -1) return this;

        const wasActive = this.activeId === id;
        const nextTabs = this.tabs.filter(tab => tab.id !== id);

        // If removing the active tab, select the next available tab.
        const nextActiveId = wasActive
            ? (nextTabs[Math.min(index, nextTabs.length - 1)]?.id ?? null)
            : this.activeId;

        this.setTabs(nextTabs, { activeId: nextActiveId });

        if (wasActive && notify && this.activeId) {
            this.onChange?.(this.activeId, this.activeTab);
        }

        return this;
    }
    
    setActiveTab(id, { notify = false } = {}) {
        if (!this.tabs.some(tab => tab.id === id)) return this;

        this.rememberScrollPosition();

        const changed = this.activeId !== id;
        this.activeId = id;

        this.render();
        this.restoreScrollPosition();

        if (notify && changed) this.onChange?.(id, this.activeTab);

        return this;
    }

    selectTab(id) {
        if (!this.tabs.some(tab => tab.id === id) || this.activeId === id)
            return;

        this.rememberScrollPosition();

        this.activeId = id;

        this.render();
        this.restoreScrollPosition();

        this.onChange?.(id, this.activeTab);
    }

    scrollTabs(direction) {
        if (!this.tabBar) return;

        this.tabBar.scrollBy({
            left: direction * this.tabBar.clientWidth * 0.8,
            behavior: "smooth"
        });
    }

    updateScrollIndicators() {
        if (!this.tabBar || !this.leftArrow || !this.rightArrow) {
            return;
        }

        const maxScroll = this.tabBar.scrollWidth - this.tabBar.clientWidth;

        const canScrollLeft = this.tabBar.scrollLeft > 1;
        const canScrollRight = this.tabBar.scrollLeft < maxScroll - 1;

        this.leftArrow.hidden = !canScrollLeft;
        this.rightArrow.hidden = !canScrollRight;

        this.updateArrowUnreadState();
    }

    updateArrowGeometry() {
        if (!this.tabBar || !this.leftArrow || !this.rightArrow) {
            return;
        }

        const buttons = this.tabBar.querySelectorAll('[role="tab"]');
        if (!buttons.length) return;

        // Measure the actual button row, excluding tab-bar padding.
        const firstRect = buttons[0].getBoundingClientRect();
        const lastRect = buttons[buttons.length - 1].getBoundingClientRect();
        const containerRect = this.tabBar.parentElement.getBoundingClientRect();

        const top = firstRect.top - containerRect.top;
        const bottom = lastRect.bottom - containerRect.top;

        this.tabBar.parentElement.style.setProperty(
            "--tab-row-top",
            `${top}px`
        );

        this.tabBar.parentElement.style.setProperty(
            "--tab-row-height",
            `${bottom - top}px`
        );
    }

    updateArrowUnreadState() {
        if (!this.tabBar || !this.leftArrow || !this.rightArrow) {
            return;
        }

        const buttons = [...this.tabBar.querySelectorAll('[role="tab"]')];

        const barRect = this.tabBar.getBoundingClientRect();

        let unreadLeft = false;
        let unreadRight = false;

        for (const button of buttons) {
            const tabId = button.id.replace("ksim-tab-", "");
            const tab = this.tabs.find(item => item.id === tabId);

            if (!tab) continue;

            const count = tab.unread
                ? (this.unreadManager?.getUnreadCount(tab.id) ?? 0)
                : typeof tab.unreadCount === "function"
                  ? tab.unreadCount()
                  : (tab.unreadCount ?? 0);

            if (count <= 0) continue;

            // Use the unread badge bounds when available.
            const badge = button.querySelector(".tab-unread-badge");
            const rect = (badge ?? button).getBoundingClientRect();

            // Keep the arrow active until the indicator is fully visible.
            if (rect.left < barRect.left) {
                unreadLeft = true;
            }

            if (rect.right > barRect.right) {
                unreadRight = true;
            }
        }

        this.leftArrow.classList.toggle("has-unread", unreadLeft);
        this.rightArrow.classList.toggle("has-unread", unreadRight);
    }

    scheduleArrowGeometry() {
        requestAnimationFrame(() => {
            this.updateArrowGeometry();
            this.updateScrollIndicators();
        });
    }

    refreshUnreadIndicators() {
        this.updateUnreadIndicators();
        this.updateArrowUnreadState();
    }

    onDestroy() {
        this.tabBar?.removeEventListener("scroll", this.handleTabScroll);

        this.resizeObserver?.disconnect();
        this.resizeObserver = null;

        this.tabs = [];
        this.tabBar = null;
        this.panel = null;
        this.leftArrow = null;
        this.rightArrow = null;
        this.onChange = null;
    }

    updateUnreadIndicators() {
        const buttons = this.tabBar?.querySelectorAll('[role="tab"]');
        if (!buttons) return;

        for (const tab of this.tabs) {
            const button = [...buttons].find(
                item => item.id === `ksim-tab-${tab.id}`
            );

            if (!button) continue;

            button.querySelector(".tab-unread-badge")?.remove();

            const count = tab.unread
                ? (this.unreadManager?.getUnreadCount(tab.id) ?? 0)
                : typeof tab.unreadCount === "function"
                  ? tab.unreadCount()
                  : (tab.unreadCount ?? 0);

            if (count <= 0) continue;

            const badge = Badge({
                text: count,
                className: "tab-unread-badge",
                ariaLabel: `${count} unread`
            });

            button.append(badge);
        }
    }
}

Tabs.nextId = 1;
export default Tabs;
