// src/systems/SynthesisEngine.js
import { addInventoryItem, removeInventoryItem } from "../data/inventory.js";

/**
 * Read the amount of an item in the shared inventory.
 */
export function getInventoryAmount(game, itemId) {
    return Math.max(0, Number(game?.inventory?.[itemId]) || 0);
}

/**
 * Check whether the inventory contains every recipe input.
 */
export function canCraftRecipe(game, recipe) {
    if (!game?.inventory || !recipe?.inputs) {
        return false;
    }

    return Object.entries(recipe.inputs).every(
        ([itemId, required]) =>
            Number.isFinite(required) &&
            required > 0 &&
            getInventoryAmount(game, itemId) >= required
    );
}

/**
 * Return a detailed affordability result for the UI.
 */
export function getRecipeStatus(game, recipe) {
    const requirements = Object.entries(recipe.inputs ?? {}).map(
        ([itemId, required]) => {
            const available = getInventoryAmount(game, itemId);

            return {
                id: itemId,
                available,
                required,
                sufficient: available >= required
            };
        }
    );

    return {
        canCraft: requirements.every(item => item.sufficient),
        requirements
    };
}

/**
 * Consume all inputs and grant all outputs.
 *
 * Inputs are checked before anything is changed,
 * preventing partially completed recipes.
 */
export function craftRecipe(game, recipe) {
    if (!game?.inventory || !recipe?.inputs || !recipe?.outputs) {
        return {
            ok: false,
            reason: "Invalid recipe or inventory."
        };
    }

    if (!canCraftRecipe(game, recipe)) {
        return {
            ok: false,
            reason: "Insufficient materials."
        };
    }

    // Validate outputs before consuming anything.
    const outputs = Object.entries(recipe.outputs);

    if (
        outputs.length === 0 ||
        outputs.some(([, amount]) => !Number.isFinite(amount) || amount <= 0)
    ) {
        return {
            ok: false,
            reason: "Recipe has invalid outputs."
        };
    }

    if (recipe.unique) {
        const completed = game.manufacturing?.completedRecipes ?? [];

        if (completed.includes(recipe.id)) {
            return {
                ok: false,
                reason: "This recipe has already been completed."
            };
        }
    }

    // Consume inputs.
    for (const [itemId, amount] of Object.entries(recipe.inputs)) {
        removeInventoryItem(game, itemId, amount);
    }

    // Grant outputs.
    for (const [id, amount] of outputs) {
        addInventoryItem(game, id, amount);
    }

    // Record completed recipes for future progression systems.
    game.manufacturing ??= {};
    game.manufacturing.completedRecipes ??= [];

    if (!game.manufacturing.completedRecipes.includes(recipe.id)) {
        game.manufacturing.completedRecipes.push(recipe.id);
    }

    return {
        ok: true,
        recipe,
        inputs: { ...recipe.inputs },
        outputs: { ...recipe.outputs }
    };
}
