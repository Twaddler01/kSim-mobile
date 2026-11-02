import { el } from "../components/Element.js";
import MaterialIcon from "../../assets/icons/materials/MaterialIcon.js";
import { inventoryItems, initializeInventory } from "../../data/inventory.js";

export default class Inventory {
    constructor({ getGame, formatNumber }) {
        this.getGame = getGame;
        this.formatNumber = formatNumber ?? (value => String(value));

        this.expanded = false;
        this.values = new Map();
        this.detailValues = new Map();
        this.itemIds = [];

        initializeInventory(this.game);

        this.element = this.render();
    }

    get game() {
        return this.getGame();
    }

    createItemIcon(item, className, size = 24) {
        if (item.inventoryType === "resource") {
            return el("span", {
                className,
                "aria-hidden": "true",
                text: item.icon || "◈"
            });
        }

        return MaterialIcon(item.id, {
            size,
            className
        });
    }

    getVisibleItems() {
        const discovered = this.game.inventoryDiscovered ?? {};

        return inventoryItems.filter(item => discovered[item.id]);
    }

    getAmount(item) {
        return this.game.inventory?.[item.id] ?? 0;
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
                    [this.createItemIcon(item, "resource-chip-icon", 18), value]
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
                              this.createItemIcon(
                                  item,
                                  "inventory-item-icon",
                                  26
                              ),
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
