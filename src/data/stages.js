// src/data/stages.js
//
// Stage spine for the Lab. Each stage is one primary objective that
// pulls the whole game forward. Requirements are checked against
// game.inventory and game.discoveries after every refreshUI().

export const stageDefinitions = [
    {
        id: 1,
        name: "Baseline Calibration",
        shortName: "Baseline",
        objective: "Establish a baseline field reading.",
        flavor:
            "The generator is online but its output is not yet usable. " +
            "We need to know what it's doing before we can change it.",
        requirements: {
            inventory: { stone: 20, quartz: 10, copper: 3 }
        },
        cass: "Facility online. The generator is quiet. We need to change that.",
        originEntry: {
            title: "ORIGIN LOG — 01",
            body:
                "Facility designation kSim-01. Status: operational.\n\n" +
                "The generator produces a measurable field effect. We do " +
                "not know why, or what the field is interacting with. The " +
                "prior team left equipment but no notes.\n\n" +
                "Procedure: gather materials. Stabilize. Observe."
        },
        completion: {
            title: "BASELINE ESTABLISHED",
            message:
                "Field output is now measurable. CASS has begun analysis."
        }
    },
    {
        // Stage 2 — schema only. Content TBD after playing stage 1.
        id: 2,
        name: "Amplify",
        shortName: "Amplify",
        objective: "Bring the field amplitude to 3× baseline.",
        flavor:
            "The field is producing output. We didn't design that. " +
            "We should figure out what it's doing.",
        requirements: {
            inventory: { silicon: 5, copperIngot: 5 }
        },
        cass: "The field is louder now. Something might be listening.",
        originEntry: {
            title: "ORIGIN LOG — 02",
            body:
                "Amplitude increased. The generator's output no longer " +
                "matches our input. CASS notes that the deviation is " +
                "structured — not noise."
        },
        completion: {
            title: "FIELD AMPLIFIED",
            message: "Signal strength is increasing. Analysis continuing."
        }
    }
    // Stages 3–5 will follow the same shape once stage 1–2 are played.
];

// --------------------------------------------------
// STAGE LOOKUP + ADVANCEMENT
// --------------------------------------------------

export function getCurrentStage(game) {
    const id = game?.progression?.currentStage ?? 1;
    return stageDefinitions.find(s => s.id === id) ?? null;
}

export function getCompletedStages(game) {
    const id = game?.progression?.currentStage ?? 1;
    return stageDefinitions.filter(s => s.id < id);
}

export function getStageEntriesVisible(game) {
    const id = game?.progression?.currentStage ?? 1;
    return stageDefinitions.filter(s => s.id <= id && s.originEntry);
}

/**
 * Returns { met, progress: { [key]: { have, need } }, complete }.
 * "complete" = no requirements left. "met" = all requirements satisfied.
 */
export function checkRequirements(game, stage) {
    if (!stage?.requirements?.inventory) {
        return { met: true, progress: {}, complete: true };
    }

    const progress = {};
    let met = true;

    for (const [itemId, need] of Object.entries(stage.requirements.inventory)) {
        const have = game.inventory?.[itemId] ?? 0;
        progress[itemId] = { have, need };
        if (have < need) met = false;
    }

    return { met, progress, complete: Object.keys(progress).length === 0 };
}

/**
 * Idempotent. If the current stage's requirements are met, advances
 * to the next stage. Returns { advanced: boolean, from, to }.
 *
 * Callers are responsible for saving + showing a toast when
 * `advanced` is true.
 */
export function tryAdvanceStage(game) {
    const current = getCurrentStage(game);
    if (!current) return { advanced: false };

    const { met } = checkRequirements(game, current);
    if (!met) return { advanced: false };

    const next = stageDefinitions.find(s => s.id === current.id + 1);

    game.progression ??= { currentStage: 1 };
    game.progression.currentStage = current.id + 1;

    return { advanced: true, from: current, to: next };
}