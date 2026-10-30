# CARDS

PROPOSED API:

Card(title, children, subtitle, options);

Card.Section(title, children);
Card.Text(text, options);
Card.Status(label, options);
Card.Requirements(items);
Card.Output(items);
Card.Progress(options);
Card.Actions(buttons);


Excellent. And I agree with your broader goal: we should transition the existing cards toward one consistent system, rather than maintain two different card-building approaches indefinitely.

I would make one adjustment to our plan: use a common card structure for every card, but allow specialized layouts within that structure.

For example:

* Discovery cards can have progress and investigation costs.

* Upgrade cards can have levels, costs, and installation actions.

* Process cards can have inputs, outputs, timers, and process actions.

* Equipment cards can have statistics, bonuses, and equip actions.

They should all share the same foundation, styling conventions, status handling, and action rendering.

### First implementation: `Card.js`

I'd introduce a small set of reusable building blocks:

| Method              | Responsibility                      |
| ------------------- | ----------------------------------- |
| Card.Section()      | Group related content               |
| Card.Text()         | Consistent descriptive text         |
| Card.Status()       | Status indicator                    |
| Card.Requirements() | Resource and inventory requirements |
| Card.Output()       | Output items                        |
| Card.Progress()     | Progress display                    |
| Card.Actions()      | Consistent action layout            |

We should also distinguish between the card definition and its rendered state. The definition remains static; the owning system provides the dynamic values.

### One more thing before editing

I want to inspect your existing `ProgressBar.js` and the CSS for buttons and progress bars. That way, our new helpers can reuse existing functionality instead of duplicating it.

```bash
echo "===== PROGRESS BAR ====="
cat src/ui/ProgressBar.js

echo "===== BUTTON CSS ====="
grep -n -A65 -B5 -E '\.primary-button|\.secondary-button' styles/styles.css

echo "===== PROGRESS CSS ====="
grep -n -A55 -B5 -E 'progress-bar|progress-fill|progress-track' styles/styles.css
```

After that, we'll implement the base card helpers in `Card.js`, then build a real `ProcessCard` to test the architecture. Once validated, we can migrate Discovery and Upgrade cards onto the same system.

#
#
#

# MATERIAL PROCESSIKG

### 1\. The overall process

I see four natural stages:

