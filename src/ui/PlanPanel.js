import { planDefinitions } from "../data/plans.js";

export default class PlanPanel {
    constructor({
        getGame,
        save = () => {},
        refreshUI = () => {},
        onCellSelect = () => {}
    }) {
        this.getGame = getGame;
        this.save = save;
        this.refreshUI = refreshUI;
        this.onCellSelect = onCellSelect;
        this.selectedPlanId = planDefinitions[0]?.id ?? null;

        this.element = document.createElement("section");
        this.element.className = "plan-panel";

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

        const heading = document.createElement("div");
        heading.className = "plan-panel__heading";

        const title = document.createElement("h2");
        title.textContent = "PLAN";

        const subtitle = document.createElement("p");
        subtitle.textContent = "SCIENTIFIC MODEL ARCHIVE";

        heading.append(title, subtitle);

        const cards = document.createElement("div");
        cards.className = "plan-cards";

        for (const plan of planDefinitions) {
            const state = this.getPlanState(plan.id);
            const count = state.revealed.length;
            const total = plan.tiles.length;

            const card = document.createElement("button");
            card.type = "button";
            card.className = "plan-card";
            card.dataset.selected = String(plan.id === this.selectedPlanId);

            const name = document.createElement("strong");
            name.textContent = `PLAN ${plan.number}`;

            const description = document.createElement("span");
            description.textContent = plan.name;

            const progress = document.createElement("span");
            progress.className = "plan-card__progress";
            progress.textContent = `${count} / ${total} fragments`;

            card.append(name, description, progress);

            card.addEventListener("click", () => {
                this.selectedPlanId = plan.id;
                this.render();
            });

            cards.append(card);
        }

        this.element.append(heading, cards);

        const plan = planDefinitions.find(
            item => item.id === this.selectedPlanId
        );

        if (plan) {
            this.renderBoard(plan);
        }
    }

    renderBoard(plan) {
        const state = this.getPlanState(plan.id);
        const revealed = new Set(state.revealed);
        const completed = plan.tiles.every(tile => revealed.has(tile.id));

        state.completed = completed;

        const section = document.createElement("section");
        section.className = "plan-board-section";

        const heading = document.createElement("div");
        heading.className = "plan-board__heading";

        const name = document.createElement("h3");
        name.textContent = plan.name;

        const progress = document.createElement("span");
        progress.textContent = `${revealed.size} / ${plan.tiles.length} REVEALED`;

        heading.append(name, progress);

        const board = document.createElement("div");
        board.className = "plan-grid";
        board.style.setProperty("--plan-columns", plan.columns);
        board.style.setProperty("--plan-rows", plan.rows);

        board.dataset.completed = String(completed);

        for (const cell of plan.tiles) {
            const isRevealed = revealed.has(cell.id);

            const button = document.createElement("button");
            button.type = "button";
            button.className = "plan-grid__cell";
            button.dataset.cellId = cell.id;
            button.dataset.revealed = String(isRevealed);

            button.setAttribute(
                "aria-label",
                isRevealed
                    ? `${cell.expression}, ${cell.id}`
                    : `${cell.id}, costs ${cell.cost} research points`
            );

            if (isRevealed) {
                const expression = document.createElement("span");
                expression.className = "plan-grid__expression";
                expression.textContent = cell.expression;
                button.append(expression);
            } else {
                const seal = document.createElement("span");
                seal.className = "plan-grid__seal";
                seal.textContent = "?";

                const cost = document.createElement("span");
                cost.className = "plan-grid__cost";
                cost.textContent = `${cell.cost} RP`;

                button.append(seal, cost);
            }

            button.addEventListener("click", () => {
                const tileState = {
                    revealed: revealed.has(cell.id)
                };

                if (tileState.revealed) {
                    this.onCellSelect(plan, cell, tileState);
                    return;
                }

                const success = this.revealTile(plan, cell);

                if (!success) {
                    this.onCellSelect(plan, cell, {
                        revealed: false,
                        insufficientResearch: true
                    });
                }
            });

            board.append(button);
        }

        if (completed) {
            const artwork = document.createElement("img");
            artwork.className = "plan-board__completed-art";
            artwork.src = plan.completeSvg;
            artwork.alt = `Completed formula: ${plan.name}`;
            artwork.draggable = false;

            artwork.addEventListener(
                "error",
                () => {
                    artwork.remove();
                },
                { once: true }
            );

            section.append(artwork);
        }

        section.append(heading, board);
        this.element.append(section);
    }

    revealTile(plan, cell) {
        const game = this.getGame();
        const state = this.getPlanState(plan.id);

        // Don't charge twice for an already revealed tile.
        if (state.revealed.includes(cell.id)) {
            return false;
        }

        const research = game.resources.research ?? 0;

        if (research < cell.cost) {
            return false;
        }

        game.resources.research -= cell.cost;
        state.revealed.push(cell.id);

        state.completed = plan.tiles.every(tile =>
            state.revealed.includes(tile.id)
        );

        if (state.completed) {
            this.addCompletionLog?.(plan);
        }

        this.save();
        this.render();
        this.refreshUI({ database: true });

        return true;
    }

    getElement() {
        return this.element;
    }

    destroy() {
        this.element.remove();
    }
}
