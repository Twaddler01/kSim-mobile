import Badge from "../ui/Badge.js";

/**
 * Decorates an existing element with a NEW indicator.
 * Unread state belongs to UnreadManager; this class owns presentation only.
 */
export default class NewBadge {
    constructor({
        unreadManager,
        tabId,
        itemId,
        getElement,
        placement = "inline",
        showNew = true,
        variant = "new",
        ariaLabel = "New content"
    } = {}) {
        if (!unreadManager) {
            throw new TypeError("NewBadge requires unreadManager.");
        }
        if (!tabId || !itemId) {
            throw new TypeError("NewBadge requires tabId and itemId.");
        }
        if (typeof getElement !== "function") {
            throw new TypeError("NewBadge requires getElement().");
        }
        if (!["inline", "overlay"].includes(placement)) {
            throw new TypeError(
                'NewBadge placement must be "inline" or "overlay".'
            );
        }

        Object.assign(this, {
            unreadManager,
            tabId,
            itemId,
            getElement,
            placement,
            showNew,
            variant,
            ariaLabel
        });

        this.target = null;
        this.badge = null;
        this.ownsHostClass = false;
    }

    isUnread() {
        return this.unreadManager.isUnread(this.tabId, this.itemId);
    }

    refresh() {
        const target = this.getElement();

        if (target !== this.target) {
            this.removeBadge();
            this.target = target ?? null;
        }

        if (!this.target || !this.showNew || !this.isUnread()) {
            this.removeBadge();
            return this;
        }

        if (this.badge?.parentElement === this.target) {
            return this;
        }

        this.removeBadge();

        this.badge = Badge({
            text: "NEW",
            variant: this.variant,
            className: "new-badge-indicator",
            ariaLabel: this.ariaLabel
        });

        if (this.placement === "overlay") {
            this.badge.classList.add("new-badge-indicator--overlay");

            if (!this.target.classList.contains("new-badge-overlay-host")) {
                this.target.classList.add("new-badge-overlay-host");
                this.ownsHostClass = true;
            }
        }

        this.target.append(this.badge);
        return this;
    }

    acknowledge() {
        const changed = this.unreadManager.markRead(
            this.tabId,
            this.itemId
        );

        this.refresh();
        return changed;
    }

    removeBadge() {
        this.badge?.remove();
        this.badge = null;

        if (this.ownsHostClass && this.target) {
            this.target.classList.remove("new-badge-overlay-host");
        }

        this.ownsHostClass = false;
    }

    destroy() {
        this.removeBadge();
        this.target = null;
    }
}
