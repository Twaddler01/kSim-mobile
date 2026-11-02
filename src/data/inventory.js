// src/data/inventory.js

import { resourceDefinitions } from "./resources.js";
import { materials } from "./materials.js";

export const inventoryItems = [
    ...resourceDefinitions.map(item => ({
        ...item,
        category: "resource",
        inventoryType: "resource"
    })),

    ...materials.map(item => ({
        ...item,
        icon: item.icon || "◈",
        inventoryType: "material"
    }))
];

export function getInventoryItem(itemId) {
    return inventoryItems.find(item => item.id === itemId) ?? null;
}

export function unlockInventoryItem(game, itemId) {
    if (!game?.inventory || !game.inventoryDiscovered) {
        return false;
    }

    if (!(itemId in game.inventory)) {
        return false;
    }

    if (game.inventoryDiscovered[itemId]) {
        return false;
    }

    game.inventoryDiscovered[itemId] = true;
    return true;
}

export function syncInventoryDiscovery(game) {
    if (!game?.inventory) return [];

    game.inventoryDiscovered ??= {};

    const newlyDiscovered = [];

    for (const item of inventoryItems) {
        if ((game.inventory[item.id] ?? 0) > 0) {
            if (unlockInventoryItem(game, item.id)) {
                newlyDiscovered.push(item.id);
            }
        }
    }

    return newlyDiscovered;
}

export function initializeInventory(game) {
    if (!game) return null;

    game.inventory ??= {};
    game.inventoryDiscovered ??= {};

    for (const item of inventoryItems) {
        if (!Number.isFinite(game.inventory[item.id])) {
            game.inventory[item.id] = 0;
        }

        game.inventoryDiscovered[item.id] ??= Boolean(item.initiallyDiscovered);
    }

    syncInventoryDiscovery(game);

    return game.inventory;
}

/**
 * Adds an item and automatically discovers it.
 * Returns true only when this acquisition discovers
 * the item for the first time.
 */
export function addInventoryItem(game, itemId, amount = 1) {
    if (!game?.inventory || !game.inventoryDiscovered) {
        return { success: false, newlyDiscovered: false };
    }

    if (!Number.isFinite(amount) || amount <= 0) {
        return { success: false, newlyDiscovered: false };
    }

    if (!(itemId in game.inventory)) {
        console.warn(`Unknown inventory item: ${itemId}`);
        return { success: false, newlyDiscovered: false };
    }

    game.inventory[itemId] += amount;

    const newlyDiscovered = unlockInventoryItem(game, itemId);

    return {
        success: true,
        newlyDiscovered,
        amount: game.inventory[itemId]
    };
}

// WIP integrate where -=
export function removeInventoryItem(game, itemId, amount = 1) {
    if (!game?.inventory) {
        return { success: false, remaining: 0 };
    }

    if (!Number.isFinite(amount) || amount <= 0) {
        return { success: false, remaining: 0 };
    }

    if (!(itemId in game.inventory)) {
        console.warn(`Unknown inventory item: ${itemId}`);
        return { success: false, remaining: 0 };
    }

    const currentAmount = game.inventory[itemId];

    // Prevent spending more than the player owns.
    if (currentAmount < amount) {
        return {
            success: false,
            remaining: currentAmount,
            insufficient: true
        };
    }

    game.inventory[itemId] -= amount;

    return {
        success: true,
        remaining: game.inventory[itemId]
    };
}
