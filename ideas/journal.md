# CURRENT SETUP
Yes. You have enough infrastructure to start building the Research Journal UI. I would consider the current catalog and relationship layer a solid first version rather than trying to anticipate every future system now.

You have three important pieces working:

* Catalog: A unified, normalized view of locations, fields, resources, materials, and recipes.

* Lookup: Retrieve entries by ID, type, category, or visibility.

* Relationships: Navigate between recipes, their ingredients and outputs, and fields and their materials.

That is enough to build a Journal with categories, entry lists, detail pages, and linked information.

### What future integration looks like

Your understanding is correct, with one distinction: new data doesn't always require new relationship functions.

Think of it in three steps.

### 1\. Add a new source definition

For example, when you add discoveries to the Journal:

```js
import { discoveries } from "../discoveries.js";

const discoveryEntries = discoveries.map(discovery =>
    createEntry(discovery, "discovery", "discoveries")
);
```

Then include `...discoveryEntries` in `journalCatalog`.

The discovery remains owned by `discoveries.js`. The catalog simply indexes it.

You'd follow the same pattern for:

* Upgrades

* Plans

* Progression unlocks

* Equipment

* Machines

* Other future entities

### 2\. Add relationships when needed

Suppose discoveries unlock materials or fields.

We'd add a relationship function such as:

```js
getDiscoveryUnlocks(discoveryId)
```

Or perhaps a more general:

```js
getEntriesUnlockedBy(triggerId)
```

The important point is that we only add relationship logic when there's a meaningful connection to navigate.

### 3\. Let UI components consume the catalog

For example:

Research Journal

ResourcesMaterialsRecipesFields

### 💎

Quartz

Raw material · Tier 1

A crystalline mineral suitable for processing.

Related information

* Found in: Quartz Field

* Used in: Crush Quartz, Phase-Stable Crystal

* Produced from: Not applicable

    Illustrative layout

The same catalog entry can power:

* Journal detail pages

* Inventory tooltips

* Recipe ingredient links

* Field information panels

* Discovery descriptions

No duplicate definitions required.

### One future consideration

Your current catalog is built when its module loads. That's perfectly fine for your current static game definitions.

If you eventually add definitions dynamically during gameplay, we'll need to account for rebuilding or updating the catalog and its relationship indexes. We don't need to solve that now.

JavaScript modules are well suited to this arrangement: each source module owns its exports, while other modules import and consume them. MDN +1

### My suggested development order

* Now: Build the Journal UI using the existing catalog.

* Add discoveries, upgrades, plans, and progression entries as those Journal sections become relevant.

* Add relationships for unlocks, prerequisites, and other connections.

* Connect the Journal catalog to inventory, recipes, fields, and other UI panels.

The key architectural principle is worth keeping:

Game data defines what exists. The catalog organizes what exists. Relationships explain how things connect. UI decides how to display it.

That should let kSim grow considerably without turning the Journal into another place where you have to maintain game data.




# PLANNING
### 1\. One source of truth, multiple consumers

The direction of authoritative data should remain:

Game data — authoritative

Materials · Recipes · Fields · Upgrades · Discoveries

Imported and indexed

Journal catalog

References and relationships between entities

Presented through UI

Journal UI / Tooltips / Guides

Wiki pages · Related items · Search · Links

The Journal can read and connect the game definitions. It shouldn't directly change a material's recipe, cost, or properties.

However, the game UI can also use the Journal catalog to find related information. That's where the integration becomes interesting.

### 2\. How raw material → refined material works

Let's use quartz as an example.

The material definition remains in `materials.js`:

```js
{
    id: "quartz",
    name: "Quartz",
    category: "raw",
    description: "A crystalline mineral..."
}
```

The refinement recipe remains in its own recipe module:

```js
{
    id: "crushQuartz",
    inputs: {
        quartz: 2
    },
    outputs: {
        quartzPowder: 1
    }
}
```

The Journal catalog imports both definitions and connects them by their IDs.

Conceptually, it can construct this relationship:

