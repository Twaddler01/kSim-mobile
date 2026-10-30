export function applyEffects(game, effects = []) {
    const applied = [];

    for (const effect of effects) {
        if (!effect || typeof effect !== "object") continue;

        if (effect.type !== "resource") continue;

        const { resource, amount } = effect;

        if (
            !resource ||
            !Number.isFinite(amount) ||
            !Object.hasOwn(game.resources ?? {}, resource)
        ) {
            continue;
        }

        game.resources[resource] += amount;
        applied.push({ ...effect });
    }

    return applied;
}

export function describeEffects(effects = []) {
    return effects
        .filter(effect => effect?.type === "resource")
        .map(effect => `+${effect.amount} ${effect.resource}`)
        .join(", ");
}
