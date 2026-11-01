import { addLog } from "../functions.js";
import { materials } from "../data/materials.js";
import { addInventoryItem } from "../data/inventory.js";

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

    const result = addInventoryItem(game, material.id, quantity);

    if (!result.success) {
        return {
            ok: false,
            reason: "Unable to add material to inventory."
        };
    }

    addLog(game, `MATERIAL RECOVERY: +${quantity} ${material.name}.`, {
        category: "activity"
    });

    return {
        ok: true,
        item: material,
        amount: quantity,
        total: result.amount,
        newlyDiscovered: result.newlyDiscovered
    };
}
