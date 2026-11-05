export const FIELD_DEFINITIONS = [
    {
        id: "labValley",
        name: "Lab Valley",
        visualVariant: "stone",
        icon: "🪨",
        description: "Locate scattered deposits and recover raw samples.",
        unlockTrigger: null,

        // --- world / spawn tuning (defaults shown; omit to use these) ---
        background: {
            tileset: "grassland",
            tileSize: 40,
            baseColor: "#2d3d2a",
            patchScale: 1.6, // tiles drawn at 1.6× cell size
            baseTiles: [
                { tile: "grassA", weight: 60 },
                { tile: "grassB", weight: 40 }
            ],
            scatter: [
                { tile: "flowers", weight: 5 },
                { tile: "smallRock", weight: 2 }
            ],
            scatterDensity: 0.12 // ~12% of cells get a scatter item
        },
        depositCount: 10,
        respawnSeconds: 3,
        world: { width: 1200, height: 900 },
        margin: 80, // distance from world edge where deposits can spawn
        minSpacing: 100, // minimum distance between initial deposits
        depositRadius: 22, // collider + base draw radius

        // --- optional per-field overrides (null = use material + code default) ---
        strikeCountTable: null, // e.g. [{ richness: 3, strikes: 5 }]
        sparkleTable: null, // e.g. [{ richness: 2, tier: 2 }]

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
        id: "labBorderlamds",
        name: "Lab Borderlamds",
        materialId: "stone",
        visualVariant: "stone",
        icon: "🪨",
        description:
            "Further away from home -- a little less safe? There appears to be a better sample selection here.",
        unlockTrigger: null,
        spawnTable: [
            { materialId: "stone", weight: 50 },
            { materialId: "quartz", weight: 20 },
            { materialId: "copper", weight: 15 },
            { materialId: "silica", weight: 15 }
        ],
        richnessTable: [
            { amount: 1, weight: 45 },
            { amount: 2, weight: 25 },
            { amount: 3, weight: 15 },
            { amount: 5, weight: 15 }
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
        spawnTable: [{ materialId: "quartz", weight: 100 }],
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
        spawnTable: [{ materialId: "copper", weight: 100 }],
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
        spawnTable: [{ materialId: "silicon", weight: 100 }],
        richnessTable: [
            { amount: 1, weight: 80 },
            { amount: 2, weight: 15 },
            { amount: 3, weight: 4 },
            { amount: 5, weight: 1 }
        ]
    }
];

export function getFieldIconMaterialId(field) {
    if (!field) return null;

    // Explicit identity wins — useful for mixed fields with a
    // thematic flagship material.
    if (field.materialId) return field.materialId;

    // Otherwise: dominant spawn weight.
    const spawn = [...(field.spawnTable ?? [])]
        .filter(e => e.weight > 0)
        .sort((a, b) => b.weight - a.weight)[0];

    return spawn?.materialId ?? null;
}

export function getFieldSpawnBreakdown(field) {
    const table = field?.spawnTable ?? [];
    const total = table.reduce((s, e) => s + (e.weight > 0 ? e.weight : 0), 0);
    if (total <= 0) return [];

    return table
        .filter(e => e.weight > 0)
        .map(e => ({
            materialId: e.materialId,
            weight: e.weight,
            percent: (e.weight / total) * 100
        }))
        .sort((a, b) => b.weight - a.weight);
}
