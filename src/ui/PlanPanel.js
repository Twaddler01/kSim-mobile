import { el, append } from "./Element.js";
import { planDefinitions } from "../data/plans.js";

export default class PlanPanel {
    constructor({
        getGame,
        save = () => {},
        refreshUI = () => {},
        onCellSelect = () => {},
        onEvidence = () => {},
        onHiddenUnlock = () => {},
        onComplete = () => {}
    }) {
        this.getGame = getGame;
        this.save = save;
        this.refreshUI = refreshUI;
        this.onCellSelect = onCellSelect;
        this.onEvidence = onEvidence;
        this.onHiddenUnlock = onHiddenUnlock;
        this.onComplete = onComplete;

        this.selectedPlanId = planDefinitions[0]?.id ?? null;
        this.boardPlanId = null;

        this.planCards = new Map();
        this.tileButtons = new Map();

        this.element = el("section", {
            className: "plan-panel"
        });
        this.render();
    }

    getPlanState(planId) {
        const game = this.getGame();

        game.plan ??= {};
        game.plan.formulas ??= {};
        game.plan.formulas[planId] ??= {
            revealed: [],
            completed: false,
            active: false,
            modifiedCells: {},
            history: []
        };

        return game.plan.formulas[planId];
    }

    render() {
        this.element.replaceChildren();
        this.planCards.clear();

        const heading = el(
            "div",
            {
                className: "plan-panel__heading"
            },
            [
                el("h2", { text: "PLAN" }),
                el("p", { text: "SCIENTIFIC MODEL ARCHIVE" })
            ]
        );

        const cards = el("div", {
            className: "plan-cards"
        });

        for (const plan of planDefinitions) {
            const progress = el("span", {
                className: "plan-card__progress"
            });

            const card = el(
                "button",
                {
                    type: "button",
                    className: "plan-card",
                    onClick: () => {
                        if (this.selectedPlanId === plan.id) {
                            return;
                        }

                        this.selectedPlanId = plan.id;
                        this.renderBoard(plan);
                        this.update();
                    }
                },
                [
                    el("strong", {
                        text: `PLAN ${plan.number}`
                    }),
                    el("span", {
                        text: plan.name
                    }),
                    progress
                ]
            );

            cards.append(card);

            this.planCards.set(plan.id, {
                element: card,
                progress
            });
        }

        this.element.append(heading, cards);

        const plan = planDefinitions.find(
            item => item.id === this.selectedPlanId
        );

        if (plan) {
            this.renderBoard(plan);
        }

        this.update();
    }

    renderBoard(plan) {
        this.boardSection?.remove();

        this.completionArtwork = null;
        this.boardPlanId = plan.id;
        this.tileButtons.clear();

        const name = el("h3", {
            text: plan.name
        });

        const progress = el("span");

        const heading = el(
            "div",
            {
                className: "plan-board__heading"
            },
            [name, progress]
        );

        const board = el("div", {
            className: "plan-grid",
            style: {
                "--plan-columns": plan.columns,
                "--plan-rows": plan.rows
            }
        });

        const section = el(
            "section",
            {
                className: "plan-board-section"
            },
            [heading, board]
        );

        this.element.append(section);

        this.boardSection = section;
        this.boardProgress = progress;
        this.boardElement = board;

        for (const cell of plan.tiles) {
            const button = el("button", {
                type: "button",
                className: "plan-grid__cell",
                dataset: {
                    cellId: cell.id
                },
                onClick: () => {
                    const state = this.getPlanState(plan.id);
                    const isRevealed = state.revealed.includes(cell.id);

                    if (isRevealed) {
                        this.onCellSelect(plan, cell, {
                            revealed: true
                        });
                        return;
                    }

                    const success = this.revealTile(plan, cell);

                    if (!success) {
                        this.onCellSelect(plan, cell, {
                            revealed: false,
                            insufficientResearch: true
                        });
                    }
                }
            });

            board.append(button);

            this.tileButtons.set(cell.id, {
                element: button,
                cell
            });
        }

        this.updateBoard(plan);
    }

