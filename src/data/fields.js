export const FIELD_DEFINITIONS = [
    {
        id: "labValley",
        name: "Lab Valley",
        visualVariant: "stone",
        icon: "🪨",
        description: "Locate scattered deposits and recover raw samples.",
        unlockTrigger: null,
    
        // --- world / spawn tuning (defaults shown; omit to use these) ---
        depositCount: 10,
        respawnSeconds: 3,
        world: { width: 1200, height: 900 },
        margin: 80,          // distance from world edge where deposits can spawn
        minSpacing: 100,     // minimum distance between initial deposits
        depositRadius: 22,   // collider + base draw radius
    
        // --- optional per-field overrides (null = use material + code default) ---
        strikeCountTable: null,   // e.g. [{ richness: 3, strikes: 5 }]
        sparkleTable: null,       // e.g. [{ richness: 2, tier: 2 }]
    
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
        unlockTrigger: null,
        spawnTable: [
            { materialId: "stone", weight: 100 }
        ],
        richnessTable: [
            { amount: 1, weight: 80 },
            { amount: 2, weight: 15 },
            { amount: 3, weight: 4 },
            { amount: 5, weight: 1 }
        ]
    },
    {
        id: "quartz",
        name: "Quartz Field",
        materialId: "quartz",
        visualVariant: "crystal",
        icon: "💎",
        description: "A crystalline mineral suitable for processing.",
        unlockTrigger: null,
        spawnTable: [
            { materialId: "quartz", weight: 100 }
        ],
        richnessTable: [
            { amount: 1, weight: 80 },
            { amount: 2, weight: 15 },
            { amount: 3, weight: 4 },
            { amount: 5, weight: 1 }
        ]
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
        },
        spawnTable: [
            { materialId: "copper", weight: 100 }
        ],
        richnessTable: [
            { amount: 1, weight: 80 },
            { amount: 2, weight: 15 },
            { amount: 3, weight: 4 },
            { amount: 5, weight: 1 }
        ]
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
        },
        spawnTable: [
            { materialId: "silicon", weight: 100 }
        ],
        richnessTable: [
            { amount: 1, weight: 80 },
            { amount: 2, weight: 15 },
            { amount: 3, weight: 4 },
            { amount: 5, weight: 1 }
        ]
    }
];
