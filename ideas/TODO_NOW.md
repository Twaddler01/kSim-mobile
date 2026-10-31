
### 1\. Three independent recipe collections

I'd put them in a dedicated `src/data/synthesis.js`:

```js
export const refinementRecipes = [
    // Raw materials → refined materials
];

export const fabricationRecipes = [
    // Materials → components
];

export const assemblyRecipes = [
    // Components and materials → equipment
];
```

Each collection is independently expandable, and the category is implicit in the array. We don't need to repeat `category` on every recipe unless we later have a reason to.

All recipes share one schema:

```js
{
    id: "purify-silica",
    name: "Purify Silica",
    description: "Refine raw silica into a useful material.",

    inputs: {
        silica: 5,
        energy: 2
    },

    outputs: {
        refinedSilica: 2
    },

    duration: 0.5
}
```

Notice that energy is just another input. The engine doesn't need separate resource-cost and material-cost logic.

### 2\. Keep item definitions organized separately

We already have two overlapping definition sources:

* `data/materials.js`

* `data/manufacturing.js`

I'd consolidate those into a canonical item registry, retaining the existing material metadata and adding the four resources.

Conceptually:

```js
export const resourceDefinitions = [
    // Energy, particles, research, exotic matter
];

export const materials = [
    // Raw, processed, advanced, components, assemblies...
];

export const itemDefinitions = [
    ...resourceDefinitions,
    ...materials
];
```

This is useful because the three recipe arrays can refer to any item ID, regardless of its category.

### 3\. One actual inventory

The game state then becomes:

```js
inventory: {
    energy: 0,
    particles: 0,
    research: 0,
    exoticMatter: 0,

    stone: 0,
    quartz: 0,
    copper: 0,

    quartzPowder: 0,
    copperIngot: 0
}
```

The definitions describe what those IDs represent; the inventory stores their quantities.

This also simplifies `Inventory.js`: it no longer needs to know whether an item came from `resources` or `materials`.

### 4\. The engine and panel

The engine will receive the recipe arrays and use the same processing functions for all three:

* Check inputs and availability.

* Deduct inputs when starting.

* Record the process start and completion timestamps.

* Grant outputs when complete.

* Preserve active processes in the save.

The panel will render three sections, each populated from its corresponding array. No separate crafting implementation for each section.

### Implementation order

I'd do this in stages so we can test each change:

* Unify item definitions and inventory storage. Update resource production, spending, discovery effects, gathering, upgrades, and the inventory display.

* Create the three recipe arrays. Move the existing recipes into the appropriate categories and add the initial refinement recipes.

* Rebuild `SynthesisEngine`. Replace instant crafting with timestamp-based processing.

* Rebuild `SynthesisPanel`. Render the three sections using the reusable `Card` helpers.

One important detail: `SaveManager` currently merges `resources` and `inventory` separately. We'll update that during stage 1. Since you're comfortable resetting the old save, we don't need to preserve the old split structure.

I'd start with stage 1 and leave the synthesis UI alone until the inventory foundation is working. That gives us a reliable base for all three categories.





#
#
#

# LONG TERM

### New progression architecture

UnlockManager

Implement now

* Register unlockable content.

* Track persistent unlocked status.

* Evaluate existing trigger conditions.

* Unlock each item only once.

* Persist unlock state through game saves.

* Report newly unlocked IDs to the application.

StateManager

Future implementation

* Active / inactive

* Enabled / disabled

* Operational / damaged

* Other temporary or conditional states.

Application and domain systems

* Notifications and announcements

* Gathering and navigation

* Discoveries and upgrades

* Manufacturing and automation

### Implementation plan

I'd do this in six stages:

* UnlockManager: Finalize its API and persistent state structure. No `lock()` operation.

* SaveManager: Give unlocks a dedicated saved-data structure. Remove legacy unlock storage.

* Field integration: Move all gathering field unlock checks, navigation checks, and UI checks to `UnlockManager`.

* Trigger integration: Ensure trigger evaluation happens after relevant game actions, and only locked items are evaluated.

* Application effects: Keep announcements, unread badges, logging, and notifications outside the manager.

* Testing: Test manual unlocks, trigger unlocks, persistence, repeated checks, and fresh-game resets.

We can reuse your existing `evaluateTrigger()` rather than introducing another trigger system.

### Proposed saved structure

I'd keep the saved data simple:

```js
{
    unlocks: {
        stone: false,
        quartz: false,
        copper: false,
        silicon: false
    }
}
```

The definitions themselves will live in game data, not in the save. The save only needs to remember what has been unlocked.

A registered definition could look like:

```js
{
    id: "copper",
    name: "Copper Field",
    trigger: {
        type: "inventoryAmount",
        item: "stone",
        amount: 10
    }
}
```

No trigger means the item can still be manually unlocked or unlocked by another game system.
