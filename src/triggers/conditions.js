/**
 * Shared, side-effect-free trigger condition evaluator.
 *
 * Returns true when a condition is satisfied.
 * Does not change game state or execute effects.
 */
export function evaluateTrigger(game, trigger) {
    if (!game || !trigger) return false;

    switch (trigger.type) {
        case "discovery":
            return (game.discoveries ?? []).includes(trigger.id);

        case "inventoryAmount":
            if (!trigger.item) return false;

            return (
                (game.inventory?.[trigger.item] ?? 0) >= (trigger.amount ?? 0)
            );

        case "upgradeLevel": {
            const ids = trigger.upgradeIds ?? [];

            if (ids.length === 0) return false;

            const minLevel = trigger.minLevel ?? 1;
            const matches = ids.map(
                id => (game.upgrades?.[id] ?? 0) >= minLevel
            );

            return trigger.match === "all"
                ? matches.every(Boolean)
                : matches.some(Boolean);
        }

        case "experimentCount":
            return (game.clicks ?? 0) >= (trigger.min ?? 0);

        case "resourceAmount":
            if (!trigger.resource) return false;

            return (
                (game.resources?.[trigger.resource] ?? 0) >=
                (trigger.amount ?? 0)
            );

        case "planProgress": {
            const planState = game.plan?.formulas?.[trigger.planId];

            if (!planState) return false;

            return (
                (planState.revealed ?? []).length >=
                (trigger.tilesRevealed ?? 0)
            );
        }

        case "planComplete": {
            const planState = game.plan?.formulas?.[trigger.planId];

            return planState?.completed === true;
        }

        default:
            // Unknown conditions must not accidentally unlock content.
            return false;
    }
}
