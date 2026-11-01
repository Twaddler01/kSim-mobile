// src/data/fabrication.js

export const fabricationRecipes = [
    {
        id: "fabricateCopperConductor",
        name: "Copper Conductor",
        description: "Form copper into a conductive component.",
        unlockId: "advancedFabrication",
        inputs: {
            copperIngot: 1,
            energy: 2
        },
        outputs: {
            copperConductor: 1
        },
        durationSeconds: 8
    },
    {
        id: "fabricateSiliconWafer",
        name: "Silicon Wafer",
        description: "Prepare silicon for precision electronics.",
        unlockId: "advancedFabrication",
        inputs: {
            silicon: 2,
            energy: 4
        },
        outputs: {
            siliconWafer: 1
        },
        durationSeconds: 10
    },
    {
        id: "fabricateCeramicInsulator",
        name: "Ceramic Insulator",
        description: "Produce an insulating ceramic component.",
        unlockId: "advancedFabrication",
        inputs: {
            silica: 3,
            energy: 3
        },
        outputs: {
            ceramicInsulator: 1
        },
        durationSeconds: 8
    },
    {
        id: "fabricateEnergyCapacitor",
        name: "Energy Capacitor",
        description: "Combine conductive and insulating materials into an energy-storage component.",
        unlockId: "advancedFabrication",
        inputs: {
            copperConductor: 2,
            ceramicInsulator: 1,
            energy: 10
        },
        outputs: {
            energyCapacitor: 1
        },
        durationSeconds: 15
    },

    // --------------------------------------------------
    // NEW TEST RECIPES
    // --------------------------------------------------
    {
        id: "fabricateConductiveAlloy",
        name: "Conductive Alloy",
        description: "Combine copper and graphite into a specialized conductive material.",
        unlockId: "advancedFabrication",
        inputs: {
            copper: 2,
            graphite: 2,
            energy: 5
        },
        outputs: {
            conductiveAlloy: 1
        },
        durationSeconds: 10
    },
    {
        id: "fabricateCeramicComposite",
        name: "Ceramic Composite",
        description: "Fuse silica and clay into a durable insulating material.",
        unlockId: "advancedFabrication",
        inputs: {
            silica: 2,
            clay: 2,
            energy: 5
        },
        outputs: {
            ceramicInsulator: 2
        },
        durationSeconds: 12
    },
    {
        id: "fabricatePhaseStableCrystal",
        name: "Phase-Stable Crystal",
        description: "Treat quartz and silicon under controlled energy to stabilize its structure.",
        unlockId: "advancedFabrication",
        inputs: {
            quartz: 3,
            silicon: 2,
            energy: 12
        },
        outputs: {
            phaseStableCrystal: 1
        },
        durationSeconds: 20
    }
];