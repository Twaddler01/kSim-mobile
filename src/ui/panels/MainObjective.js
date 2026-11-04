// src/ui/panels/MainObjective.js
import { el } from "../components/Element.js";
import {
    getCurrentStage,
    getStageEntriesVisible,
    checkRequirements
} from "../../data/stages.js";

export default class MainObjective {
    constructor({ getGame, onToggleTracker }) {
        this.getGame = getGame;
        this.onToggleTracker = onToggleTracker ?? (() => {});
        this.element = null;
    }

    getElement() {
        if (!this.element) {
            this.element = el("section", { className: "main-objective" });
        }
        this.update();
        return this.element;
    }

    update() {
        if (!this.element) return this;

        const game = this.getGame();
        const stage = getCurrentStage(game);

        if (!stage) {
            // All stages complete — show a quiet "cycle complete" line.
            this.element.replaceChildren(
                el("div", { className: "main-objective__complete" }, [
                    el("div", {
                        className: "eyebrow",
                        text: "PROGRESSION"
                    }),
                    el("p", {
                        className: "muted",
                        text:
                            "The current objective chain is complete. " +
                            "Further stages are under development."
                    })
                ])
            );
            return this;
        }

        const { progress } = checkRequirements(game, stage);
        const trackerEnabled = Boolean(game.appState?.trackerEnabled);

        this.element.replaceChildren(
            this.renderCass(stage),
            this.renderObjective(stage, progress),
            this.renderOriginLog(game),
            this.renderTrackerToggle(trackerEnabled)
        );

        return this;
    }

    renderCass(stage) {
        return el("div", { className: "main-objective__cass" }, [
            el("div", { className: "main-objective__cass-badge", text: "◈" }),
            el("div", { className: "main-objective__cass-body" }, [
                el("div", {
                    className: "main-objective__cass-name",
                    text: "CASS"
                }),
                el("div", {
                    className: "main-objective__cass-line",
                    text: `"${stage.cass}"`
                })
            ])
        ]);
    }

    renderObjective(stage, progress) {
        const rows = Object.entries(progress).map(([itemId, { have, need }]) => {
            const capped = Math.min(have, need);
            const pct = Math.min(100, Math.round((have / need) * 100));
            const done = have >= need;
    
            const fill = el("div", {
                className: `req-bar__fill${done ? " is-done" : ""}`
            });
            fill.style.width = `${pct}%`;
    
            return el("div", { className: "req-row" }, [
                el("span", {
                    className: `req-label${done ? " is-done" : ""}`,
                    text: this.formatItemName(itemId)
                }),
                el("div", { className: "req-bar" }, [fill]),
                el("span", {
                    className: `req-amount${done ? " is-done" : ""}`,
                    text: `${capped}/${need}`   // ← was `${have}/${need}`
                })
            ]);
        });

        return el("div", { className: "main-objective__body" }, [
            el("div", {
                className: "main-objective__heading",
                text: stage.name.toUpperCase()
            }),
            el("p", {
                className: "main-objective__objective",
                text: stage.objective
            }),
            el("p", {
                className: "main-objective__flavor muted",
                text: stage.flavor
            }),
            el("div", { className: "main-objective__reqs" }, rows)
        ]);
    }

    renderOriginLog(game) {
        const entries = getStageEntriesVisible(game);
        if (entries.length === 0) return el("span");

        const details = el("details", { className: "origin-log" });
        details.append(
            el("summary", {
                className: "origin-log__summary",
                text:
                    entries.length === 1
                        ? entries[0].originEntry.title
                        : `ORIGIN LOG (${entries.length} entries)`
            })
        );

        for (const stage of entries) {
            const entry = stage.originEntry;
            details.append(
                el("div", { className: "origin-log__entry" }, [
                    el("div", {
                        className: "origin-log__title",
                        text: entry.title
                    }),
                    el("p", {
                        className: "origin-log__body",
                        text: entry.body
                    })
                ])
            );
        }

        return details;
    }

    renderTrackerToggle(enabled) {
        const btn = el(
            "button",
            {
                type: "button",
                className: "main-objective__tracker-toggle",
                onClick: () => this.onToggleTracker(!enabled)
            },
            [
                el("span", {
                    className: `tracker-check${enabled ? " is-on" : ""}`,
                    text: enabled ? "☑" : "☐"
                }),
                el("span", {
                    text: "Show objective tracker"
                })
            ]
        );
        return btn;
    }

    formatItemName(itemId) {
        // "copperIngot" → "Copper Ingot"
        return itemId
            .replace(/([a-z])([A-Z])/g, "$1 $2")
            .replace(/^./, c => c.toUpperCase());
    }
}
