import { discoveries, upgradeDefinitions } from "./data.js";
import { evaluateTrigger } from "./triggers/conditions.js";
import { applyEffects, describeEffects } from "./triggers/effects.js";

export function formatNumber(value) {
    return new Intl.NumberFormat(undefined, {
        maximumFractionDigits: value < 10 ? 1 : 0
    }).format(value || 0);
}

/* 
CURRENT BADGE SYSTEM:
Log entry with NEW observations → OBSERVATIONS
Log entry with NEW UNLOCKED equipment → EQUIPMENT
Any "important" log entry → LAB LOG
Any "activity" lpg entry → no badge.
*/

export function addLog(
    game,
    message,
    {
        category = "activity",
        tab = "log",
        onUnread = () => {},
        contentId = null,
        notificationTargets = null,
        link = null,
        onceKey = null
    } = {}
) {
    if (typeof message !== "string" || !message.trim()) {
        console.warn("Ignored empty log entry:", {
            message,
            category,
            tab
        });
        return null;
    }

    game.log ??= [];
    game.logSequence ??= Math.max(0, ...game.log.map(entry => entry.id ?? 0));
    game.logOnce ??= {};

    const alreadyLogged = onceKey != null && game.logOnce[onceKey];

    const effectiveCategory = alreadyLogged ? "activity" : category;

    if (onceKey != null) {
        game.logOnce[onceKey] = true;
    }

    const id = ++game.logSequence;

    game.log.unshift({
        id,
        message,
        category: effectiveCategory,
        tab,
        timestamp: Date.now(),
        ...(link ? { link } : {})
    });

    game.log = game.log.slice(0, 60);

    // Explicit targets notify their own tabs independently of log category.
    if (notificationTargets) {
        for (const target of notificationTargets) {
            if (target.tab === "log") continue;

            onUnread(target.tab, target.itemId ?? id);
        }
    } else if (
        ["observations", "equipment"].includes(tab) &&
        contentId != null
    ) {
        // Preserve the default dedicated-tab behavior.
        onUnread(tab, contentId);
    }

    // Only important messages create LAB LOG badges.
    if (effectiveCategory === "important") {
        const explicitlyTargetsLog =
            notificationTargets?.some(target => target.tab === "log") ?? false;

        if (!explicitlyTargetsLog) {
            onUnread("log", id);
        } else {
            onUnread(
                "log",
                notificationTargets.find(target => target.tab === "log")
                    ?.itemId ?? id
            );
        }
    }

    return id;
}

function notifyUpgradeUnlocked(game, definition, onUnread = () => {}) {
    addLog(
        game,
        `NEW EQUIPMENT UNLOCKED: ${definition.name} is now available.`,
        {
            category: "activity",
            tab: "equipment",
            onUnread,
            notificationTargets: [{ tab: "equipment", itemId: definition.id }],
            link: {
                tab: "equipment",
                itemId: definition.id,
                label: definition.name
            }
        }
    );
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

export function checkDiscoveries(game, onUnread = () => {}) {
    // Unlock ordinary observations through experiment milestones.
    for (const discovery of discoveries) {
        if (discovery.hidden) continue;

        if (
            game.discoveries.includes(discovery.id) ||
            !evaluateTrigger(game, discovery.trigger)
        ) {
            continue;
        }

        game.discoveries.push(discovery.id);

        const appliedEffects = applyEffects(game, discovery.effects);
        const rewardText = describeEffects(appliedEffects);

        addLog(
            game,
            `DISCOVERY: ${discovery.name}${
                rewardText ? ` (${rewardText})` : ""
            }.`,
            {
                category: "activity",
                tab: "observations",
                onUnread,
                contentId: discovery.id,
                notificationTargets: [
                    { tab: "observations", itemId: discovery.id }
                ],
                link: {
                    tab: "observations",
                    itemId: discovery.id,
                    label: discovery.name
                }
            }
        );

        for (const effect of appliedEffects) {
            if (effect.type !== "unlockUpgrade") continue;

            const definition = upgradeDefinitions.find(
                item => item.id === effect.upgradeId
            );

            if (definition) {
                notifyUpgradeUnlocked(game, definition, onUnread);
            }
        }
    }

    // Process event-triggered observations.
    game.triggered ??= [];

    for (const observation of discoveries) {
        if (!observation.hidden) continue;
        if (game.triggered.includes(observation.id)) continue;

        const trigger = observation.trigger;

        if (evaluateTrigger(game, trigger)) {
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

                {
                    category: "activity",
                    tab: "observations",
                    onUnread,
                    contentId: observation.id,
                    notificationTargets: [
                        { tab: "observations", itemId: observation.id }
                    ],
                    link: {
                        tab: "observations",
                        itemId: observation.id,
                        label: observation.name
                    }
                }
            );
        }
    }
}

export function stir(game, multiplier = 1, onUnread = () => {}) {
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
        checkDiscoveries(game, onUnread);
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

        // Anomaly: important, so it defaults to the LOG badge.
        const anomalyMessage = `ANOMALY: Exotic matter detected (${result.exoticMatter}). The reading is inconsistent with known physics.`;
        addLog(game, anomalyMessage, {
            category: "important",
            onceKey: "anomaly",
            onUnread
        });
    }
    return result;
}

export function checkUpgradeUnlocks(
    game,
    onUnread = () => {},
    { notify = true } = {}
) {
    game.unlockedUpgrades ??= [];

    const newlyUnlocked = [];

    for (const definition of upgradeDefinitions) {
        if (game.unlockedUpgrades.includes(definition.id)) {
            continue;
        }

        const condition = definition.trigger;

        // Equipment without a condition is available by default.
        if (!condition) {
            game.unlockedUpgrades.push(definition.id);
            continue;
        }

        const satisfied = evaluateTrigger(game, condition);
        if (!satisfied) continue;

        const appliedEffects = applyEffects(game, [
            {
                type: "unlockUpgrade",
                upgradeId: definition.id
            }
        ]);

        if (appliedEffects.length === 0) continue;

        newlyUnlocked.push(definition.id);

        if (notify) {
            notifyUpgradeUnlocked(game, definition, onUnread);
        }
    }

    return newlyUnlocked;
}

export function buyUpgrade(game, id, onUnread = () => {}) {
    const definition = upgradeDefinitions.find(item => item.id === id);
    if (!definition) return false;
    const level = game.upgrades[id] ?? 0;
    if (level >= definition.maxLevel) return false;
    if (!payCost(game, upgradeCost(definition, level))) return false;

    game.upgrades[id] = level + 1;

    const purchaseMessage = `EQUIPMENT UPDATED: ${definition.name} is now level ${level + 1}.`;
    // Equipment purchase: activity, so no badge.
    addLog(game, purchaseMessage);
    checkUpgradeUnlocks(game, onUnread);
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

    const conversionMessage = `RESOURCE CONVERSION: Consumed ${particles} particles for +${energy} Quantum Energy.`;
    // Resource conversion: activity, so no badge.
    addLog(game, conversionMessage);

    return { particles, energy };
}
