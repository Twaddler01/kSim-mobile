import { el } from "./Element.js";

export default class LogPanel {
    constructor({ getGame, unreadManager, onChange = () => {} }) {
        this.getGame = getGame;
        this.unreadManager = unreadManager;
        this.onChange = onChange;
        this.activeCategory = "important";
    }

    getEntries() {
        const game = this.getGame();

        return (game.log ?? []).map(entry => ({
            id: entry.id,
            message: entry.message ?? "",
            category: entry.category === "important" ? "important" : "activity",
            timestamp: entry.timestamp ?? null,
            unread:
                entry.category === "important" &&
                this.unreadManager?.isUnread("log", entry.id)
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
                                  el("span", {
                                      className: "log-message",
                                      text: entry.message
                                  }),
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
}
