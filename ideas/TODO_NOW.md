EventProcessor`: the central mechanism for one-time events. Remove the old trigger-processing paths and rebuild around a consistent lifecycle.

# SHORT TERM

### 1\. EventProcessor

Its responsibility will be deliberately narrow:

* Register event definitions.

* Check whether an event has already occurred.

* Evaluate its trigger condition.

* Record the occurrence when the condition becomes true.

* Return newly occurred events to the caller.

It will not apply rewards, write logs, show announcements, generate notifications, or save the game. Those remain responsibilities of the systems that own those effects.

An occurrence record could look like:

```js
game.events = {
    unknownEnergySource: {
        occurredAt: Date.now()
    }
};
```

We can leave room for future metadata, such as what caused an event, without requiring that complexity now.

### 2\. Keep the condition evaluator separate

`evaluateTrigger()` remains a stateless utility. It answers one question:

Is this condition satisfied right now?

`EventProcessor` uses that answer to determine whether a one-time event has occurred. This keeps condition evaluation reusable without making it responsible for progression.

### 3\. Remove the old scattered event system

I'd audit and replace these existing mechanisms:

| Existing mechanism              | Plan                                                                                       |
| ------------------------------- | ------------------------------------------------------------------------------------------ |
| game.triggered[]                | Replace with game.events records                                                           |
| Hidden discovery trigger loop   | Move to EventProcessor                                                                     |
| Ordinary discovery trigger loop | Move to EventProcessor                                                                     |
| game.discoveries[]              | Reassess and replace if it duplicates event occurrence records                             |
| game.unlockedUpgrades[]         | Rebuild as part of the new unlock flow                                                     |
| UnlockManager                   | Keep its permanent-unlock responsibility, but integrate it with the new event architecture |
| evaluateTrigger()               | Keep, then standardize its supported condition types                                       |

One important distinction: we'll preserve actual gameplay effects, rewards, and notification behavior where they're still needed. We're replacing the mechanism that decides when something happens, not throwing away the gameplay content itself.

### 4\. Keep temporary conditions out of event history

For example, having enough research to afford an upgrade is not an event. It should be checked whenever needed.

Discovering a new material, reaching a milestone, or detecting an anomaly can be a one-time event and recorded permanently.

### Suggested implementation order

* Audit every existing trigger definition and every place that evaluates one.

* Define the new event record structure and EventProcessor API.

* Replace ordinary and hidden discovery processing.

* Rebuild upgrade availability and permanent unlock integration.

* Remove obsolete arrays, functions, and startup checks.

* Verify that notifications, logs, announcements, and rewards still fire exactly once.

Let's start with the audit, not the implementation. I want to identify every old trigger-related path before we remove anything, so we don't accidentally leave a hidden dependency behind.

Please send the current `src/triggers/conditions.js`, `src/functions.js`, and the relevant portions of `main.js` and `src/data.js`. We can work through the full dependency map and then build the new system cleanly.

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
