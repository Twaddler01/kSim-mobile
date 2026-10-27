import { el } from "./Element.js";
import { Button } from "./Button.js";
import { itemDomId } from "./itemNavigation.js";

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
        refreshUI,
        onUnread = () => {},
        unreadManager
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
        this.onUnread = onUnread;
        this.unreadManager = unreadManager;

        this.element = null;
        this.cards = new Map();
    }

    get game() {
        return this.getGame();
    }

    createCard(item) {
        const title = el("strong", {});
        const levelPill = el("span", {
            className: "level-pill"
        });
        const costLine = el("div", {
            className: "cost-line"
        });

        const button = Button("INSTALL UPGRADE", () => this.install(item), {
            variant: "secondary-button"
        });

        const heading = el(
            "div",
            {
                className: "item-heading"
            },
            [
                el("span", {
                    className: "item-icon",
                    text: item.icon
                }),
                title,
                levelPill
            ]
        );

        const description = el("p", {
            className: "item-description",
            text: item.description
        });

        const body = el(
            "div",
            {
                className: "item-details"
            },
            [heading, description, costLine, button]
        );

        const article = el(
            "article",
            {
                id: itemDomId("equipment", item.id),
                className: "list-item"
            },
            [body]
        );

        article.addEventListener("click", () => {
            if (
                this.unreadManager?.isUnread("equipment", item.id) &&
                (this.game.unlockedUpgrades ?? []).includes(item.id)
            ) {
                this.unreadManager.markRead("equipment", item.id);
            }
        });

        const card = {
            article,
            title,
            levelPill,
            costLine,
            button
        };

        this.cards.set(item.id, card);
        this.updateCard(item);

        return article;
    }

    updateCard(item) {
        const card = this.cards.get(item.id);
        if (!card) return;

        const game = this.game;
        const level = game.upgrades[item.id] ?? 0;
        const unlocked = (game.unlockedUpgrades ?? []).includes(item.id);
        const unread =
            unlocked && this.unreadManager?.isUnread("equipment", item.id);

        const maxed = level >= item.maxLevel;
        const cost = this.upgradeCost(item, level);
        const affordable = unlocked && !maxed && this.canAfford(game, cost);

        card.article.classList.toggle("is-locked", !unlocked);
        card.article.classList.toggle("is-unread", Boolean(unread));

        card.title.textContent = item.name;
        card.levelPill.textContent = `LV ${level}/${item.maxLevel}`;

        card.costLine.textContent = !unlocked
            ? (item.unlockDescription ?? "Unlock requirement not met.")
            : maxed
              ? "Maximum level reached"
              : `Cost: ${this.costLabel(cost, this.resourceDefinitions)}`;

        card.button.textContent = !unlocked
            ? "LOCKED"
            : maxed
              ? "MAX LEVEL"
              : "INSTALL UPGRADE";

        card.button.disabled = !unlocked || !affordable || maxed;
    }

    render() {
        if (!this.element) {
            this.element = el("div", {
                className: "item-list"
            });

            for (const item of this.upgradeDefinitions) {
                this.element.append(this.createCard(item));
            }
        }

        this.update();
        return this.element;
    }

    update() {
        if (!this.element) return this;

        for (const item of this.upgradeDefinitions) {
            this.updateCard(item);
        }

        return this;
    }

    install(item) {
        const game = this.game;

        if (!(game.unlockedUpgrades ?? []).includes(item.id)) {
            this.showToast("This upgrade is still locked.");
            return;
        }

        if (this.buyUpgrade(game, item.id, this.onUnread)) {
            this.save();
            this.refreshUI({ database: true });
        } else {
            this.showToast("Insufficient resources.");
        }
    }
}