![Raw Copper #1 - The Crystal Council](https://images.openai.com/static-rsc-4/mQPedSUYJZ1Z0bbY4qYhT5n5Zfaf_HmrtVvhWreObWj5D8oH6WRtkeOhbywyk-ArEXE8rwLJTNgZ6MysrhEc37XdFzYyXaYWJGDRO5WiTIV_frfDHOh5D5csiUL60pGupueUK62ajMdGvIBgjdgVE6By4ThlCoLNsCOHCNbbd_bVcXUrnSUQwGOay9ABZlC0?purpose=fullsize)

1\. Raw materials

Gathered directly from fields. Copper, stone, silicon, silica, etc.

![Copper ingots 99.99% | Copper alloy ingot for sale from manufacturer | cliffton-trading.com](https://images.openai.com/static-rsc-4/Okw-H25Zh2HKfZxicHsRPJJZp3BDBkfV5LfKQg4ZszXB263I6r4eiFxna2BV_ExV9WPZ_HDKxyjP1WwhY6A8TdoKn6ANEAyzj_PO7H-3x7N2bi3CXTMKKwqbDeyPeMng4ntU98AQfqhBA5RalVb870wONLYik1Tb3Y4XtK1qIvAS2cDT8UEUb58a1Qzge8zf?purpose=fullsize)

2\. Refinement

Separate, purify, or transform raw materials into usable materials.

![Mirrorless vs DSLR in 2026: the transition is complete, and here's what it means for you](https://images.openai.com/static-rsc-4/GVgDTyAR-hc20S5HnIPFdCQBQiV5FevOfq8vJUY2Cx9FnBuTMHmWIFIixitaMVqkpQ-98csHgTWkvJDSb_JPXwn4Z_g4_tTFGltjBpks5PCDPTLXDaDd6SiSEQGvR10lRimLAEqwJsizXoyXt5LV_bzrndGBe-vzANglFJYfGMSRgIeyfi7Rlycf68SyjOmU?purpose=fullsize)

3\. Component fabrication

Produce conductors, wafers, capacitors, sensors, and other components.

![UWC students make history at CERN lab in Switzerland](https://images.openai.com/static-rsc-4/UvVFFIt3QExTZrR6SyZR83jFQgHgT4JGB41siXZz7dkBjEQ-h-6O_WudHmssWLkEXvoDQ_2bETcBcFtO2U8SFyXH_U6ouSRQHr6bA3KGZhoBJTxUjrqOcLBdREOgIZyJxMJ9dY82g8BFXqMeZx68Pjx3-qu-qV0Q_LUhnrDlg9kP94faKhI6RXLosGYwMwk5?purpose=fullsize)

4\. Assembly

Combine components into equipment, instruments, and eventually machines.

The important thing is that these are not necessarily four separate game systems. They're four stages within one system.

### 2\. What should we call it?

I'd consider a few names:

| Name              | Meaning                                     |
| ----------------- | ------------------------------------------- |
| Fabrication       | Manufacturing components and equipment      |
| Synthesis         | Combining and transforming materials        |
| Materials Science | Scientific processing and experimentation   |
| Engineering       | Building functional equipment and machinery |
| Laboratory        | Broad, immersive scientific workspace       |

My inclination is to retain Synthesis as the overall system name, but organize it into distinct processes.

For example:

* Synthesis → Refinement

* Synthesis → Fabrication

* Synthesis → Assembly

That gives us room to introduce more advanced processes later without renaming the whole system.

### 3\. The interface

Rather than making each recipe a separate screen, I'd use one Synthesis tab with process categories.

SYNTHESIS

Concept

MATERIAL PROCESSING FACILITY

REFINE

FABRICATE

ASSEMBLE

Available processes

Copper Conductor

Component

Process recovered copper into a precision conductor.

REQUIRES

🟠 Copper Sample

0 / 5

⚡ Energy

0 / 10

OUTPUT: 1 Copper Conductor

Insufficient materials

QUANTITY

### 1

−+PROCESS

Illustrative interface only. Costs and output are examples, not final game values.

Each process card would have:

* Name and description.

* Category or process type.

* Multiple resource and material requirements.

* Current inventory versus required quantity.

* Output and output quantity.

* Quantity selection: 1, 10, MAX.

* Process button, enabled only when requirements are met.

I would also consider showing a progress indicator if we eventually introduce processing time, but I wouldn't build that into the initial version.

### 4\. An important distinction: recipes versus processes

I would avoid naming everything a recipe.

A recipe is essentially a list of inputs and outputs. A process can describe how something happens.

For example:

| Process               | Inputs              | Output              |
| --------------------- | ------------------- | ------------------- |
| Ore separation        | Raw copper ore      | Copper sample       |
| Copper purification   | Copper sample       | Refined copper      |
| Conductor fabrication | Refined copper      | Copper conductor    |
| Alloy formation       | Copper + aluminum   | Conductive alloy    |
| Equipment assembly    | Multiple components | Finished instrument |

This gives us the opportunity to introduce different process types later:

* Refinement: purification or separation.

* Conversion: changing one material into another.

* Fabrication: manufacturing components.

* Assembly: combining finished components.

* Experimental synthesis: producing fictional or exotic materials.

We can keep a common underlying processing engine while allowing each process type to have different behavior.

### 5\. How I'd structure the data

I would evolve your existing definitions into three separate collections:

Material definitions: What an inventory item actually is.

Process definitions: What the player can do with materials.

Process categories: How the interface groups those processes.

For example, a process definition could eventually look like:

```js
{
    id: "copper-conductor",
    name: "Copper Conductor",
    description: "Process copper into a precision conductor.",

    type: "fabrication",
    category: "components",

    inputs: {
        items: {
            copper: 5
        },
        resources: {
            energy: 10
        }
    },

    output: {
        id: "copperConductor",
        amount: 1
    }
}
```

Notice that I've used `inputs` rather than `costs`. I think that describes a manufacturing process more naturally. We can decide the final naming convention before implementation.

### 6\. Three decisions I'd like to settle

These will influence the architecture quite a bit.

First: Should refinement be mandatory?

For example, must raw copper always be refined before it can become a conductor, or can some processes use raw materials directly?

Second: Should processing be instantaneous?

* Instant: pay materials, immediately receive output.

* Timed: materials enter a processing queue and finish later.

* Hybrid: ordinary processing is instant, advanced equipment requires time.

Third: How should the interface organize processes?

* A. Separate tabs for Refinement, Fabrication, Assembly.

* B. One Synthesis tab with category buttons/filters.

* C. One Synthesis tab with a continuous list grouped by process type.

My initial architecture would favor B, with a common processing engine underneath. It gives the player distinct activities without cluttering the main navigation with several new tabs.

I'd particularly like to settle the first question before we implement anything, because it determines whether raw materials, refined materials, and components form a strict production chain or a more flexible crafting system.
