import { el } from "./Element.js";

export default class Inventory {
    constructor({ getGame, resources = [], materials = [], formatNumber }) {
        this.getGame = getGame;
        this.resources = resources;
        this.materials = materials;
        this.formatNumber = formatNumber ?? (value => String(value));

        this.expanded = false;
        this.values = new Map();
        this.detailValues = new Map();
        this.itemIds = [];

        this.element = this.render();
    }

    get game() {
        return this.getGame();
    }

    getVisibleItems() {
        const resources = this.resources
            .filter(
                item =>
                    !item.unlockDiscovery ||
                    this.game.discoveries.includes(item.unlockDiscovery)
            )
            .map(item => ({
                ...item,
                inventoryType: "resources"
            }));

        // Keep raw materials visible from the beginning.
        // Show processed items once they have been produced.
        const materials = this.materials
            .filter(
                item =>
                    item.category === "raw" ||
                    (this.game.inventory?.[item.id] ?? 0) > 0
            )
            .map(item => ({
                ...item,
                inventoryType: "inventory"
            }));

        return [...resources, ...materials];
    }

    getAmount(item) {
        return this.game[item.inventoryType]?.[item.id] ?? 0;
    }

    getItemKey(item) {
        return `${item.inventoryType}:${item.id}`;
    }

    render() {
        const items = this.getVisibleItems();

        this.values.clear();
        this.detailValues.clear();
        this.itemIds = items.map(item => this.getItemKey(item));

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
                "aria-label": "Current resources and materials"
            },
            items.map(item => {
                const key = this.getItemKey(item);
                const value = el("span", {
                    className: "resource-chip-value",
                    text: this.formatNumber(this.getAmount(item))
                });

                this.values.set(key, value);

                return el(
                    "div",
                    {
                        className: "resource-chip",
                        role: "listitem",
                        title: item.name
                    },
                    [
                        el("span", {
                            className: "resource-chip-icon",
                            "aria-hidden": "true",
                            text: item.icon
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
                      "aria-label": "Resource and material details"
                  },
                  items.map(item => {
                      const key = this.getItemKey(item);
                      const value = el("strong", {
                          className: "inventory-item-value",
                          text: this.formatNumber(this.getAmount(item))
                      });

                      this.detailValues.set(key, value);

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
                                  text: item.icon
                              }),
                              el(
                                  "div",
                                  {
                                      className: "inventory-item-copy"
                                  },
                                  [
                                      el("strong", { text: item.name }),
                                      el("small", {
                                          text: item.description
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
        const items = this.getVisibleItems();
        const ids = items.map(item => this.getItemKey(item));

        if (JSON.stringify(ids) !== JSON.stringify(this.itemIds)) {
            this.replaceElement();
            return;
        }

        for (const item of items) {
            const key = this.getItemKey(item);
            const value = this.formatNumber(this.getAmount(item));

            const compactValue = this.values.get(key);
            if (compactValue) compactValue.textContent = value;

            const detailValue = this.detailValues.get(key);
            if (detailValue) detailValue.textContent = value;
        }
    }
}
