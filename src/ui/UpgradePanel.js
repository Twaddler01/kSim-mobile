import { el } from "./Element.js";
import { Button } from "./Button.js";

export default class UpgradePanel {
    constructor({
        getGame,
        upgradeDefinitions,
        resourceDefinitions,
        upgradeCost,
        canAfford,
        buyUpgrade,
        costLabel,
        save,
        showToast,
        refreshUI
    }) {
        this.getGame = getGame;
        this.upgradeDefinitions = upgradeDefinitions;
        this.resourceDefinitions = resourceDefinitions;
        this.upgradeCost = upgradeCost;
        this.canAfford = canAfford;
        this.buyUpgrade = buyUpgrade;
        this.costLabel = costLabel;
        this.save = save;
        this.showToast = showToast;
        this.refreshUI = refreshUI;
    }

    get game() {
        return this.getGame();
    }

    render() {
        const game = this.game;
        const list = el("div", {
            className: "item-list"
        });

        for (const item of this.upgradeDefinitions) {
            const level = game.upgrades[item.id] ?? 0;
            const maxed = level >= item.maxLevel;
            const cost = this.upgradeCost(item, level);
            const affordable = !maxed && this.canAfford(game, cost);

            const body = el(
                "div",
                {
                    className: "item-details"
                },
                [
                    el(
                        "div",
                        {
                            className: "item-heading"
                        },
                        [
                            el("span", {
                                className: "item-icon",
                                text: item.icon
                            }),
                            el("strong", {
                                text: item.name
                            }),
                            el("span", {
                                className: "level-pill",
                                text: `LV ${level}/${item.maxLevel}`
                            })
                        ]
                    ),

                    el("p", {
                        className: "item-description",
                        text: item.description
                    }),

                    el("div", {
                        className: "cost-line",
                        text: maxed
                            ? "Maximum level reached"
                            : `Cost: ${this.costLabel(
                                  cost,
                                  this.resourceDefinitions
                              )}`
                    }),

                    Button(
                        maxed ? "MAX LEVEL" : "INSTALL UPGRADE",
                        () => this.install(item),
                        {
                            variant: "secondary-button",
                            disabled: !affordable || maxed
                        }
                    )
                ]
            );

            list.append(
                el(
                    "article",
                    {
                        className: "list-item"
                    },
                    [body]
                )
            );
        }

        return list;
    }

    install(item) {
        const game = this.game;

        if (this.buyUpgrade(game, item.id)) {
            this.save();
            this.refreshUI({ database: true });
        } else {
            this.showToast("Insufficient resources.");
        }
    }
}
