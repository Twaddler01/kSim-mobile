
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
