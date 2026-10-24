export const initialGameData = {
    version: 2,
    stage: 0,
    clicks: 0,
    resources: { energy: 0, particles: 0, research: 0, exoticMatter: 0 },
    upgrades: { energyYield: 0, particleStability: 0, observation: 0 },
    discoveries: [],
    log: [
        "LAB LOG 001: The quantum field generator is online. Begin with low-energy experiments.",
        "SAFETY NOTE: If the containment field starts singing, step away from the console."
    ],
    lastTick: Date.now()
};

export const resourceDefinitions = [
    { id: "energy", name: "Quantum Energy", icon: "⚡", description: "Power for experiments." },
    { id: "particles", name: "Particles", icon: "⚛️", description: "The first measurable products of the field." },
    { id: "research", name: "Research", icon: "🔬", description: "Evidence gathered from repeatable observations." },
    {
        id: "exoticMatter", name: "Exotic Matter", icon: "🌀",
        description: "An unstable substance that should not exist.",
        unlockDiscovery: "quantumAnomaly"
    }
];

export const discoveries = [
    {
        id: "fieldCalibration", name: "Field Calibration", icon: "📡",
        description: "The field generator holds a stable baseline.",
        requirement: 400, reward: { research: 2 }
    },
    {
        id: "particleFormation", name: "Particle Formation", icon: "⚛️",
        description: "Energy condenses into measurable particles.",
        requirement: 1000, reward: { particles: 3, research: 2 }
    },
    {
        id: "quantumAnomaly", name: "The Impossible Reading", icon: "🌀",
        description: "Your instruments detect matter outside known models.",
        requirement: 2000, reward: { research: 5 }
    },
    {
        id: "repeatableExperiment", name: "Repeatable Results", icon: "🧪",
        description: "The phenomenon can be reproduced under controlled conditions.",
        requirement: 3500, reward: { research: 8, particles: 4 }
    }
];

export const upgradeDefinitions = [
    {
        id: "energyYield", name: "Field Amplifier", icon: "⚡",
        description: "+1 Quantum Energy per experiment per level.",
        baseCost: { energy: 300 }, maxLevel: 5
    },
    {
        id: "particleStability", name: "Particle Stabilization", icon: "⚛️",
        description: "+5 percentage points to particle formation chance per level.",
        baseCost: { energy: 450, research: 2 }, maxLevel: 5
    },
    {
        id: "observation", name: "Improved Instrumentation", icon: "🔬",
        description: "+8 percentage points to useful research observations per level.",
        baseCost: { energy: 600, particles: 3 }, maxLevel: 5
    }
];
