import { el } from "../components/Element.js";
import { Button } from "../components/Button.js";
import { Card } from "../components/Card.js";
import Badge from "../components/Badge.js";
import { materials } from "../../data/materials.js";
import { refinementRecipes } from "../../data/refinement.js";
import { fabricationRecipes } from "../../data/fabrication.js";
import { assemblyRecipes } from "../../data/assembly.js";
import { getRecipeStatus, craftRecipe } from "../../systems/SynthesisEngine.js";
import { resourceDefinitions } from "../../data.js";

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
        this.groups = new Map();

        // Categories start expanded.
        this.expandedGroups = new Set(RECIPE_GROUPS.map(group => group.id));

        // Individual recipes start collapsed.
        this.expandedRecipes = new Set();
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

    createCollapseContent(content, expanded) {
        const inner = el(
            "div",
            { className: "synthesis-collapse-inner" },
            content
        );

        const wrapper = el(
            "div",
            {
                className: `synthesis-collapse ${expanded ? "is-expanded" : ""}`
            },
            inner
        );

        return wrapper;
    }

    updateExpansion(element, content, toggle, expanded) {
        element.classList.toggle("is-expanded", expanded);
        element.classList.toggle("is-collapsed", !expanded);

        content.classList.toggle("is-expanded", expanded);
        content.classList.toggle("is-collapsed", !expanded);

        toggle.setAttribute("aria-expanded", String(expanded));
    }

    toggleRecipe(recipeId) {
        if (this.expandedRecipes.has(recipeId)) {
            this.expandedRecipes.delete(recipeId);
        } else {
            this.expandedRecipes.add(recipeId);
        }

        const entry = this.cards.get(recipeId);

        if (entry) {
            this.updateExpansion(
                entry.card,
                entry.content,
                entry.toggle,
                this.expandedRecipes.has(recipeId)
            );
        }
    }

    toggleGroup(groupId) {
        if (this.expandedGroups.has(groupId)) {
            this.expandedGroups.delete(groupId);
        } else {
            this.expandedGroups.add(groupId);
        }

        const entry = this.groups.get(groupId);

        this.updateExpansion(
            entry.section,
            entry.content,
            entry.toggle,
            this.expandedGroups.has(groupId)
        );
    }

    collapseAll() {
        this.expandedGroups.clear();
        this.expandedRecipes.clear();

        for (const entry of this.groups.values()) {
            this.updateExpansion(
                entry.section,
                entry.content,
                entry.toggle,
                false
            );
        }

        for (const entry of this.cards.values()) {
            this.updateExpansion(
                entry.card,
                entry.content,
                entry.toggle,
                false
            );
        }
    }

    createRecipeCard(recipe, group) {
        const status = Card.Status("Checking...", {
            variant: "default"
        });

        const lockBadge = el("span", {
            className: "synthesis-lock-badge",
            text: "🔒 LOCKED",
            title: "Locked recipe"
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

        // Build a valid inline-content button for the recipe header.
        const body = card.querySelector(".card-body");

        const bodyId = `synthesis-recipe-${recipe.id}`;

        body.id = bodyId;

        const recipeToggle = el(
            "button",
            {
                type: "button",
                className: "synthesis-recipe-toggle",
                "aria-expanded": "false",
                "aria-controls": bodyId,
                onClick: () => this.toggleRecipe(recipe.id)
            },
            [
                el("span", {
                    className: "card-icon",
                    text: group.icon,
                    "aria-hidden": "true"
                }),

                el("span", {
                    className: "card-title synthesis-recipe-title",
                    text: recipe.name
                }),

                lockBadge,

                el("span", {
                    className: "synthesis-chevron",
                    text: "›",
                    "aria-hidden": "true"
                })
            ]
        );

        const bodyWrapper = this.createCollapseContent(body, false);
        bodyWrapper.classList.add("synthesis-recipe-content");

        card.replaceChildren(recipeToggle, bodyWrapper);
        card.classList.add("synthesis-card", "is-collapsed");

        this.cards.set(recipe.id, {
            recipe,
            card,
            content: bodyWrapper,
            toggle: recipeToggle,
            status,
            lockBadge,
            requirements,
            outputs,
            craftButton
        });

        this.updateRecipeCard(recipe);

        return card;
    }

    createGroup(group) {
        const section = el("section", {
            className: "synthesis-group is-expanded"
        });

        const toggle = el(
            "button",
            {
                type: "button",
                className: "synthesis-group-toggle",
                "aria-expanded": "true",
                onClick: () => this.toggleGroup(group.id)
            },
            [
                el("span", {
                    className: "synthesis-group-icon",
                    text: group.icon,
                    "aria-hidden": "true"
                }),

                el("span", {
                    className: "synthesis-group-title",
                    text: group.title.toUpperCase()
                }),

                el("span", {
                    className: "synthesis-group-count",
                    text: `${group.recipes.length} RECIPES`
                }),

                el("span", {
                    className: "synthesis-chevron",
                    text: "›",
                    "aria-hidden": "true"
                })
            ]
        );

        const description = el("p", {
            className: "synthesis-group-description",
            text: group.description
        });

        const grid = el("div", {
            className: "synthesis-card-grid"
        });

        for (const recipe of group.recipes) {
            grid.append(this.createRecipeCard(recipe, group));
        }

        const content = this.createCollapseContent([description, grid], true);

        content.classList.add("synthesis-group-content");

        section.append(toggle, content);

        this.groups.set(group.id, {
            section,
            toggle,
            content
        });

        return section;
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

        const outputRows = Object.entries(recipe.outputs).map(
            ([itemId, amount]) =>
                el("div", { className: "card-output" }, [
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
                ])
        );

        card.outputs.replaceChildren(...outputRows);

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

            const toolbar = el("div", {
                className: "synthesis-toolbar"
            });

            const title = el("span", {
                className: "synthesis-toolbar-title",
                text: "RECIPE CATALOG"
            });

            const collapseButton = Button(
                "COLLAPSE ALL",
                () => this.collapseAll(),
                { variant: "secondary-button" }
            );

            collapseButton.classList.add("synthesis-collapse-all");

            toolbar.append(title, collapseButton);
            this.element.append(toolbar);

            for (const group of RECIPE_GROUPS) {
                this.element.append(this.createGroup(group));
            }
        }

        this.update();
        return this.element;
    }

    getElement() {
        if (!this.element) this.render();

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
