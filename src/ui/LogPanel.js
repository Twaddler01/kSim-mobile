import { el } from "./Element.js";

export default class LogPanel {
    constructor({
        getGame,
        unreadManager,
        onChange = () => {},
        onNavigate = () => {}
    }) {
        this.getGame = getGame;
        this.unreadManager = unreadManager;
        this.onChange = onChange;
        this.onNavigate = onNavigate;

        this.activeCategory = "important";
        this.element = null;

        this.entries = new Map();
        this.categoryButtons = new Map();
        this.categoryCounts = new Map();
        this.list = null;
        this.emptyMessage = null;
    }

    getEntries() {
        const game = this.getGame();

        return (game.log ?? [])
            .filter(
                entry =>
                    entry.tab === "log" &&
                    typeof entry.message === "string" &&
                    entry.message.trim().length > 0
            )
            .map(entry => ({
                id: entry.id,
                message: entry.message,
                category:
                    entry.category === "important" ? "important" : "activity",
                timestamp: entry.timestamp ?? null,
                unread:
                    entry.category === "important" &&
                    this.unreadManager?.isUnread("log", entry.id),
                link: entry.link ?? null
            }));
    }

    render() {
        if (this.element) {
            this.update();
            return this.element;
        }

        this.element = el("div", {
            className: "log-panel"
        });

        const categoryTabs = el("div", {
            className: "log-category-tabs",
            role: "group",
            "aria-label": "Log categories"
        });

        for (const [category, label] of [
            ["important", "IMPORTANT"],
            ["activity", "ACTIVITY"]
        ]) {
            const count = el("span", {
                className: "log-category-count",
                text: "0"
            });

            const button = el(
                "button",
                {
                    type: "button",
                    className: "log-category-button",
                    "aria-pressed": "false",
                    onClick: () => {
                        if (this.activeCategory === category) return;

                        this.activeCategory = category;
                        this.update();
                        this.onChange();
                    }
                },
                [el("span", { text: label }), count]
            );

            this.categoryButtons.set(category, button);
            this.categoryCounts.set(category, count);
            categoryTabs.append(button);
        }

        this.list = el("div", {
            className: "log-list"
        });

        this.emptyMessage = el("div", {
            className: "log-empty"
        });

        this.element.append(categoryTabs, this.list, this.emptyMessage);

        this.update();
        return this.element;
    }

    createEntry(entry) {
        const marker = el("span", {
            className: "log-marker"
        });

        const messageContainer = el("div", {
            className: "log-entry-content"
        });

        const timestamp = el("span", {
            className: "log-timestamp"
        });

        messageContainer.append(timestamp);

        const element = el(
            "div",
            {
                className: "log-entry",
                onClick: () => {
                    if (this.unreadManager?.isUnread("log", entry.id)) {
                        this.unreadManager.markRead("log", entry.id);
                        this.update();
                    }
                }
            },
            [marker, messageContainer]
        );

        const record = {
            element,
            marker,
            messageContainer,
            timestamp,
            message: null,
            link: null
        };

        this.updateEntry(record, entry);
        this.entries.set(entry.id, record);

        return record;
    }

    updateEntry(record, entry) {
        const { element, marker, messageContainer, timestamp } = record;

        element.className =
            `log-entry log-entry--${entry.category}` +
            (entry.unread ? " is-unread" : "");

        element.style.display =
            entry.category === this.activeCategory ? "" : "none";

        marker.textContent = entry.category === "important" ? "!" : "›";

        timestamp.textContent = this.formatTimestamp(entry.timestamp);

        const linkKey = entry.link ? JSON.stringify(entry.link) : null;

        if (record.message !== entry.message || record.link !== linkKey) {
            const message = this.renderMessage(entry);

            // Keep the timestamp element stable.
            messageContainer.replaceChildren(message, timestamp);

            record.message = entry.message;
            record.link = linkKey;
        }
    }

    update() {
        if (!this.element) return this;

        const entries = this.getEntries();
        const activeIds = new Set(entries.map(entry => entry.id));

        let importantCount = 0;
        let activityCount = 0;
        let visibleCount = 0;

        for (const entry of entries) {
            if (entry.category === "important") {
                importantCount++;
            } else {
                activityCount++;
            }

            if (entry.category === this.activeCategory) {
                visibleCount++;
            }

            let record = this.entries.get(entry.id);

            if (!record) {
                record = this.createEntry(entry);
                this.list.append(record.element);
            } else {
                this.updateEntry(record, entry);
            }
        }

        // Remove entries that no longer exist in the game log.
        for (const [id, record] of this.entries) {
            if (!activeIds.has(id)) {
                record.element.remove();
                this.entries.delete(id);
            }
        }

        this.categoryCounts.get("important").textContent =
            String(importantCount);

        this.categoryCounts.get("activity").textContent = String(activityCount);

        for (const [category, button] of this.categoryButtons) {
            const selected = this.activeCategory === category;

            button.className =
                "log-category-button" +
                (selected ? " is-active" : "") +
                (category === "important"
                    ? " log-category-button--important"
                    : " log-category-button--activity");

            button.setAttribute("aria-pressed", String(selected));
        }

        this.emptyMessage.textContent =
            this.activeCategory === "important"
                ? "No important events recorded yet."
                : "No routine activity recorded yet.";

        this.emptyMessage.style.display = visibleCount === 0 ? "" : "none";

        return this;
    }

    formatTimestamp(timestamp) {
        if (!timestamp) return "";

        return new Date(timestamp).toLocaleString([], {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit"
        });
    }

    renderMessage(entry) {
        const { message, link } = entry;

        if (!link?.label || !link?.tab || link.itemId == null) {
            return el("span", {
                className: "log-message",
                text: message
            });
        }

        const linkButton = el("button", {
            type: "button",
            className: "log-inline-link",
            text: link.label,
            onClick: event => {
                event.stopPropagation();

                if (this.unreadManager?.isUnread("log", entry.id)) {
                    this.unreadManager.markRead("log", entry.id);
                    this.update();
                }

                this.onNavigate(link);
            }
        });

        const index = message.indexOf(link.label);

        if (index !== -1) {
            return el("span", { className: "log-message" }, [
                el("span", { text: message.slice(0, index) }),
                linkButton,
                el("span", {
                    text: message.slice(index + link.label.length)
                })
            ]);
        }

        return el("span", { className: "log-message" }, [
            el("span", { text: `${message} ` }),
            linkButton
        ]);
    }
}
