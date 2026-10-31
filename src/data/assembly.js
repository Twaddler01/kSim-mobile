// src/data/assembly.js

export const assemblyRecipes = [
    {
        id: "assembleResonanceCore",
        name: "Resonance Core",
        description: "Combine specialized components into a functioning resonance core.",
        inputs: {
            resonanceCrystal: 2,
            copperConductor: 2,
            energyCapacitor: 1,
            energy: 25
        },
        outputs: {
            resonanceCore: 1
        },
        durationSeconds: 30,
        unique: true
    }
];