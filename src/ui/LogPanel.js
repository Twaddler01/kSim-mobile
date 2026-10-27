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
        const entries = this.getEntries();

        const importantCount = entries.filter(
            entry => entry.category === "important"
        ).length;

        const activityCount = entries.filter(
            entry => entry.category === "activity"
        ).length;

        const visibleEntries = entries.filter(
            entry => entry.category === this.activeCategory
        );

        const categoryTabs = el(
            "div",
            {
                className: "log-category-tabs",
                role: "group",
                "aria-label": "Log categories"
            },
            [
                this.renderCategoryButton(
                    "important",
                    "IMPORTANT",
                    importantCount
                ),
                this.renderCategoryButton("activity", "ACTIVITY", activityCount)
            ]
        );

        const entryList = visibleEntries.length
            ? el(
                  "div",
                  { className: "log-list" },
                  visibleEntries.map(entry =>
                      el(
                          "div",
                          {
                              className:
                                  `log-entry log-entry--${entry.category}` +
                                  (entry.unread ? " is-unread" : ""),
                              onClick: () => {
                                  if (entry.unread) {
                                      this.unreadManager?.markRead(
                                          "log",
                                          entry.id
                                      );
                                  }
                              }
                          },
                          [
                              el("span", {
                                  className: "log-marker",
                                  text:
                                      entry.category === "important" ? "!" : "›"
                              }),
                              el("div", { className: "log-entry-content" }, [
                                  this.renderMessage(entry),
                                  el("span", {
                                      className: "log-timestamp",
                                      text: this.formatTimestamp(
                                          entry.timestamp
                                      )
                                  })
                              ])
                          ]
                      )
                  )
              )
            : el("div", {
                  className: "log-empty",
                  text:
                      this.activeCategory === "important"
                          ? "No important events recorded yet."
                          : "No routine activity recorded yet."
              });

        return el("div", { className: "log-panel" }, [categoryTabs, entryList]);
    }

    renderCategoryButton(category, label, count) {
        const selected = this.activeCategory === category;

        return el(
            "button",
            {
                type: "button",
                className:
                    `log-category-button` +
                    (selected ? " is-active" : "") +
                    (category === "important"
                        ? " log-category-button--important"
                        : " log-category-button--activity"),
                "aria-pressed": String(selected),
                onClick: () => {
                    if (this.activeCategory === category) return;

                    this.activeCategory = category;
                    this.onChange();
                }
            },
            [
                el("span", { text: label }),
                el("span", {
                    className: "log-category-count",
                    text: String(count)
                })
            ]
        );
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

                if (entry.unread) {
                    this.unreadManager?.markRead("log", entry.id);
                }

                this.onNavigate(link);
            }
        });

        const index = message.indexOf(link.label);

        // If the label is part of the message, link just that phrase.
        if (index !== -1) {
            return el("span", { className: "log-message" }, [
                el("span", { text: message.slice(0, index) }),
                linkButton,
                el("span", {
                    text: message.slice(index + link.label.length)
                })
            ]);
        }

        // Otherwise, append a useful link after the message.
        return el("span", { className: "log-message" }, [
            el("span", { text: `${message} ` }),
            linkButton
        ]);
    }
}
