I like that direction. It gives us a clean separation between what exists, what the player has discovered, and what the player is allowed to do.

I would avoid making inventory discovery responsible for recipe progression. Instead, recipes should derive their visibility and availability from two independent things:

* Progression unlock — has the game reached the point where this recipe is allowed to be used?

* Ingredient discovery — has the player discovered every item required by the recipe?

That gives us a useful distinction:

* A recipe can be progression-locked even if all its ingredients are known.

* A recipe can be progression-unlocked but still ingredient-locked.

* A recipe can be fully available when both conditions are satisfied.

And importantly, having enough ingredients to craft something is a separate check. Discovery doesn't mean ownership.

### The three independent systems

I'd keep the responsibilities separate:

| System      | Stores                 | Example                    |
| ----------- | ---------------------- | -------------------------- |
| Inventory   | Quantities owned       | 3 Quartz                   |
| Discovery   | Items ever encountered | Quartz discovered          |
| Progression | Explicit game unlocks  | Refinement system unlocked |

Recipes then evaluate those systems without owning or duplicating their state.

### Recipe states

I suggest deriving a recipe's state rather than saving a separate status for every recipe.

LOCKED

Missing ingredient discovery

At least one ingredient has never been discovered.

PROGRESSION LOCKED

Missing progression unlock

All ingredients are known, but the required game progression hasn't been reached.

AVAILABLE

Both conditions satisfied

The recipe is visible and can be considered for crafting.

INSUFFICIENT MATERIALS

Not enough quantity

The recipe is available, but the player doesn't currently own enough ingredients.

One nuance: if we strictly hide recipes until every ingredient is discovered, the ingredient-locked state won't be visible to the player. That's perfectly fine: we can still calculate it internally, and later decide whether to show locked recipe silhouettes or hints.

### Where progression belongs

Your existing `UnlockManager` should remain responsible for progression unlocks. I would not put recipe progression flags inside `inventoryDiscovered`.

For example, a recipe definition might eventually look like:

```js
{
    id: "crushQuartz",
    name: "Crush Quartz",

    ingredients: [
        { item: "quartz", amount: 3 },
        { item: "energy", amount: 2 }
    ],

    outputs: [
        { item: "quartzPowder", amount: 2 }
    ],

    unlock: {
        type: "progression",
        id: "refinement"
    }
}
```

The `unlock` requirement is separate from the ingredient list. We can also support recipes without a progression requirement.

### How I'd implement it

I'd put recipe availability evaluation in a shared recipe utility, rather than inside `SynthesisPanel` or `Inventory.js`.

Something like:

```js
getRecipeState(game, recipe)
```

It would check:

* Have all ingredient IDs been discovered?

* Has the required progression been unlocked?

* Does the player have sufficient quantities?

It returns a state, and the UI decides what to display.

This will also make automation much easier later: an automation system can ask whether a recipe is available and whether its ingredients are sufficient, without needing to know anything about how the recipe panel is rendered.

My recommendation for the architecture: keep inventory, discovery, progression, and recipe evaluation as four distinct responsibilities. They communicate through IDs and queries, not by modifying one another's data.

That gives us a solid foundation before we change the synthesis UI.
