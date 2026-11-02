// src/systems/SynthesisEngine.js
import {
    getInventoryItem,
    addInventoryItem,
    removeInventoryItem
} from "../data/inventory.js";

/**
 * Read the amount of an item in the shared inventory.
 */
export function getInventoryAmount(game, itemId) {
    return Math.max(0, Number(game?.inventory?.[itemId]) || 0);
}

/**
 * Check whether a recipe's progression requirement is unlocked.
 */
export function isRecipeUnlocked(game, recipe) {
    if (!recipe?.unlockId) return true;

    return game?.unlocks?.[recipe.unlockId] === true;
}

/**
 * Check whether the inventory contains every recipe input.
 */
export function canCraftRecipe(game, recipe) {
    if (!game?.inventory || !recipe?.inputs) {
        return false;
    }

    if (!isRecipeUnlocked(game, recipe)) {
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
 * Calculate how many complete crafts the current inventory supports.
 */
export function getAvailableCrafts(game, recipe) {
    if (!game?.inventory || !recipe?.inputs) return 0;

    if (!isRecipeUnlocked(game, recipe)) return 0;

    const limits = Object.entries(recipe.inputs).map(([itemId, required]) => {
        if (!Number.isFinite(required) || required <= 0) {
            return 0;
        }

        return Math.floor(getInventoryAmount(game, itemId) / required);
    });

    if (!limits.length) return 0;

    const crafts = Math.min(...limits);

    // Unique recipes can only be completed once.
    if (recipe.unique) {
        const completed = game.manufacturing?.completedRecipes ?? [];

        if (completed.includes(recipe.id)) return 0;

        return Math.min(crafts, 1);
    }

    return crafts;
}

/**
 * Return a detailed affordability result for the UI.
 */
export function getRecipeStatus(game, recipe) {
    const unlocked = isRecipeUnlocked(game, recipe);

    const requirements = Object.entries(recipe.inputs ?? {}).map(
        ([itemId, required]) => {
            const available = getInventoryAmount(game, itemId);

            return {
                id: itemId,
                available,
                required,
                sufficient: available >= required,
                discovered: game?.inventoryDiscovered?.[itemId] === true
            };
        }
    );

    const ingredientsDiscovered = requirements.every(item => item.discovered);

    const hasIngredients = requirements.every(item => item.sufficient);

    const availableCrafts = getAvailableCrafts(game, recipe);

    return {
        unlocked,
        lockReason: unlocked
            ? null
            : `Requires progression unlock: ${recipe.unlockId}`,

        ingredientsDiscovered,
        hasIngredients,
        canCraft: unlocked && hasIngredients,

        requirements,

        availableCrafts,

        availableOutputs: Object.fromEntries(
            Object.entries(recipe.outputs ?? {}).map(([itemId, amount]) => [
                itemId,
                availableCrafts * amount
            ])
        )
    };
}

/**
 * Consume all inputs and grant all outputs.
 */
export function craftRecipe(game, recipe, { onProgress = () => {} } = {}) {
    if (!game?.inventory || !recipe?.inputs || !recipe?.outputs) {
        return {
            ok: false,
            reason: "Invalid recipe or inventory."
        };
    }

    if (!isRecipeUnlocked(game, recipe)) {
        return {
            ok: false,
            reason: `Recipe locked. Requires: ${recipe.unlockId}.`
        };
    }

    if (!canCraftRecipe(game, recipe)) {
        return {
            ok: false,
            reason: "Insufficient materials."
        };
    }

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

    // Evaluate progression after all outputs are granted.
    onProgress();

    // Record completed recipes.
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

export function areRecipeIngredientsDiscovered(game, recipe) {
    return Object.keys(recipe.inputs ?? {}).every(itemId => {
        const item = getInventoryItem(itemId);

        return item !== null && game?.inventoryDiscovered?.[itemId] === true;
    });
}
