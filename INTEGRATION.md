# kSim Synthesis Engine integration

This update is intentionally modular: it adds the recipe definitions, manufacturing rules, and a UI panel without replacing your current `main.js`, formula panel, UI components, or save key.

## Files to copy

Copy these files into the matching paths:

- `src/data/manufacturing.js`
- `src/systems/SynthesisEngine.js`
- `src/ui/SynthesisPanel.js`

The code expects the existing UI APIs used by Quantum Foundations:
- `el` from `src/ui/Element.js`
- `Button(label, onClick, { variant, disabled })`

## 1. Add a persistent Synthesis tab

In your current main module, import:

```js
import { SynthesisPanel } from "./src/ui/SynthesisPanel.js";
import { ensureManufacturingState, gatherMaterialSamples } from "./src/systems/SynthesisEngine.js";
```

After loading `game`, call:

```js
ensureManufacturingState(game);
```

In your tab definition list, add a tab like this:

```js
{
    id: "synthesis",
    label: "SYNTHESIS",
    render: () => new SynthesisPanel({
        game,
        onChange: () => {
            save();
            render();
            showToast("Synthesis complete.");
        },
        onToast: showToast
    }).getElement()
}
```

Keep your existing tab IDs and render functions unchanged. Add the new tab beside Equipment/Observations where it fits your current layout.

## 2. Connect raw material recovery to experiments

In the function that runs experiments in `main.js`, immediately after the existing `stir(game, count)` call, add:

```js
const recovered = gatherMaterialSamples(game, count);
```

If you display the experiment toast, optionally append the material results:

```js
if (recovered.length) {
    gains.push(...recovered.map(item => {
        const definition = materialDefinitions.find(entry => entry.id === item.id);
        return `+${item.amount} ${definition?.name ?? item.id}`;
    }));
}
```

For that optional snippet, also import `materialDefinitions` from `./src/data/manufacturing.js`.

This uses the existing experiment action as the raw-material source. Each experiment independently has a small chance to recover copper, silicon, silica, or aluminum samples. Batch experiments use the same chance per experiment.

## 3. Save compatibility

The system adds `game.inventory` and `game.manufacturing` fields to the existing game object. Your current save key remains unchanged, and the existing load pattern that spreads saved properties will preserve them. Existing saves without these fields are initialized automatically.

Do not change or reuse the older Origins save key.

## 4. Formula unlock ID

The recipe data currently expects the discovery ID `temporalResonance` to unlock resonance crystals, advanced assemblies, and the Particle Reconfiguration Array.

If your plan completion code uses a different stable ID or save shape, update the `hasDiscovery()` function in `src/systems/SynthesisEngine.js` to match that exact completion flag. The module includes common `completedPlans`, `plans`, and `planProgress` shapes as compatibility fallbacks, but the stable explicit discovery ID is preferred.

## 5. Initial balance and progression

- Basic samples: recovered from experiment actions.
- Basic components: use energy plus raw material samples.
- Advanced fictional materials: require Temporal Resonance and research.
- Major assemblies: consume manufactured components and research.
- Particle Reconfiguration Array: requires all four assemblies, 20 energy, 10 research, and 5 exotic matter.

These are initial balance values, not final tuning. The machine is currently an inventory milestone; the next step after this update is to add its particle-manipulation screen and experimental-object tuning.
