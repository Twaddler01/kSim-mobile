import { addLog } from "../functions.js";
import { materials } from "../data/materials.js";

/**
 * Adds a fixed amount of a defined raw material to inventory.
 */
export function gatherMaterial(game, materialId, amount = 1) {
    const material = materials.find(item => item.id === materialId);

    if (!material || material.category !== "raw") {
        return {
            ok: false,
            reason: "Unknown raw material."
        };
    }

    const quantity = Math.floor(Number(amount));

    if (!Number.isFinite(quantity) || quantity < 1) {
        return {
            ok: false,
            reason: "Amount must be at least 1."
        };
    }

    game.inventory ??= {};
    game.inventory[material.id] = (game.inventory[material.id] ?? 0) + quantity;

    addLog(game, `MATERIAL RECOVERY: +${quantity} ${material.name}.`, {
        category: "activity"
    });

    return {
        ok: true,
        item: material,
        amount: quantity,
        total: game.inventory[material.id]
    };
}
