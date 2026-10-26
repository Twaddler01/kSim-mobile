
import { el } from "./Element.js";

export default class CollapsiblePanel {
    constructor({
        eyebrow = "",
        title,
        status = "ONLINE",
        content,
        expanded = true,
        unread = false,
        locked = false,
        onToggle = null
    }) {
        this.expanded = Boolean(expanded);
        this.unread = Boolean(unread);
        this.locked = Boolean(locked);
        this.status = status;
        this.onToggle = onToggle;

        this.element = el("section", {
            className: "sim-card collapsible-panel",
            "data-status": status.toLowerCase()
        });

        this.header = el("button", {
            className: "collapsible-panel-header",
            type: "button",
            "aria-expanded": String(this.expanded),
            onClick: () => this.toggle()
        }, [
            el("div", { className: "collapsible-panel-heading" }, [
                el("div", {
                    className: "eyebrow",
                    text: eyebrow
                }),
                el("h2", { text: title })
            ]),

            el("div", {
                className: "collapsible-panel-status"
            }, [
                el("span", {
                    className: "live-indicator",
                    text: `● ${status}`
                }),
                el("span", {
                    className: "collapsible-panel-unread",
                    text: "NEW",
                    "aria-label": "New content"
                }),
                el("span", {
                    className: "collapsible-panel-chevron",
                    "aria-hidden": "true"
                })
            ])
        ]);

        this.body = el("div", {
            className: "collapsible-panel-body"
        }, [content]);

        this.element.append(this.header, this.body);

        this.update();
    }

    toggle() {
        if (this.locked) return;

        this.setExpanded(!this.expanded);

        // Opening a newly unlocked panel acknowledges its new content.
        if (this.expanded && this.unread) {
            this.setUnread(false);
        }

        this.onToggle?.(this.expanded);
    }

    setExpanded(expanded) {
        if (this.locked && expanded) return;

        this.expanded = Boolean(expanded);
        this.update();
    }

    setUnread(unread) {
        this.unread = Boolean(unread);
        this.update();
    }

    setLocked(locked) {
        this.locked = Boolean(locked);

        if (this.locked) {
            this.expanded = false;
            this.setUnread(false);
            this.status = "LOCKED";
        }

        this.update();
    }

    unlock({ unread = true, expanded = false } = {}) {
        this.locked = false;
        this.status = "AVAILABLE";
        this.unread = Boolean(unread);
        this.expanded = Boolean(expanded);
        this.update();
    }

    setStatus(status) {
        this.status = status;
        this.update();
    }

    update() {
        this.body.hidden = !this.expanded || this.locked;

        this.header.disabled = this.locked;
        this.header.setAttribute(
            "aria-expanded",
            String(this.expanded && !this.locked)
        );

        this.element.dataset.status = this.status.toLowerCase();

        this.element.classList.toggle(
            "is-collapsed",
            !this.expanded
        );
        this.element.classList.toggle(
            "is-locked",
            this.locked
        );
        this.element.classList.toggle(
            "is-unread",
            this.unread
        );

        const indicator = this.header.querySelector(".live-indicator");
        if (indicator) {
            indicator.textContent = this.locked
                ? "● LOCKED"
                : `● ${this.status}`;
        }

        const unreadIndicator = this.header.querySelector(
            ".collapsible-panel-unread"
        );

        if (unreadIndicator) {
            unreadIndicator.hidden = !this.unread || this.locked;
        }

        const chevron = this.header.querySelector(
            ".collapsible-panel-chevron"
        );

        if (chevron) {
            chevron.textContent = this.locked
                ? "🔒"
                : this.expanded
                    ? "▾"
                    : "▸";
        }
    }
}
