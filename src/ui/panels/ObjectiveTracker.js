// src/ui/panels/ObjectiveTracker.js
import { el } from "../components/Element.js";
import { getCurrentStage, checkRequirements } from "../../data/stages.js";

export default class ObjectiveTracker {
    constructor({ getGame, navigateToLab }) {
        this.getGame = getGame;
        this.navigateToLab = navigateToLab;
        this.element = null;
        this.expanded = false;
        this._lastStageId = null;
        this._outsideBound = false;
    }

    getElement() {
        if (!this.element) {
            this.element = el("div", { className: "objective-tracker" });
            this.bindOutsideClick();
        }
        this.update();
        return this.element;
    }

    bindOutsideClick() {
        if (this._outsideBound) return;
        this._outsideBound = true;

        document.addEventListener(
            "pointerdown",
            e => {
                if (!this.expanded) return;
                if (this.element.contains(e.target)) return;
                this.expanded = false;
                this.update();
            },
            true // capture phase — runs before inner click handlers
        );
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

        // Auto-collapse when stage changes
        if (this._lastStageId !== stage.id) {
            this._lastStageId = stage.id;
            this.expanded = false;
        }

        const { progress, met } = checkRequirements(game, stage);
        const entries = Object.entries(progress);
        const totalHave = entries.reduce(
            (s, [, { have, need }]) => s + Math.min(have, need),
            0
        );
        const totalNeed = entries.reduce((s, [, { need }]) => s + need, 0);

        this.element.style.display = "flex";
        this.element.replaceChildren(
            this.renderHeader(stage, totalHave, totalNeed, met),
            ...(this.expanded ? [this.renderBody(entries)] : [])
        );
    }

    renderHeader(stage, totalHave, totalNeed, met) {
        const header = el(
            "button",
            {
                type: "button",
                className: "objective-tracker__header",
                onClick: () => {
                    this.expanded = !this.expanded;
                    this.update();
                }
            },
            [
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
                }),
                el("span", {
                    className: `objective-tracker__chevron${this.expanded ? " is-open" : ""}`,
                    text: "▾"
                })
            ]
        );
        return header;
    }

    renderBody(entries) {
        const rows = entries.map(([itemId, { have, need }]) => {
            const capped = Math.min(have, need);
            const pct = Math.min(100, Math.round((have / need) * 100));
            const done = have >= need;

            const fill = el("div", {
                className: `tracker-req__fill${done ? " is-done" : ""}`
            });
            fill.style.width = `${pct}%`;

            return el("div", { className: "tracker-req" }, [
                el("span", {
                    className: `tracker-req__label${done ? " is-done" : ""}`,
                    text: this.formatItemName(itemId)
                }),
                el("div", { className: "tracker-req__bar" }, [fill]),
                el("span", {
                    className: `tracker-req__amount${done ? " is-done" : ""}`,
                    text: `${capped}/${need}`
                })
            ]);
        });

        return el("div", { className: "objective-tracker__body" }, [
            ...rows,
            el(
                "button",
                {
                    type: "button",
                    className: "objective-tracker__open-lab",
                    onClick: () => {
                        this.expanded = false;
                        this.update();
                        this.navigateToLab();
                    }
                },
                ["Open LAB →"]
            )
        ]);
    }

    formatItemName(itemId) {
        return itemId
            .replace(/([a-z])([A-Z])/g, "$1 $2")
            .replace(/^./, c => c.toUpperCase());
    }
}
