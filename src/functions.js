import { discoveries, upgradeDefinitions } from "./data.js";

export function formatNumber(value) {
    return new Intl.NumberFormat(undefined, {
        maximumFractionDigits: value < 10 ? 1 : 0
    }).format(value || 0);
}

export function addLog(game, message, category = "activity") {
    game.log ??= [];

    game.log.unshift({
        message,
        category,
        timestamp: Date.now()
    });

    game.log = game.log.slice(0, 60);
}

export function canAfford(game, cost) {
    return Object.entries(cost).every(
        ([resource, amount]) => (game.resources[resource] ?? 0) >= amount
    );
}

export function payCost(game, cost) {
    if (!canAfford(game, cost)) return false;
    for (const [resource, amount] of Object.entries(cost)) {
        game.resources[resource] -= amount;
    }
    return true;
}

export function upgradeCost(definition, level) {
    const cost = {};
    for (const [resource, amount] of Object.entries(definition.baseCost)) {
        cost[resource] = Math.ceil(amount * Math.pow(1.65, level));
    }
    return cost;
}

export function checkDiscoveries(game) {
    // Unlock ordinary observations through experiment milestones.
    for (const discovery of discoveries) {
        if (discovery.hidden) continue;

        if (
            game.discoveries.includes(discovery.id) ||
            game.clicks < discovery.requirement
        ) {
            continue;
        }

        game.discoveries.push(discovery.id);

        for (const [resource, amount] of Object.entries(
            discovery.reward ?? {}
        )) {
            game.resources[resource] = (game.resources[resource] ?? 0) + amount;
        }

        const rewardText = Object.entries(discovery.reward ?? {})
            .map(([resource, amount]) => `+${amount} ${resource}`)
            .join(", ");

        addLog(
            game,
            `DISCOVERY: ${discovery.name}${
                rewardText ? ` (${rewardText})` : ""
            }.`,
            "important"
        );
    }

    // Process event-triggered observations.
    game.triggered ??= [];

    for (const observation of discoveries) {
        if (!observation.hidden) continue;
        if (game.triggered.includes(observation.id)) continue;

        const trigger = observation.trigger;

        if (
            trigger?.type === "discovery" &&
            game.discoveries.includes(trigger.id)
        ) {
            game.triggered.push(observation.id);

            game.announcement = {
                id: observation.id,
                ...observation.announcement
            };

            addLog(
                game,
                `ALERT: ${
                    observation.announcement?.message ?? observation.name
                }`,
                "important"
            );
        }
    }
}

export function stir(game, multiplier = 1) {
    const result = {
        energy: 0,
        particles: 0,
        research: 0,
        exoticMatter: 0,
        events: []
    };
    const experiments = Math.max(1, Math.floor(Number(multiplier) || 1));
    const energyPerExperiment = 1 + (game.upgrades.energyYield ?? 0);
    const particleChance = Math.min(
        0.65,
        0.25 + (game.upgrades.particleStability ?? 0) * 0.05
    );

    const researchChance = Math.min(
        0.6,
        0.08 + (game.upgrades.observation ?? 0) * 0.08
    );
    for (let i = 0; i < experiments; i++) {
        game.clicks += 1;
        game.resources.energy += energyPerExperiment;
        result.energy += energyPerExperiment;

        if (Math.random() < particleChance) {
            game.resources.particles += 1;
            result.particles += 1;
        }
        if (Math.random() < researchChance) {
            game.resources.research += 1;
            result.research += 1;
        }

        // Check milestones before evaluating the anomaly event for the next experiment.
        checkDiscoveries(game);
        if (
            game.discoveries.includes("quantumAnomaly") &&
            Math.random() < 0.03
        ) {
            game.resources.exoticMatter += 1;
            result.exoticMatter += 1;
        }
    }

    if (result.particles)
        result.events.push(`Particle formation: +${result.particles}`);
    if (result.research)
        result.events.push(`Useful observations: +${result.research}`);
    if (result.exoticMatter) {
        result.events.push(`ANOMALY: +${result.exoticMatter} Exotic Matter`);
        addLog(
            game,
            `ANOMALY: Exotic matter detected (${result.exoticMatter}). The reading is inconsistent with known physics.`,
            "important"
        );
    }
    return result;
}

export function buyUpgrade(game, id) {
    const definition = upgradeDefinitions.find(item => item.id === id);
    if (!definition) return false;
    const level = game.upgrades[id] ?? 0;
    if (level >= definition.maxLevel) return false;
    if (!payCost(game, upgradeCost(definition, level))) return false;

    game.upgrades[id] = level + 1;
    addLog(
        game,
        `EQUIPMENT UPDATED: ${definition.name} is now level ${level + 1}.`,
        "important"
    );
    return true;
}

export function costLabel(cost, resourceDefinitions = []) {
    const names = Object.fromEntries(
        resourceDefinitions.map(item => [item.id, item.name])
    );
    return Object.entries(cost)
        .map(
            ([resource, amount]) =>
                `${formatNumber(amount)} ${names[resource] ?? resource}`
        )
        .join(" · ");
}

export function consumeParticles(game) {
    const particles = Math.floor(game.resources.particles ?? 0);

    if (particles <= 0) {
        return { particles: 0, energy: 0 };
    }

    const energy = particles * 5;

    game.resources.particles -= particles;
    game.resources.energy += energy;

    addLog(
        game,
        `RESOURCE CONVERSION: Consumed ${particles} particles for +${energy} Quantum Energy.`
    );

    return { particles, energy };
}
