// src/ui/SynthesisPanel.js

import { el } from "./Element.js";
import { Button } from "./Button.js";
import { Card } from "./Card.js";
import Badge from "./Badge.js";
import { materials } from "../data/materials.js";
import { refinementRecipes } from "../data/refinement.js";
import { fabricationRecipes } from "../data/fabrication.js";
import { assemblyRecipes } from "../data/assembly.js";
import { getRecipeStatus, craftRecipe } from "../systems/SynthesisEngine.js";
import { resourceDefinitions } from "../data.js";

const RECIPE_GROUPS = [
    {
        id: "refinement",
        title: "Refinement",
        description: "Process raw materials into useful substances.",
        icon: "⚗️",
        recipes: refinementRecipes
    },
    {
        id: "fabrication",
        title: "Fabrication",
        description: "Manufacture components from processed materials.",
        icon: "🔧",
        recipes: fabricationRecipes
    },
    {
        id: "assembly",
        title: "Assembly",
        description: "Combine specialized components into equipment.",
        icon: "⚙️",
        recipes: assemblyRecipes
    }
];

export default class SynthesisPanel {
    constructor({ getGame, save, refreshUI, showToast, processProgression }) {
        this.getGame = getGame;
        this.save = save;
        this.refreshUI = refreshUI;
        this.showToast = showToast;
        this.processProgression = processProgression;

        this.element = null;
        this.cards = new Map();
    }

    get game() {
        return this.getGame();
    }

    getItem(itemId) {
        return (
            materials.find(item => item.id === itemId) ??
            resourceDefinitions[itemId] ?? {
                id: itemId,
                name: itemId,
                icon: "◈"
            }
        );
    }

    getItemLabel(itemId) {
        return this.getItem(itemId).name;
    }

    getItemIcon(itemId) {
        return this.getItem(itemId).icon ?? "◈";
    }

    createRecipeCard(recipe, group) {
        const status = Card.Status("Checking...", {
            variant: "default"
        });

        const lockBadge = Badge({
            text: "🔒 LOCKED",
            variant: "default"
        });

        const requirements = el("div", {
            className: "synthesis-requirements"
        });

        const outputs = el("div", {
            className: "synthesis-outputs"
        });

        const craftButton = Button("CRAFT", () => this.craft(recipe), {
            variant: "primary-button"
        });

        const card = Card(
            recipe.name,
            [
                Card.Text(recipe.description),

                status,

                Card.Section("Requirements", requirements),

                Card.Section("Output", outputs),

                recipe.durationSeconds
                    ? Card.Text(
                          `Processing time: ${recipe.durationSeconds} seconds`
                      )
                    : null,

                Card.Actions([craftButton])
            ],
            group.title,
            {
                icon: group.icon,
                itemId: recipe.id,
                tabId: "synthesis",
                badge: lockBadge
            }
        );

        this.cards.set(recipe.id, {
            recipe,
            card,
            status,
            lockBadge,
            requirements,
            outputs,
            craftButton
        });

        this.updateRecipeCard(recipe);

        return card;
    }

    updateRecipeCard(recipe) {
        const card = this.cards.get(recipe.id);
        if (!card) return;

        const game = this.game;
        const result = getRecipeStatus(game, recipe);
        const locked = !result.unlocked;
        const ingredientsDiscovered = result.ingredientsDiscovered;

        card.card.classList.toggle("is-locked", locked);

        card.lockBadge.classList.toggle("is-hidden", !locked);

        const completed = game.manufacturing?.completedRecipes ?? [];

        const alreadyCompleted = recipe.unique && completed.includes(recipe.id);

        const canCraft = result.canCraft && !alreadyCompleted;

        // Status
        const statusLabel = alreadyCompleted
            ? "COMPLETED"
            : locked
              ? "LOCKED"
              : !ingredientsDiscovered
                ? "UNDISCOVERED INGREDIENTS"
                : canCraft
                  ? "READY"
                  : "INSUFFICIENT MATERIALS";

        const statusVariant = alreadyCompleted
            ? "complete"
            : canCraft
              ? "ready"
              : "default";

        card.status.textContent = statusLabel;
        card.status.className = `card-status card-status--${statusVariant}`;

        // Requirements
        const requirementRows = result.requirements.map(item => {
            const sufficient = item.sufficient;

            return el(
                "div",
                {
                    className: [
                        "card-requirement",
                        sufficient
                            ? "card-requirement--met"
                            : "card-requirement--missing"
                    ].join(" ")
                },
                [
                    el("span", {
                        className: "card-requirement__icon",
                        text: this.getItemIcon(item.id),
                        "aria-hidden": "true"
                    }),

                    el("span", {
                        className: "card-requirement__label",
                        text: this.getItemLabel(item.id)
                    }),

                    el("span", {
                        className: "card-requirement__amount",
                        text: `${item.available} / ${item.required}`
                    })
                ]
            );
        });

        card.requirements.replaceChildren(...requirementRows);

        // Outputs
        const outputRows = Object.entries(recipe.outputs).map(
            ([itemId, amount]) =>
                el(
                    "div",
                    {
                        className: "card-output"
                    },
                    [
                        el("span", {
                            className: "card-output__icon",
                            text: this.getItemIcon(itemId),
                            "aria-hidden": "true"
                        }),

                        el("span", {
                            className: "card-output__label",
                            text: this.getItemLabel(itemId)
                        }),

                        el("strong", {
                            className: "card-output__amount",
                            text: `×${amount}`
                        })
                    ]
                )
        );

        card.outputs.replaceChildren(...outputRows);

        // Craft button
        card.craftButton.disabled = locked || !canCraft;
        card.craftButton.textContent = alreadyCompleted ? "COMPLETED" : "CRAFT";
    }

    craft(recipe) {
        const result = craftRecipe(this.game, recipe);

        if (!result.ok) {
            this.showToast?.(result.reason);
            this.update();
            return false;
        }

        this.processProgression?.();

        this.save?.();

        this.refreshUI?.({ database: true });

        this.showToast?.(`${recipe.name} completed.`);

        return true;
    }

    render() {
        if (!this.element) {
            this.element = el("div", {
                className: "synthesis-panel"
            });

            for (const group of RECIPE_GROUPS) {
                const section = el("section", {
                    className: `synthesis-group synthesis-group--${group.id}`
                });

                const heading = el(
                    "div",
                    {
                        className: "section-heading"
                    },
                    [
                        el("div", {}, [
                            el("div", {
                                className: "eyebrow",
                                text: group.title.toUpperCase()
                            }),
                            el("p", {
                                className: "muted",
                                text: group.description
                            })
                        ])
                    ]
                );

                const grid = el("div", {
                    className: "synthesis-card-grid"
                });

                for (const recipe of group.recipes) {
                    grid.append(this.createRecipeCard(recipe, group));
                }

                section.append(heading, grid);
                this.element.append(section);
            }
        }

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

    update() {
        if (!this.element) return this;

        for (const group of RECIPE_GROUPS) {
            for (const recipe of group.recipes) {
                this.updateRecipeCard(recipe);
            }
        }

        return this;
    }
}