![Mănunchi cristale cuarț cu vârfuri naturale](https://images.openai.com/static-rsc-4/kz0Ah_YwqJuUAk7dGTsR8SjhEG9F0lGIisDOa2V-gx6TYIZVI9Nc3h1oqm8Zv6BpRZeQutyv0tqIrh_P2oMGryjxckae9RnIWH8txEvCbrK8iT0pizJQrnpk-8O7skwVfva5qOlrtDRk-DilMc5DVywVSPY1__TFR468welbtH89FmIM8HFPOkp4XB1eX_B0?purpose=fullsize)

Quartz

Raw material

ID: `quartz`

Crush Quartz · 2 units

![Wholesale Super Fine Quartz Powder 98%-99% Purity, Suitable for Adhesives | Alibaba.com](https://images.openai.com/static-rsc-4/-0mW53yOMIddJXtZgixAbanLVPs6jy14tINHZHWuvtxsnmMuNSgxHxAyylT3uuz59dXDSa1iI6O2ELsztfdtWHPEvHvhmIW0n8dVekieyFICcDv8OEM8uGV0rqsVXJn0dN0vAC3EUU-OKDGl76xbDNAgabZQg1YV-RPcc17vwH5MJwCkpLM8cLbiBODqKovc?purpose=fullsize)

Quartz Powder

Processed material

ID: `quartzPowder`

Now the Journal can show:

* On the Quartz page: Processed into Quartz Powder.

* On the Quartz Powder page: Produced from Quartz.

* On a recipe page: its required inputs and resulting outputs.

And the inventory tooltip could show a small Refined into → Quartz Powder link without the inventory system needing to know how the Journal is implemented.

### 3\. The trick: store relationships once, look them up both ways

I would not add `refinedInto` to the Quartz material and `producedFrom` to Quartz Powder manually. That duplicates information and creates a maintenance problem.

Instead, the recipe is the authoritative relationship:

```js
{
    id: "crushQuartz",
    inputs: {
        quartz: 2
    },
    outputs: {
        quartzPowder: 1
    }
}
```

Then the catalog builder can generate both directions:

```js
// Conceptual example

getRecipesUsing("quartz");
// → crushQuartz

getRecipesProducing("quartzPowder");
// → crushQuartz
```

This is sometimes called a reverse lookup or bidirectional mapping. The relationship is stored once, but queried from either side. Using stable IDs for these connections is a well-established data-modeling approach. Game Developer +2

### 4\. How that connects to the game UI

This is the part I particularly like for kSim.

The inventory doesn't need to import recipe definitions, and recipes don't need to know anything about tooltips.

Instead:

* Inventory displays a material.

* The tooltip asks the catalog for related information.

* The catalog finds recipes that use or produce that material.

* The tooltip displays links or summaries.

That gives us consistent integration across:

| Game UI           | Journal/catalog information                        |
| ----------------- | -------------------------------------------------- |
| Inventory tooltip | Where found, what it produces, what uses it        |
| Recipe panel      | Input materials, output materials, related entries |
| Gathering field   | Materials that can be recovered                    |
| Discovery panel   | Related materials, fields, and research            |
| Upgrade panel     | Related systems and unlocks                        |

The catalog is read-only from the perspective of gameplay. If a player actually refines quartz, the recipe system performs the operation and changes inventory. The Journal merely explains the relationship.

### 5\. What I'd build for kSim

I'd split this into three responsibilities:

* Source definitions — your existing `materials.js`, `fields.js`, recipe files, etc.

* Journal catalog — imports definitions, indexes IDs, and provides relationship lookups.

* UI consumers — Journal pages, tooltips, inventory, recipes, and eventually the guide.

One important detail: we should distinguish between what exists in the game's database and what the player has discovered or unlocked. The catalog can know about Quartz Powder before the player has discovered it, while the UI decides whether to reveal it.

My recommendation is to build the catalog as a shared read-only information service, not as a Journal-only feature. The Journal is simply its first major consumer.

That means we can eventually have the same relationship data power both the wiki and the in-game tooltips without coupling either one to the recipe or inventory implementation.

And yes, I'd keep going with `locations.js` first. Once we have LAB, we'll test the metadata convention against fields and materials, then build the catalog only after we understand what those different source definitions need. No need to build the whole encyclopedia engine before we've written its first page.