    update() {
        // Update every plan card without recreating it.
        for (const plan of planDefinitions) {
            const refs = this.planCards.get(plan.id);

            if (!refs) continue;

            const state = this.getPlanState(plan.id);
            const count = state.revealed.length;

            refs.progress.textContent = `${count} / ${plan.tiles.length} fragments`;

            refs.element.dataset.selected = String(
                plan.id === this.selectedPlanId
            );
        }

        const plan = planDefinitions.find(
            item => item.id === this.selectedPlanId
        );

        if (!plan) return;

        // Rebuild the board only when switching to a different plan
        // or when its board has not yet been created.
        if (this.boardPlanId !== plan.id || !this.boardElement) {
            this.renderBoard(plan);
            return;
        }

        this.updateBoard(plan);
    }

    updateBoard(plan) {
        const state = this.getPlanState(plan.id);
        const revealed = new Set(state.revealed);

        const completed = plan.tiles.every(tile => revealed.has(tile.id));

        this.boardProgress.textContent = `${revealed.size} / ${plan.tiles.length} REVEALED`;

        this.boardElement.dataset.completed = String(completed);

        // Update existing tile buttons in place.
        for (const [cellId, refs] of this.tileButtons) {
            const { element: button, cell } = refs;
            const isRevealed = revealed.has(cellId);

            button.dataset.revealed = String(isRevealed);

            button.setAttribute(
                "aria-label",
                isRevealed
                    ? `${cell.expression}, ${cell.id}`
                    : `${cell.id}, costs ${cell.cost} research points`
            );

            const currentlyRenderedAsRevealed =
                button.dataset.renderedRevealed === String(isRevealed);

            if (currentlyRenderedAsRevealed) continue;

            button.replaceChildren();

            append(
                button,
                isRevealed
                    ? el("span", {
                          className: "plan-grid__expression",
                          text: cell.expression
                      })
                    : [
                          el("span", {
                              className: "plan-grid__seal",
                              text: "?"
                          }),
                          el("span", {
                              className: "plan-grid__cost",
                              text: `${cell.cost} RP`
                          })
                      ]
            );

            button.dataset.renderedRevealed = String(isRevealed);
        }

        // Add or remove completion artwork only when needed.
        if (completed && !this.completionArtwork) {
            const artwork = el("img", {
                className: "plan-board__completed-art",
                src: plan.completeSvg,
                alt: `Completed formula: ${plan.name}`,
                draggable: false,
                onError: [
                    () => {
                        artwork.remove();

                        if (this.completionArtwork === artwork) {
                            this.completionArtwork = null;
                        }
                    },
                    { once: true }
                ]
            });

            this.boardSection.prepend(artwork);
            this.completionArtwork = artwork;
        } else if (!completed && this.completionArtwork) {
            this.completionArtwork.remove();
            this.completionArtwork = null;
        }
    }

    revealTile(plan, cell) {
        const game = this.getGame();
        const state = this.getPlanState(plan.id);

        state.revealed ??= [];
        state.unlockedClues ??= [];
        state.completed ??= false;

        // Already revealed: never charge twice.
        if (state.revealed.includes(cell.id)) {
            return false;
        }

        const research = game.resources.research ?? 0;

        if (research < cell.cost) {
            return false;
        }

        // Pay and reveal.
        game.resources.research -= cell.cost;
        state.revealed.push(cell.id);

        // Every tile provides its own evidence.
        this.onEvidence(plan, cell);

        // Hidden unlocks are permanent and only trigger once.
        if (
            cell.hiddenUnlock &&
            !state.unlockedClues.includes(cell.hiddenUnlock.id)
        ) {
            state.unlockedClues.push(cell.hiddenUnlock.id);
            this.onHiddenUnlock(plan, cell, cell.hiddenUnlock);
        }

        // Major reward: full-board completion only.
        const completed = plan.tiles.every(tile =>
            state.revealed.includes(tile.id)
        );

        if (completed && !state.completed) {
            state.completed = true;
            state.completedAt = Date.now();

            this.onComplete(plan);
        }

        this.save();

        // The main UI refresh will call update() for the active tab.
        this.refreshUI({ database: true });

        return true;
    }

    getElement() {
        return this.element;
    }

    destroy() {
        this.element.remove();
        this.planCards.clear();
        this.tileButtons.clear();
        this.completionArtwork = null;
        this.boardElement = null;
        this.boardSection = null;
    }
}
