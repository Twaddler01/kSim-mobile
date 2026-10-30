import { el } from "./Element.js";
import { Button } from "./Button.js";
import { ProgressBar } from "./ProgressBar.js";
import { itemDomId } from "./itemNavigation.js";

export default class DiscoveryPanel {
    constructor({
        getGame,
        discoveries,
        resourceDefinitions,
        canAfford,
        costLabel,
        hasEventOccurred,
        completeInvestigation,
        showToast,
        unreadManager
    }) {
        this.getGame = getGame;
        this.discoveries = discoveries;
        this.resourceDefinitions = resourceDefinitions;
        this.canAfford = canAfford;
        this.costLabel = costLabel;
        this.hasEventOccurred = hasEventOccurred;
        this.completeInvestigation = completeInvestigation;
        this.showToast = showToast;
        this.unreadManager = unreadManager;

        this.element = null;
        this.cards = new Map();
    }

    get game() {
        return this.getGame();
    }

    getExperimentRequirement(item) {
        return item.trigger?.type === "experimentCount"
            ? (item.trigger.min ?? 0)
            : null;
    }

    createCard(item) {
        const requirement = this.getExperimentRequirement(item);

        const title = el("strong", {});
        const status = el("span", {
            className: "status"
        });
        const description = el("p", {
            className: "item-description"
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
                status
            ]
        );

        const body = el(
            "div",
            {
                className: "item-details"
            },
            [heading, description]
        );

        const costLine = el("div", {
            className: "cost-line"
        });

        const investigateButton = Button(
            "INVESTIGATE",
            () => this.investigate(item),
            { variant: "primary-button" }
        );

        const progress =
            requirement !== null
                ? ProgressBar({
                      label: "Experiment count",
                      value: 0,
                      max: requirement,
                      format: (value, max) => `${Math.floor(value)} / ${max}`
                  })
                : null;

        if (progress) {
            body.append(progress);
        }

        body.append(costLine, investigateButton);

        const article = el(
            "article",
            {
                id: itemDomId("observations", item.id),
                className: "list-item"
            },
            [body]
        );

        article.addEventListener("click", () => {
            if (this.unreadManager?.isUnread("observations", item.id)) {
                this.unreadManager.markRead("observations", item.id);
                this.updateCard(item);
            }
        });

        this.cards.set(item.id, {
            article,
            title,
            status,
            description,
            costLine,
            investigateButton,
            progress
        });

        this.updateCard(item);
        return article;
    }

    updateCard(item) {
        const card = this.cards.get(item.id);
        if (!card) return;

        const game = this.game;
        const triggered = this.hasEventOccurred(item.id);
        const unlocked = game.discoveries.includes(item.id);
        const unread = this.unreadManager?.isUnread("observations", item.id);

        const investigatable = item.hidden && !unlocked;
        const requirement = this.getExperimentRequirement(item);
        const cost = item.cost ?? {};
        const affordable = this.canAfford(game, cost);

        // Hidden observations remain invisible until triggered.
        card.article.style.display = item.hidden && !triggered ? "none" : "";

        card.article.classList.toggle("is-unlocked", unlocked);
        card.article.classList.toggle("is-unread", Boolean(unread));

        card.title.textContent = unlocked
            ? item.name
            : investigatable
              ? "Unknown Energy Source"
              : "Unconfirmed Observation";

        card.status.className = `status ${unlocked ? "status-found" : ""}`;

        card.status.textContent = unlocked
            ? "RECORDED"
            : investigatable
              ? "INVESTIGATION AVAILABLE"
              : "UNKNOWN";

        card.description.textContent = unlocked
            ? item.description
            : investigatable
              ? "A signal has been detected, but its source is unknown. Allocate research resources to investigate it."
              : requirement !== null
                ? `Perform ${requirement} experiments to verify this observation.`
                : "This observation is awaiting further investigation.";

        const showInvestigation = investigatable;
        card.costLine.style.display = showInvestigation ? "" : "none";
        card.investigateButton.style.display = showInvestigation ? "" : "none";

        if (showInvestigation) {
            card.costLine.textContent = `Investigation cost: ${this.costLabel(
                cost,
                this.resourceDefinitions
            )}`;

            card.investigateButton.disabled = !affordable;
        }

        if (card.progress) {
            const showProgress =
                !unlocked && !investigatable && requirement !== null;

            card.progress.style.display = showProgress ? "" : "none";

            if (showProgress) {
                card.progress.setValue(
                    Math.min(game.clicks, requirement),
                    requirement
                );
            }
        }
    }

    render() {
        if (!this.element) {
            this.element = el("div", {
                className: "item-list"
            });

            // Create each card once, including hidden observations.
            // Hidden cards stay out of view until their trigger activates.
            for (const item of this.discoveries) {
                this.element.append(this.createCard(item));
            }
        }

        this.update();
        return this.element;
    }

    update() {
        if (!this.element) return this;

        for (const item of this.discoveries) {
            this.updateCard(item);
        }

        return this;
    }

    investigate(item) {
        const game = this.game;

        if (!this.hasEventOccurred(item.id)) return;
        if (game.discoveries.includes(item.id)) return;

        const completed = this.completeInvestigation(item);

        if (!completed) {
            this.showToast("Insufficient research resources.");
        }
    }
}
