// debug/DebugPanel.js

import { el } from "../src/ui/Element.js";
import { Button } from "../src/ui/Button.js";
import { Card } from "../src/ui/Card.js";
import { materials } from "../src/data/materials.js";
import { resourceDefinitions as RESOURCES } from "../src/data.js";
import { addInventoryItem } from "../src/data/inventory.js";

const GRANT_AMOUNTS = [1, 10, 100, 1000];

export default class DebugPanel {
    constructor({ getGame, save, refreshUI, showToast }) {
        this.getGame = getGame;
        this.save = save;
        this.refreshUI = refreshUI;
        this.showToast = showToast;

        this.element = null;
        this.valueDisplays = new Map();
    }

    get game() {
        return this.getGame();
    }

    createItemCard(item) {

console.log({
    research: kSim.data.inventory?.research,
    unlocks: kSim.data.unlocks,
    fabricatorUnlocked: kSim.data.unlocks?.advancedFabrication
})




        
        const value = el("strong", {
            className: "debug-item-value",
            text: "0"
        });

        this.valueDisplays.set(item.id, value);

        const amountButtons = GRANT_AMOUNTS.map(amount =>
            Button(`+${amount}`, () => this.grantItem(item.id, amount), {
                variant: "secondary-button"
            })
        );

        const card = Card(
            item.name,
            [
                el(
                    "div",
                    {
                        className: "debug-item-current"
                    },
                    [
                        el("span", {
                            text: "Current amount"
                        }),
                        value
                    ]
                ),

                Card.Actions(amountButtons)
            ],
            item.id,
            { icon: item.icon ?? "◈" }
        );

        return card;
    }

    createItemSection(title, items) {
        const grid = el("div", {
            className: "debug-item-grid"
        });

        for (const item of items) {
            grid.append(this.createItemCard(item));
        }

        return el(
            "section",
            {
                className: "debug-section"
            },
            [
                el("h3", {
                    className: "debug-section-title",
                    text: title
                }),
                grid
            ]
        );
    }

    render() {
        this.element = el("div", {
            className: "debug-panel"
        });

        const resources = this.createItemSection(
            "Primary Resources",
            RESOURCES
        );

        const materialItems = materials.map(item => ({
            ...item,
            inventoryType: "material"
        }));

        const materialSection = this.createItemSection(
            "Materials",
            materialItems
        );

        const utilityCard = Card(
            "Testing Utilities",
            [
                Card.Text(
                    "Convenience actions for testing progression and crafting."
                ),

                Card.Actions([
                    {
                        label: "Grant All Materials ×100",
                        variant: "secondary-button",
                        onClick: () => this.grantAllMaterials(100)
                    },
                    {
                        label: "Grant All Resources ×1000",
                        variant: "secondary-button",
                        onClick: () => this.grantAllResources(1000)
                    },
                    {
                        label: "Refresh UI",
                        variant: "secondary-button",
                        onClick: () => this.refreshUI?.({ database: true })
                    }
                ])
            ],
            "Development tools",
            { icon: "🛠️" }
        );

        this.element.append(utilityCard, resources, materialSection);

        this.update();

        return this.element;
    }

    getElement() {
        if (!this.element) {
            this.render();
        }

        this.update();

        return this.element;
    }

    grantItem(itemId, amount = 1) {
        addInventoryItem(this.game, itemId, amount);

        this.finishGrant(`${amount} ${itemId}`);
    }

    grantAllMaterials(amount = 100) {
        for (const item of materials) {
            addInventoryItem(this.game, item.id, amount);
        }

        this.finishGrant("All materials");
    }

    grantAllResources(amount = 1000) {
        for (const item of RESOURCES) {
            addInventoryItem(this.game, item.id, amount);
        }

        this.finishGrant("All resources");
    }

    grantItemWithoutRefresh(itemId, amount) {
        const game = this.game;

        game.inventory ??= {};
        addInventoryItem(game, itemId, amount);
    }

    finishGrant(label) {
        this.save?.();
        this.update();
        this.refreshUI?.({ database: true });
        this.showToast?.(`${label} granted.`);
    }

    update() {
        if (!this.element) return this;

        for (const [itemId, display] of this.valueDisplays) {
            display.textContent = this.game.inventory?.[itemId] ?? 0;
        }

        return this;
    }
}
