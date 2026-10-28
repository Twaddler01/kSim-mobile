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
    announcement: null,
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

export const MaterialDropTable = [
    { id: "copper", chance: 0.12 },
    { id: "silicon", chance: 0.10 },
    { id: "silica", chance: 0.09 },
    { id: "aluminum", chance: 0.08 }
];

export const FIELD_DEFINITIONS = [
    {
        id: "copper",
        name: "Copper Field",
        materialId: "copper",
        description: "Locate Copper nodes and recover raw samples.",
        unlockTrigger: null
    },
    {
        id: "silicon",
        name: "Silicon Field",
        materialId: "silicon",
        description: "Locate Silicon nodes and recover mineral samples.",
        unlockTrigger: {
            type: "inventoryAmount",
            item: "copper",
            amount: 30
        }
    }
];


export const MaterialTable = [
    // LEVEL 1 — Basic minerals and feedstocks
    {
        id: "quartz",
        level: 1,
        category: "mineral",
        fieldId: "quartz",
        chance: 0.30
    },
    {
        id: "silica",
        level: 1,
        category: "mineral",
        fieldId: "quartz",
        chance: 0.20
    },
    {
        id: "graphite",
        level: 1,
        category: "mineral",
        fieldId: "carbon",
        chance: 0.16
    },
    {
        id: "clay",
        level: 1,
        category: "mineral",
        fieldId: "surface",
        chance: 0.20
    },
    {
        id: "sulfur",
        level: 1,
        category: "mineral",
        fieldId: "sulfur",
        chance: 0.12
    },
    {
        id: "ironOre",
        level: 1,
        category: "ore",
        fieldId: "iron",
        chance: 0.12
    },

    // LEVEL 2 — Industrial materials
    {
        id: "copper",
        level: 2,
        category: "ore",
        fieldId: "copper",
        chance: 0.22
    },
    {
        id: "bauxite",
        level: 2,
        category: "ore",
        fieldId: "aluminum",
        chance: 0.12
    },
    {
        id: "nickelOre",
        level: 2,
        category: "ore",
        fieldId: "nickel",
        chance: 0.08
    },
    {
        id: "zincOre",
        level: 2,
        category: "ore",
        fieldId: "zinc",
        chance: 0.10
    },

    // LEVEL 3 — Advanced materials
    {
        id: "lithiumOre",
        level: 3,
        category: "ore",
        fieldId: "lithium",
        chance: 0.08
    },
    {
        id: "cobaltOre",
        level: 3,
        category: "ore",
        fieldId: "cobalt",
        chance: 0.06
    },
    {
        id: "titaniumOre",
        level: 3,
        category: "ore",
        fieldId: "titanium",
        chance: 0.05
    },
    {
        id: "rareEarthOre",
        level: 3,
        category: "ore",
        fieldId: "rareEarth",
        chance: 0.04
    },

    // LEVEL 4 — Exotic feedstocks
    {
        id: "tungstenOre",
        level: 4,
        category: "ore",
        fieldId: "tungsten",
        chance: 0.035
    },
    {
        id: "tantalumOre",
        level: 4,
        category: "ore",
        fieldId: "tantalum",
        chance: 0.025
    },
    {
        id: "platinumOre",
        level: 4,
        category: "ore",
        fieldId: "deepRock",
        chance: 0.015
    },
    {
        id: "meteoriteFragment",
        level: 4,
        category: "anomalous",
        fieldId: "meteorSite",
        chance: 0.02
    },

    // LEVEL 5 — Speculative discoveries
    {
        id: "unstableIsotope",
        level: 5,
        category: "anomalous",
        fieldId: "meteorSite",
        chance: 0.01
    },
    {
        id: "anomalousCrystal",
        level: 5,
        category: "anomalous",
        fieldId: "anomalyZone",
        chance: 0.005
    },
    {
        id: "quantumParticleTrace",
        level: 5,
        category: "discovery",
        fieldId: "anomalyZone",
        chance: 0.002
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
