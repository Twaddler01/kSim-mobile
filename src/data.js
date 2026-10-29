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
    resources: { energy: 0, particles: 0, research: 0, exoticMatter: 0 },
    upgrades: {
        energyYield: 0,
        particleStability: 0,
        observation: 0
    },
    unlockedUpgrades: ["energyYield", "particleStability"],
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
    triggered: [],
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
    inventory: {},
    operations: {
        quantumFieldUnlocked: false
    },
    manufacturing: {
        unlocked: false,
        completedRecipes: [],
        machineBuilt: false
    }
};

export const resourceDefinitions = [
    {
        id: "energy",
        name: "Quantum Energy",
        icon: "⚡",
        description: "Power for experiments."
    },
    {
        id: "particles",
        name: "Particles",
        icon: "⚛️",
        description: "The first measurable products of the field."
    },
    {
        id: "research",
        name: "Research",
        icon: "🔬",
        description: "Evidence gathered from repeatable observations."
    },
    {
        id: "exoticMatter",
        name: "Exotic Matter",
        icon: "🌀",
        description: "An unstable substance that should not exist.",
        unlockDiscovery: "quantumAnomaly"
    }
];

export const discoveries = [
    {
        id: "fieldCalibration",
        name: "Field Calibration",
        icon: "📡",
        description: "The field generator holds a stable baseline.",
        trigger: {
            type: "experimentCount",
            min: 400
        },
        effects: [{ type: "resource", resource: "research", amount: 2 }]
    },
    {
        id: "particleFormation",
        name: "Particle Formation",
        icon: "⚛️",
        description: "Energy condenses into measurable particles.",
        trigger: {
            type: "experimentCount",
            min: 1000
        },
        effects: [
            { type: "resource", resource: "particles", amount: 200 },
            { type: "resource", resource: "research", amount: 2 }
        ]
    },
    {
        id: "quantumAnomaly",
        name: "The Impossible Reading",
        icon: "🌀",
        description: "Your instruments detect matter outside known models.",
        trigger: {
            type: "experimentCount",
            min: 2000
        },
        effects: [{ type: "resource", resource: "research", amount: 5 }]
    },
    {
        id: "repeatableExperiment",
        name: "Repeatable Results",
        icon: "🧪",
        description:
            "The phenomenon can be reproduced under controlled conditions.",
        trigger: {
            type: "experimentCount",
            min: 3500
        },
        effects: [
            { type: "resource", resource: "particles", amount: 4 },
            { type: "resource", resource: "research", amount: 8 }
        ]
    },
    {
        id: "unknownEnergySource",
        name: "Unknown Energy Source",
        icon: "🌀",
        description:
            "An unidentified source is emitting energy beyond the known limits of the quantum field. Its origin and properties remain unknown.",
        hidden: true,

        trigger: {
            type: "discovery",
            id: "repeatableExperiment"
        },

        announcement: {
            title: "UNKNOWN SIGNAL DETECTED",
            message: "Unknown energy source detected."
        },

        cost: {
            research: 1000,
            exoticMatter: 5
        }
    }
];

export const upgradeDefinitions = [
    {
        id: "energyYield",
        name: "Field Amplifier",
        icon: "⚡",
        description: "+1 Quantum Energy per experiment per level.",
        baseCost: { energy: 300 },
        maxLevel: 5
    },
    {
        id: "particleStability",
        name: "Particle Stabilization",
        icon: "⚛️",
        description:
            "+5 percentage points to particle formation chance per level.",
        baseCost: { energy: 450, research: 2 },
        maxLevel: 5
    },
    {
        id: "observation",
        name: "Improved Instrumentation",
        icon: "🔬",
        description:
            "+8 percentage points to useful research observations per level.",
        baseCost: { energy: 600, particles: 3 },
        maxLevel: 5,
        trigger: {
            type: "upgradeLevel",
            upgradeIds: ["energyYield", "particleStability"],
            minLevel: 1,
            match: "any"
        },
        unlockDescription:
            "Requires at least one level of Field Amplifier or Particle Stabilization."
    }
];

export const FIELD_DEFINITIONS = [
    {
        id: "labValley",
        name: "Lab Valley",
        visualVariant: "stone",
        icon: "🪨",
        description: "Locate scattered deposits and recover raw samples.",
        unlockTrigger: null,
        spawnTable: [
            { materialId: "stone", weight: 70 },
            { materialId: "quartz", weight: 25 },
            { materialId: "copper", weight: 5 }
        ],
        richnessTable: [
            { amount: 1, weight: 80 },
            { amount: 2, weight: 15 },
            { amount: 3, weight: 4 },
            { amount: 5, weight: 1 }
        ]
    },
    {
        id: "stone",
        name: "Stone Field",
        materialId: "stone",
        visualVariant: "stone",
        icon: "🪨",
        description: "Locate stone deposits and recover raw samples.",
        unlockTrigger: null
    },
    {
        id: "quartz",
        name: "Quartz Field",
        materialId: "quartz",
        visualVariant: "crystal",
        icon: "💎",
        description: "A crystalline mineral suitable for processing.",
        unlockTrigger: null
    },
    {
        id: "copper",
        name: "Copper Field",
        materialId: "copper",
        visualVariant: "ore",
        icon: "🟠",
        description: "Locate Copper nodes and recover raw samples.",
        unlockTrigger: {
            type: "inventoryAmount",
            item: "stone",
            amount: 10
        }
    },
    {
        id: "silicon",
        name: "Silicon Field",
        materialId: "silicon",
        visualVariant: "crystal",
        icon: "🔹",
        description: "Locate Silicon nodes and recover mineral samples.",
        unlockTrigger: {
            type: "inventoryAmount",
            item: "copper",
            amount: 12
        }
    }
];

export const RefinementRecipes = [
    {
        id: "crushQuartz",
        name: "Crush Quartz",
        input: { quartz: 3 },
        output: { quartzPowder: 2 },
        method: "crushing",
        durationSeconds: 2,
        unlockLevel: 1
    },
    {
        id: "makeGlass",
        name: "Melt Silica",
        input: { silica: 4 },
        output: { glass: 2 },
        method: "smelting",
        durationSeconds: 5,
        powerRequired: 0,
        heatRequired: 1,
        unlockLevel: 1
    },
    {
        id: "smeltCopper",
        name: "Smelt Copper Ore",
        input: { copper: 3 },
        output: { copperIngot: 1 },
        method: "smelting",
        durationSeconds: 6,
        powerRequired: 0,
        heatRequired: 1,
        unlockLevel: 2
    },
    {
        id: "refineLithium",
        name: "Refine Lithium Compound",
        input: { lithiumOre: 4 },
        output: { lithiumCompound: 1 },
        method: "chemical",
        durationSeconds: 12,
        powerRequired: 2,
        reagentRequired: {
            sulfurReagent: 1
        },
        unlockLevel: 3
    }
];
