kSim-mobile — Improvement Review

Overall this is a solid prototype. The structure is clear, components are reasonably separated, and the data-driven design (definitions → managers → panels) is a good foundation. Below are issues grouped by severity, with the most urgent ones first.

---

🔴 Critical bugs

1. effects.js references addInventoryItem without importing it

```js
// src/triggers/effects.js — no imports at top
export function applyEffects(game, effects = [], { onProgress = () => {} } = {}) {
    ...
    addInventoryItem(game, resource, amount); // ReferenceError
    ...
}
```

This throws as soon as completeDiscovery applies an effect (e.g. fieldCalibration at 400 experiments). It hasn't surfaced yet because that trigger hasn't been reached, but every discovery reward will crash.

```js
import { addInventoryItem } from "../data/inventory.js";
```

2. SynthesisPanel.getItem indexes an array by ID

```js
getItem(itemId) {
    return (
        materials.find(item => item.id === itemId) ??
        resourceDefinitions[itemId] ??          // ← always undefined
        { id: itemId, name: itemId, icon: "◈" }
    );
}
```

resourceDefinitions is an array. resourceDefinitions["energy"] is undefined, so any recipe using energy (most of them) will show as "energy" with a ◈ icon instead of ⚡ Energy.

```js
resourceDefinitions.find(item => item.id === itemId) ??
```

3. debug.js uses showAnnouncement, navigateTo, navigateToItem without importing/passing them

Every announcement/navigation debug button (showAnnouncementLab, showAnnouncementField, navigationTestCycle) will throw ReferenceError when clicked, since those names are module-scoped in main.js and never passed in. The main parameter of initializeDebug only receives { ui, el, Card, Button, ProgressBar }.

Fix:

```js
// main.js
initializeDebug({
    ui, el, Card, Button, ProgressBar,
    showAnnouncement,
    navigateTo,
    navigateToItem
});
```

Then destructure them in initializeDebug and pass down to renderCardTestTab / handlers.

4. renderCardTestTab is defined outside initializeDebug, so Card, Button, el, ProgressBar are out of scope

The CARD TEST tab will throw the moment it's opened. Move the function inside initializeDebug (or make it a factory taking those components).

5. Observation/operation unread state is orphaned

notifyUnread("observations", …) and notifyUnread("operations", …) are called from completeDiscovery and discoverMaterial, but there is no observations or operations tab in renderTabContent. Consequences:

· Unread badges never appear for discoveries.
· The link: { tab: "observations", … } on discovery log entries silently fails when clicked (returns false from navigateTo).
· discoveryPanel is instantiated in main.js but never rendered.

Either re-add the observations tab, or retarget discovery logging/linking to an existing tab (e.g. log or journal). Right now discovery UX is a dead end.

6. main.js — debugPanel is declared after render()

```js
announcementsEnabled = true;
render();

const debugPanel = new DebugPanel({...});
```

This works today only because activeTab is hardcoded to "lab". The moment the active tab is restored from save (or the default changes), renderDebugTab() will hit the TDZ and throw. Declare debugPanel (or use a lazy factory) before render().

---

🟠 Architecture / maintainability

7. main.js is doing too much

At ~1000 lines it's the single largest file, mixing:

· save/load bootstrapping
· manager construction (unlock, event, unread)
· 8 panel instances + 5 UI components
· tab registration
· navigation handlers
· lab-tab rendering (intro / orb / bonus actions / reset)
· global window.kSim
· debug plumbing
· debugCatalog

Split into modules roughly:

```
bootstrap.js         → SaveManager, initializeInventory, managers
systems.js           → processProgression, completeInvestigation, discoverMaterial, runExperiments, stir wiring
ui/layout.js         → render(), topbar, inventory mount, tab list
ui/tabs/labTab.js    → the current renderLabTab content + updateLabTab
ui/tabs/gatheringTab.js
ui/tabs/renderers.js → all the tiny renderXTab() functions
navigation/fields.js → registerFieldNavigationPages + field-selection rendering
debug/attach.js      → debugPanel + initializeDebug + debugCatalog
```

That alone will make the codebase far easier to reason about.

8. DebugButton vs DebugButtons naming is confusing

Default export is DebugButton (singular class wrapper), named export is DebugButtons (static registry). The wrapper is thin enough that it might as well be the registration call:

```js
// debug.js
export function initializeDebug({...}) {
    DebugButtons.register({ id, label, description, run });
}
```

Or rename for clarity: DebugAction + DebugActionRegistry.

9. DebugPanel.grantItem ignores failure

```js
grantItem(itemId, amount = 1) {
    addInventoryItem(this.game, itemId, amount); // result discarded
    this.finishGrant(`${amount} ${itemId}`);
}
```

addInventoryItem returns { success, newlyDiscovered, amount }. If it fails (unknown item ID typo, non-finite amount), the user still sees "X granted" toast. Same in grantAllMaterials / grantAllResources.

10. SaveManager.load() merges inventory twice

```js
return {
    ...fresh,
    ...savedData,
    inventory: { ...fresh.inventory, ...(parsed.inventory ?? {}) },
    ...
    inventory: { ...(fresh.inventory ?? {}), ...(parsed.inventory ?? {}) }, // duplicate
    ...
};
```

