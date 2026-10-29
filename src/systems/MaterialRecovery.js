import { gatherMaterial } from "./MaterialGathering.js";

export function recoverMaterial(game, materialId = "copper", amount = 1) {
    return gatherMaterial(game, materialId ?? "copper", amount);
}
