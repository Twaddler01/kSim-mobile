
import { gatherMaterial } from "./SynthesisEngine.js";
import { materials } from "../data/materials.js";
import { MaterialDropTable } from "../data.js";

const DEFAULT_TARGET = "copper";

export function getRecoveryTarget(game) {
    game.materialRecovery ??= {};
    game.materialRecovery.currentTarget ??= DEFAULT_TARGET;

    const target = materials.find(
        item => item.id === game.materialRecovery.currentTarget
    );

    // Recover safely if a saved target no longer exists.
    if (!target) {
        game.materialRecovery.currentTarget = DEFAULT_TARGET;

        return materials.find(
            item => item.id === DEFAULT_TARGET
        );
    }

    return target;
}


export function selectRandomRecoveryTarget(game) {
    const candidates = materials.filter(
        item => item.category === "raw"
    );

    if (candidates.length === 0) {
        return getRecoveryTarget(game);
    }

    const currentId = getRecoveryTarget(game).id;

    // Prefer a different material, if the pool has alternatives.
    const alternatives = candidates.filter(
        item => item.id !== currentId
    );

    const pool = alternatives.length > 0 ? alternatives : candidates;
    const target = pool[Math.floor(Math.random() * pool.length)];

    game.materialRecovery.currentTarget = target.id;

    return target;
}

export function recoverMaterial(game, materialId = null, amount = 1) {
    const targetId = materialId ?? getRecoveryTarget(game).id;
    const result = gatherMaterial(game, targetId, amount);

    if (!result.ok) {
        return {
            ...result,
            unlockedQuantumField: false
        };
    }

    game.operations ??= {};

    let unlockedQuantumField = false;

    if (
        targetId === "copper" &&
        !game.operations.quantumFieldUnlocked &&
        result.total >= 5
    ) {
        game.operations.quantumFieldUnlocked = true;
        unlockedQuantumField = true;
    }

    return {
        ...result,
        unlockedQuantumField
    };
}
