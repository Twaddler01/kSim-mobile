/**
 * Applies data-driven effects to game state.
 *
 * Conditions determine when an event occurs.
 * Effects determine what changes when it occurs.
 */
export function applyEffects(game, effects = []) {
    const applied = [];

    for (const effect of effects) {
        if (!effect || typeof effect !== "object") continue;

        switch (effect.type) {
            case "resource": {
                const { resource, amount } = effect;

                if (
                    !resource ||
                    !Number.isFinite(amount) ||
                    !Object.hasOwn(game.resources, resource)
                ) {
                    break;
                }

                game.resources[resource] += amount;

                applied.push({
                    ...effect,
                    amount
                });

                break;
            }

            default:
                // Unsupported effects must not change game state.
                break;
        }
    }

    return applied;
}

/**
 * Creates a readable summary of resource effects for log messages.
 */
export function describeEffects(effects = []) {
    return effects
        .filter(effect => effect?.type === "resource")
        .map(effect => `+${effect.amount} ${effect.resource}`)
        .join(", ");
}
