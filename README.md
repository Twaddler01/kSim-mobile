# kSim — Origins (Lifecycle Foundation)

A mobile-first native HTML/CSS/JavaScript simulation game. No Phaser dependency.

## Structure

- `index.html`, `main.js`, `styles.css` stay in the project root.
- Application modules live in `src/`.
- `src/ui/Component.js` provides the shared lifecycle base class.
- `src/ui/Tabs/` contains the reusable tabs component and its smaller helpers.

## Component lifecycle

- `render()` creates the root once and synchronizes its current UI.
- `mount(parent, before?)` attaches the component and calls `onMount()` once per mount.
- `update()` synchronizes existing DOM with component state.
- `unmount()` detaches the root and calls `onUnmount()`.
- `destroy()` unmounts, runs registered cleanup callbacks, calls `onDestroy()`, and permanently disposes the component.
- `addCleanup(fn)` registers timers, observers, or listeners for disposal.

Example:

```js
import { Tabs } from "./src/ui/Tabs/Tabs.js";

const tabs = new Tabs({
  activeId: "inventory",
  tabs: [
    { id: "inventory", label: "Inventory", render: renderInventory },
    { id: "research", label: "Research", render: renderResearch }
  ]
});

tabs.mount(document.querySelector("#app"));
// Later:
tabs.setActiveTab("research");
tabs.destroy();
```

Existing factory APIs (`el`, `Button`, `Card`, and `ProgressBar`) remain unchanged for now. We'll migrate them incrementally rather than introducing a breaking change across the game at once.

## Run

Serve the project over HTTP (for example, with your Termux DevServer) and open `index.html`. ES modules should not be opened directly through `file://`.
