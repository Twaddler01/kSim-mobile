/*
 * TODO — Stage 3B: Effects-based unlocks
 *
 * Future work:
 * - Allow discovery effects to unlock equipment/upgrades.
 * - Route unlocks through the shared effects processor.
 * - Preserve existing LAB LOG and EQUIPMENT notifications,
 *   unread indicators, and equipment links.
 * - Test both discovery-triggered and condition-triggered unlocks.
 *
 * Resume with: "Resume kSim-mobile Stage 3B."
 */

export const initialGameData = {
    version: 2,
    stage: 0,
    clicks: 0,
    inventory: {
        energy: 0,
        particles: 0,
        research: 0,
        exoticMatter: 0
    },
    upgrades: {
        energyYield: 0,
        particleStability: 0,
        observation: 0
    },
    discoveries: [],
    log: [
        {
            id: 1,
            message:
                "LAB LOG 001: The quantum field generator is online. Begin with low-energy experiments.",
            category: "important",
            tab: "log",
            timestamp: Date.now()
        },
        {
            id: 2,
            message:
                "SAFETY NOTE: If the containment field starts singing, step away from the console.",
            category: "important",
            tab: "log",
            timestamp: Date.now()
        }
    ],
    events: {},
    logOnce: {},
    lastTick: Date.now(),
    logSequence: 2,
    tabReadIds: {
        log: 0,
        observations: 0,
        equipment: 0
    },
    unread: {
        items: {
            observations: [],
            equipment: [],
            log: [1, 2]
        },
        pending: {
            observations: [],
            equipment: [],
            log: []
        }
    },
    unlocks: {},
    appState: {
        navigation: {
            activeFieldId: null
        }
    },
    operations: {
        quantumFieldUnlocked: false
    }
};
