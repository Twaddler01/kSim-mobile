// src/data/fabrication.js

export const fabricationRecipes = [
    {
        id: "fabricateCopperConductor",
        name: "Copper Conductor",
        description: "Form copper into a conductive component.",
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
        inputs: {
            copperConductor: 2,
            ceramicInsulator: 1,
            energy: 10
        },
        outputs: {
            energyCapacitor: 1
        },
        durationSeconds: 15
    }
];