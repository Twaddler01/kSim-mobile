import { addLog } from "../functions.js";
import {
    materialDefinitions,
    recipeDefinitions
} from "../data/manufacturing.js";

const RESOURCE_NAMES = {
    energy: "Quantum Energy",
    particles: "Particles",
    research: "Research",
    exoticMatter: "Exotic Matter"
};

export function ensureManufacturingState(game) {
    game.inventory ??= {};
    game.manufacturing ??= {
        unlocked: false,
        completedRecipes: [],
        machineBuilt: false
    };

    for (const item of materialDefinitions) {
        game.inventory[item.id] ??= 0;
    }

    game.manufacturing.completedRecipes ??= [];
    game.manufacturing.machineBuilt =
        game.inventory.particleReconfigurationArray > 0;
    return game.manufacturing;
}

export function hasDiscovery(game, id) {
    if (!id) return true;

    // The first check is the preferred stable ID. The other two support
    // common plan-save shapes without requiring plan code to import this system.
    return (
        (game.discoveries ?? []).includes(id) ||
        (game.completedPlans ?? []).includes("plan-001") ||
        game.plans?.["plan-001"]?.complete === true ||
        game.planProgress?.["plan-001"]?.complete === true
    );
}

export function recipeUnlocked(game, recipe) {
    return (
        !recipe.unlock?.discovery || hasDiscovery(game, recipe.unlock.discovery)
    );
}

export function getCostStatus(game, recipe) {
    const missing = [];
    for (const [id, amount] of Object.entries(recipe.costs?.resources ?? {})) {
        if ((game.resources?.[id] ?? 0) < amount) {
            missing.push({
                id,
                name: RESOURCE_NAMES[id] ?? id,
                needed: amount,
                have: game.resources?.[id] ?? 0,
                type: "resource"
            });
        }
    }
    for (const [id, amount] of Object.entries(recipe.costs?.items ?? {})) {
        if ((game.inventory?.[id] ?? 0) < amount) {
            const definition = materialDefinitions.find(item => item.id === id);
            missing.push({
                id,
                name: definition?.name ?? id,
                needed: amount,
                have: game.inventory?.[id] ?? 0,
                type: "item"
            });
        }
    }
    return { affordable: missing.length === 0, missing };
}

export function canCraftRecipe(game, recipeOrId) {
    const recipe =
        typeof recipeOrId === "string"
            ? recipeDefinitions.find(item => item.id === recipeOrId)
            : recipeOrId;

    if (!recipe || !recipeUnlocked(game, recipe)) return false;
    if (recipe.unique && (game.inventory?.[recipe.output.id] ?? 0) >= 1)
        return false;
    return getCostStatus(game, recipe).affordable;
}

export function craftRecipe(game, recipeId) {
    ensureManufacturingState(game);
    const recipe = recipeDefinitions.find(item => item.id === recipeId);

    if (!recipe) return { ok: false, reason: "Unknown recipe." };
    if (!recipeUnlocked(game, recipe)) {
        return {
            ok: false,
            reason: "This recipe requires the Temporal Resonance discovery."
        };
    }
    if (recipe.unique && (game.inventory[recipe.output.id] ?? 0) >= 1) {
        return {
            ok: false,
            reason: `${recipe.name} has already been assembled.`
        };
    }

    const status = getCostStatus(game, recipe);
    if (!status.affordable) {
        return {
            ok: false,
            reason: `Missing: ${status.missing.map(item => `${item.needed - item.have} ${item.name}`).join(", ")}.`
        };
    }

    // Check everything before changing state, then pay atomically.
    for (const [id, amount] of Object.entries(recipe.costs?.resources ?? {})) {
        game.resources[id] -= amount;
    }
    for (const [id, amount] of Object.entries(recipe.costs?.items ?? {})) {
        game.inventory[id] -= amount;
    }
    game.inventory[recipe.output.id] =
        (game.inventory[recipe.output.id] ?? 0) + recipe.output.amount;
    if (!game.manufacturing.completedRecipes.includes(recipe.id)) {
        game.manufacturing.completedRecipes.push(recipe.id);
    }

    if (recipe.output.id === "particleReconfigurationArray") {
        game.manufacturing.machineBuilt = true;
    }

    addLog(
        game,
        `SYNTHESIS: ${recipe.name} produced (${recipe.output.amount}).`,
        { category: "activity" }
    );
    return { ok: true, recipe, output: recipe.output };
}

export function formatRecipeCost(recipe) {
    const parts = [];
    for (const [id, amount] of Object.entries(recipe.costs?.resources ?? {})) {
        parts.push(`${amount} ${RESOURCE_NAMES[id] ?? id}`);
    }
    for (const [id, amount] of Object.entries(recipe.costs?.items ?? {})) {
        const item = materialDefinitions.find(def => def.id === id);
        parts.push(`${amount} ${item?.name ?? id}`);
    }
    return parts.join(" · ") || "No cost";
}

export { materialDefinitions, recipeDefinitions };
