// src/ui/panels/ObjectiveTracker.js
import { el } from "../components/Element.js";
import { getCurrentStage, checkRequirements } from "../../data/stages.js";

/**
 * Optional, minimal pill shown below the topbar when enabled.
 * Off by default. Tapping it jumps to the LAB tab.
 */
export default class ObjectiveTracker {
    constructor({ getGame, navigateToLab }) {
        this.getGame = getGame;
        this.navigateToLab = navigateToLab;
        this.element = null;
    }

    getElement() {
        if (!this.element) {
            this.element = el("button", {
                type: "button",
                className: "objective-tracker",
                onClick: () => this.navigateToLab()
            });
        }
        this.update();
        return this.element;
    }

    update() {
        if (!this.element) return this;

        const game = this.getGame();
        if (!game.appState?.trackerEnabled) {
            this.element.replaceChildren();
            this.element.style.display = "none";
            return this;
        }

        const stage = getCurrentStage(game);
        if (!stage) {
            this.element.style.display = "none";
            return this;
        }

        const { progress, met } = checkRequirements(game, stage);
        const entries = Object.values(progress);
        const totalHave = entries.reduce((s, e) => s + Math.min(e.have, e.need), 0);
        const totalNeed = entries.reduce((s, e) => s + e.need, 0);

        this.element.style.display = "flex";
        this.element.replaceChildren(
            el("span", {
                className: "objective-tracker__badge",
                text: "◈"
            }),
            el("span", {
                className: "objective-tracker__label",
                text: stage.shortName.toUpperCase()
            }),
            el("span", {
                className: `objective-tracker__progress${met ? " is-done" : ""}`,
                text: `${totalHave}/${totalNeed}`
            })
        );

        return this;
    }
}