The second overrides the first, so it happens to work — but it's a red flag for schema drift. Consider a mergeState(fresh, saved) helper that explicitly lists fields, so it's easy to add migrations.

Also missing: a version migration hook. initialGameData.version = 2 exists but nothing reads it. When schema changes land, old saves will silently produce weird state.

11. addLog unread logic is hard to follow

The interplay between notificationTargets, effectiveCategory, onUnread("log", …), and the once-key downgrade is dense. A small explicit helper would clarify:

```js
function notifyForLog(game, entry, targets, effectiveCategory, onUnread) { … }
```

12. processProgression inside stir runs per-experiment

```js
for (let i = 0; i < experiments; i++) {
    ...
    onProgress();  // processProgression() → full event loop
}
```

With RUN ×10 and ~20 events, that's 200 event evaluations per click, each potentially hitting save() if a discovery fires. Fine now, but it will chug once EventProcessor has more events or batch sizes grow. Batch the progression check after the loop unless a milestone requires per-step semantics.

13. updateOperationsUI is dead

main.js defines updateOperationsUI() but never calls it. Either delete or wire it into refreshUI.

14. UnreadManager.markTabSeen is a stub that's never used

It returns false with a comment. tabReadIds in initialGameData is also vestigial. Either implement tab-level acknowledgement semantics or remove both — right now they're cargo cult.

---

🟡 Smaller issues / polish

· DebugPanel.grantItemWithoutRefresh — defined, never called.
· debugLogState — defined, never hooked to a button. Would make a great "Dump log state" debug action.
· debug.js commented-out code blocks — clean up the /*****/ remnants.
· Card.Status in debug.js — status.className = "card-status card-status--running" bypasses the component API; use status.replaceWith(Card.Status("Running", { variant: "running" })) or expose a setter.
· SynthesisPanel — locked recipes still show a button labelled "CRAFT" (disabled). Set it to "LOCKED".
· Announce.destroy() silently discards queued announcements without calling onClose — worth a comment or an explicit cancelled action.
· Toast doesn't coalesce duplicate messages — spamming a button yields 5 identical toasts. Consider if (this.toasts.has(message)) resetTimer().
· ItemIcon — the detection heuristic (item.type === "material" || item.category ? item.id : null) is accidental. inventoryType === "material" is the intended discriminator; check that explicitly.
· Card.Requirements / Card.Output — accept item.id or item.label but the interface is loosely typed; consider normalizing to { icon, label, amount, available, id } and dropping the fallbacks.
· GatheringField — nodeCount is fixed at 7; if spawnNodes(1) returns early because there are no free tiles (rare but possible), the node count shrinks permanently.
· PlanPanel.updateBoard — completionArtwork is cached and only removed on !completed. If a plan is un-completed (future feature), the artwork lingers. Minor.
· Tabs.updateArrowUnreadState — walks every button on every scroll. Cache the per-tab unread count and only recompute on refreshUnreadIndicators.
· Tabs.update() — calls tab.render() on every call (even when refreshContent: true), which can be expensive for the journal/synthesis panels. Consider a "dirty" flag per tab.
· index.html — DEBUG_MODE is a hardcoded true. Move to a query param (?debug=1) or a build-time constant so shipped code doesn't ship devtools.
· FIELD_DEFINITIONS — both labValley and stone produce stone; labValley also produces quartz/copper. Consider whether stone should be the dedicated field and labValley the mixed starter, or collapse them.
· discoveries.js — unknownEnergySource.cost uses exoticMatter: 5, but completeInvestigation calls payCost which uses removeInventoryItem. That works because exoticMatter exists in initial inventory. OK, but if you ever remove that key from initial inventory, the cost check silently passes with zero. canAfford uses ?? 0 so it fails — fine.

---

🟢 Nice-to-have

· Move the debug tab rendering behind a flag so it doesn't appear in production (currently it's always registered as a tab).
· Add a validateSave(game) routine that logs schema mismatches on load (helps catch the kind of bug in #10).
· A "state snapshot" debug button — dump game to a JSON textarea with copy-to-clipboard. Useful given the size of game.
· Centralize notificationTargets — one place that defines which tabs exist, then warn if a target references a missing tab. Would have caught bug #5.
· Unit tests for SynthesisEngine — canCraftRecipe, getAvailableCrafts, and getRecipeStatus are pure and easy to test; the resourceDefinitions bug would have been caught immediately.
· LogPanel — the entry.link shape { tab, itemId, label } is undocumented; add a doc comment or a small createLogLink() helper used at call sites.

---

Suggested order of attack

1. Fix #1 (effects.js import) and #2 (SynthesisPanel.getItem array index) — these are one-liners that will bite soon.
2. Fix #3, #4, #5 — the debug buttons and the orphaned discovery UX are visible regressions.
3. Move #6 (debugPanel) before render() — cheap insurance against a future change.
4. Extract #7 (main.js split) incrementally — start with debug/attach.js and ui/tabs/labTab.js since those are the densest blocks.
5. Do a cleanup pass for #13, #14, the dead code in debug.js, and DebugPanel.grantItemWithoutRefresh.
6. Add the small wins from 🟡 as you touch each file.

The core data flow (UnlockManager → EventProcessor → processProgression → effects → save) is actually well-designed; the biggest risks are the shallow bugs (1, 2, 3, 4) and the accumulating size of main.js.