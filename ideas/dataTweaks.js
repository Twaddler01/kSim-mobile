
// fields.js
export const FIELD_DEFINITIONS = [
    {
        id: "labValley",
        name: "Lab Valley",
        visualVariant: "stone",
        icon: "🪨",
        description: "Locate scattered deposits and recover raw samples.",
        unlockTrigger: null,

        // --- world / spawn tuning ---
        depositCount: 10,
        respawnSeconds: 3,
        world: { width: 1200, height: 900 },
        // margin from world edge where deposits can spawn
        margin: 80,
        // minimum spacing between initial deposits
        minSpacing: 100,

        // --- content tables ---
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
        ],

        // --- optional per-field overrides (null = derive from material + code default) ---
        strikeCountTable: null,      // e.g. [{ richness: 1, strikes: 2 }, ...]
        sparkleTable: null,          // e.g. [{ richness: 1, tier: 0 }, ...]

        // --- future ---
        mineTimeMultiplier: 1.0,     // tool/upgrade scaling hook
        growthSpots: null            // vein expansion rules
    },
    // ...
];


// materials.js
const materials = [
    {
        id: "stone",
        name: "Stone Sample",
        category: "raw",
        subtype: "mineral",
        tier: 1,
        icon: "🪨",
        description: "A rough fragment of common stone recovered from the field.",
    
        mining: {
            strikesBase: 2,     // base strikes at richness 1, no tool bonus
            sparkleBase: 0      // base sparkle tier (0–3) — stone is dull
        }
    
        // field: { id, dropChance }   ← DELETE — dead, superseded by spawnTable
    },
    {
        id: "quartz",
        // ...
        mining: {
            strikesBase: 3,     // harder than stone
            sparkleBase: 2      // naturally sparkly
        }
    },
    {
        id: "tungstenOre",
        // ...
        mining: {
            strikesBase: 6,     // very hard
            sparkleBase: 0
        }
    }
];


// TODO
export const GAME_CONFIG = {
    player: {
        speed: 200,
        radius: 22
    },
    canvas: {
        spriteSize: 60,
        tapThreshold: 10,
        strikeReach: 12,
        tapHitRadius: 1.6
    },
    sparkle: {
        // tier → mote count; index = tier
        moteCounts: [0, 2, 3, 5],
        orbitSpeedRange: [0.35, 0.80],
        twinkleSpeedRange: [1.8, 4.0],
        sizeRange: [1.4, 3.0]
    }
};