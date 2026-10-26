import { el } from "./Element.js";
import { Button } from "./Button.js";
import { materialDefinitions, recipeDefinitions } from "../data/manufacturing.js";
import {
    ensureManufacturingState,
    recipeUnlocked,
    getCostStatus,
    craftRecipe,
    formatRecipeCost
} from "../systems/SynthesisEngine.js";

const GROUPS = ["Materials", "Components", "Advanced Materials", "Assemblies", "Major Equipment"];

export class SynthesisPanel {
    constructor({ game, onChange = () => {}, onToast = () => {} }) {
        this.game = game;
        this.onChange = onChange;
        this.onToast = onToast;
        ensureManufacturingState(this.game);
    }

    getElement() {
        return this.render();
    }

    render() {
        ensureManufacturingState(this.game);
        const root = el("div", { className: "synthesis-panel" }, [
            el("div", { className: "synthesis-intro sim-card" }, [
                el("div", { className: "eyebrow", text: "MATERIALS LAB // FABRICATION SYSTEM" }),
                el("h3", { text: "Synthesis Engine" }),
                el("p", { className: "muted", text: "Recover raw samples during experiments, process them into components, and assemble equipment from dependent parts." })
            ]),
            this.renderInventory(),
            ...GROUPS.map(group => this.renderGroup(group))
        ]);

        return root;
    }

    renderInventory() {
        const items = materialDefinitions.filter(item => (this.game.inventory?.[item.id] ?? 0) > 0);
        return el("section", { className: "sim-card synthesis-inventory" }, [
            el("div", { className: "section-heading" }, [
                el("div", {}, [
                    el("div", { className: "eyebrow", text: "STOCKROOM" }),
                    el("h3", { text: "Material Inventory" })
                ]),
                el("span", { className: "count-pill", text: `${items.length} item types` })
            ]),
            items.length
                ? el("div", { className: "material-grid" }, items.map(item =>
                    el("article", { className: "material-card" }, [
                        el("div", { className: "material-icon", text: item.icon }),
                        el("div", { className: "material-name", text: item.name }),
                        el("div", { className: "material-amount", text: `× ${this.game.inventory[item.id]}` })
                    ])
                ))
                : el("p", { className: "muted", text: "No material samples recovered yet. Run experiments to collect raw materials." })
        ]);
    }

    renderGroup(group) {
        const recipes = recipeDefinitions.filter(recipe => recipe.category === group);
        if (!recipes.length) return el("div", { hidden: true });

        return el("section", { className: "sim-card synthesis-group" }, [
            el("div", { className: "eyebrow", text: "RECIPE DATABASE" }),
            el("h3", { text: group }),
            el("div", { className: "item-list" }, recipes.map(recipe => this.renderRecipe(recipe)))
        ]);
    }

    renderRecipe(recipe) {
        const output = materialDefinitions.find(item => item.id === recipe.output.id);
        const unlocked = recipeUnlocked(this.game, recipe);
        const status = getCostStatus(this.game, recipe);
        const owned = this.game.inventory?.[recipe.output.id] ?? 0;
        const completedUnique = recipe.unique && owned > 0;
        const disabled = !unlocked || !status.affordable || completedUnique;

        let statusText = "READY TO SYNTHESIZE";
        if (!unlocked) statusText = "REQUIRES TEMPORAL RESONANCE";
        else if (completedUnique) statusText = "ASSEMBLY COMPLETE";
        else if (!status.affordable) {
            statusText = `MISSING: ${status.missing.map(item => `${item.needed - item.have} ${item.name}`).join(", ")}`;
        }

        return el("article", { className: `list-item synthesis-recipe ${unlocked ? "" : "is-locked"}` }, [
            el("div", { className: "item-details" }, [
                el("div", { className: "item-heading" }, [
                    el("span", { className: "item-icon", text: output?.icon ?? "⚙️" }),
                    el("strong", { text: recipe.name }),
                    el("span", { className: `status ${!disabled ? "status-found" : ""}`, text: completedUnique ? "BUILT" : unlocked ? "RECIPE" : "LOCKED" })
                ]),
                el("p", { className: "item-description", text: recipe.description }),
                el("p", { className: "cost-line", text: `Required: ${formatRecipeCost(recipe)}` }),
                el("p", { className: "synthesis-status", text: statusText }),
                Button(
                    completedUnique ? "ASSEMBLED" : "SYNTHESIZE",
                    () => {
                        const result = craftRecipe(this.game, recipe.id);
                        if (result.ok) {
                            this.onChange(result);
                        } else {
                            this.onToast(result.reason);
                        }
                    },
                    { variant: "secondary-button", disabled }
                )
            ])
        ]);
    }
}
