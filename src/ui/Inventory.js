import { el } from "./Element.js";

export default class Inventory {
    constructor({ getGame, resources, formatNumber }) {
        this.getGame = getGame;
        this.resources = resources;
        this.formatNumber = formatNumber;

        this.expanded = false;
        this.values = new Map();
        this.detailValues = new Map();
        this.resourceIds = [];

        this.element = this.render();
    }

    get game() {
        return this.getGame();
    }

    getVisibleResources() {
        return this.resources.filter(
            resource =>
                !resource.unlockDiscovery ||
                this.game.discoveries.includes(resource.unlockDiscovery)
        );
    }

    render() {
        const resources = this.getVisibleResources();

        this.values.clear();
        this.detailValues.clear();
        this.resourceIds = resources.map(resource => resource.id);

        const toggle = el(
            "button",
            {
                type: "button",
                className: "inventory-toggle",
                "aria-expanded": String(this.expanded),
                onClick: () => {
                    this.expanded = !this.expanded;
                    this.replaceElement();
                }
            },
            [
                el("span", {
                    className: "inventory-toggle-title",
                    text: "INVENTORY"
                }),
                el("span", {
                    className: "inventory-chevron",
                    text: this.expanded ? "⌃" : "⌄"
                })
            ]
        );

        const compact = el(
            "div",
            {
                className: "inventory-compact",
                role: "list",
                "aria-label": "Current resources"
            },
            resources.map(resource => {
                const value = el("span", {
                    className: "resource-chip-value",
                    text: this.formatNumber(
                        this.game.resources[resource.id] ?? 0
                    )
                });

                this.values.set(resource.id, value);

                return el(
                    "div",
                    {
                        className: "resource-chip",
                        role: "listitem",
                        title: resource.name
                    },
                    [
                        el("span", {
                            className: "resource-chip-icon",
                            "aria-hidden": "true",
                            text: resource.icon
                        }),
                        value
                    ]
                );
            })
        );

        const expanded = this.expanded
            ? el(
                  "div",
                  {
                      className: "inventory-expanded",
                      role: "list",
                      "aria-label": "Resource details"
                  },
                  resources.map(resource => {
                      const value = el("strong", {
                          className: "inventory-item-value",
                          text: this.formatNumber(
                              this.game.resources[resource.id] ?? 0
                          )
                      });

                      this.detailValues.set(resource.id, value);

                      return el(
                          "article",
                          {
                              className: "inventory-item",
                              role: "listitem"
                          },
                          [
                              el("span", {
                                  className: "inventory-item-icon",
                                  "aria-hidden": "true",
                                  text: resource.icon
                              }),
                              el(
                                  "div",
                                  {
                                      className: "inventory-item-copy"
                                  },
                                  [
                                      el("strong", { text: resource.name }),
                                      el("small", {
                                          text: resource.description
                                      })
                                  ]
                              ),
                              value
                          ]
                      );
                  })
              )
            : null;

        return el(
            "section",
            {
                className: `inventory-panel${this.expanded ? " is-expanded" : ""}`
            },
            [toggle, compact, expanded]
        );
    }

    replaceElement() {
        const oldElement = this.element;
        this.element = this.render();

        if (oldElement?.isConnected) {
            oldElement.replaceWith(this.element);
        }

        this.update();
    }

    update() {
        const resources = this.getVisibleResources();
        const ids = resources.map(resource => resource.id);

        // A newly unlocked resource changes the inventory's structure.
        if (JSON.stringify(ids) !== JSON.stringify(this.resourceIds)) {
            this.replaceElement();
            return;
        }

        for (const resource of resources) {
            const value = this.formatNumber(
                this.game.resources[resource.id] ?? 0
            );

            const compactValue = this.values.get(resource.id);
            if (compactValue) compactValue.textContent = value;

            const detailValue = this.detailValues.get(resource.id);
            if (detailValue) detailValue.textContent = value;
        }
    }
}
