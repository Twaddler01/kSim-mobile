// src/data/refinement.js

export const refinementRecipes = [
    {
        id: "crushQuartz",
        name: "Crush Quartz",
        description: "Break quartz into a fine powder for further processing.",
        inputs: {
            quartz: 3,
            energy: 2
        },
        outputs: {
            quartzPowder: 2
        },
        durationSeconds: 2
    },
    {
        id: "makeGlass",
        name: "Produce Glass",
        description: "Heat silica into a stable glass material.",
        inputs: {
            silica: 4,
            energy: 3
        },
        outputs: {
            glass: 2
        },
        durationSeconds: 5
    },
    {
        id: "smeltCopper",
        name: "Smelt Copper",
        description: "Extract usable copper ingots from raw copper.",
        inputs: {
            copper: 3,
            energy: 3
        },
        outputs: {
            copperIngot: 1
        },
        durationSeconds: 4
    }
];