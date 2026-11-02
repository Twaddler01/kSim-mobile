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
