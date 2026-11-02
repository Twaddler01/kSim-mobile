// src/data/journal/relationships.js

import { getJournalEntriesByType, getJournalEntry } from "./catalog.js";

// --------------------------------------------------
// RECIPE INDEX
// --------------------------------------------------

const recipes = getJournalEntriesByType("recipe");

const recipesUsing = new Map();
const recipesProducing = new Map();

for (const recipe of recipes) {
    const { inputs, outputs } = recipe.source;

    // Index recipe inputs
    for (const materialId of Object.keys(inputs ?? {})) {
        if (!recipesUsing.has(materialId)) {
            recipesUsing.set(materialId, []);
        }

        recipesUsing.get(materialId).push(recipe);
    }

    // Index recipe outputs
    for (const materialId of Object.keys(outputs ?? {})) {
        if (!recipesProducing.has(materialId)) {
            recipesProducing.set(materialId, []);
        }

        recipesProducing.get(materialId).push(recipe);
    }
}

// --------------------------------------------------
// PUBLIC LOOKUPS
// --------------------------------------------------

export function getRecipesUsing(materialId) {
    return recipesUsing.get(materialId) ?? [];
}

export function getRecipesProducing(materialId) {
    return recipesProducing.get(materialId) ?? [];
}

// --------------------------------------------------
// RECIPE MATERIAL LOOKUPS
// --------------------------------------------------

function getRecipeItems(recipeId, direction) {
    const recipe = getJournalEntry(recipeId, "recipe");

    if (!recipe) return [];

    return Object.entries(recipe.source[direction] ?? {})
        .map(([id, amount]) => ({
            item: getJournalEntry(id, "material")
                ?? getJournalEntry(id, "resource"),
            id,
            amount
        }));
}

export function getRecipeInputs(recipeId) {
    return getRecipeItems(recipeId, "inputs");
}

export function getRecipeOutputs(recipeId) {
    return getRecipeItems(recipeId, "outputs");
}

// --------------------------------------------------
// FIELD LOOKUPS
// --------------------------------------------------

export function getFieldMaterials(fieldId) {
    const field = getJournalEntry(fieldId, "field");
    if (!field) return [];

    const spawnTable = field.source.spawnTable ?? {};

    return Object.keys(spawnTable).map(materialId => ({
        material: getJournalEntry(materialId, "material"),
        id: materialId,
        weight: spawnTable[materialId]
    }));
}

export function getMaterialField(materialId) {
    const material = getJournalEntry(materialId, "material");
    if (!material) return null;

    const fieldId = material.source.field?.id;
    if (!fieldId) return null;

    return getJournalEntry(fieldId, "field");
}

export function getFieldUnlock(fieldId) {
    const field = getJournalEntry(fieldId, "field");
    if (!field) return null;

    return field.source.unlockTrigger ?? null;
}