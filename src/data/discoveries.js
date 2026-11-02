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
