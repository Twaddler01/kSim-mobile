I think this is a very good time to standardize it. You’re not necessarily over-complicating things — the trouble is that three separate behaviors have started sharing responsibilities. Separating them into small, independent systems should make the code easier to reason about, save, debug, and extend.

I'd keep your proposed three classes: `Announce`, `NewBadge`, and `LogBadge`. The important design rule is that an announcement, an unread content item, and a log entry are three different things. One event can create all three, but none should depend on the others to work.

### The proposed architecture

1\. `Announce`

Displays global popup announcements, independently of the currently selected tab.

* Queues multiple announcements in creation order.

* Displays one at a time, then advances to the next.

* Persists pending announcements and their order in the save.

* Can be enabled or disabled without disabling badges or logging.

* May optionally carry an action, such as navigating to FIELD WORK.

One game event can trigger any combination of these

2A. `NewBadge`

Tracks unread content by tab and item. Updates the tab's NEW counter and clears an item's unread status when the player opens it.

2B. `LogBadge`

Tracks unread LAB LOG entries only. Acknowledging an entry updates the log's unread counter independently of content badges.

Shared saved state

Each system persists only its own data. A popup can be dismissed while its content remains NEW and its log entry remains unread — or any of those states can be cleared independently.

### 1\. Give each class a small, predictable API

These are example interfaces, not instructions to implement them yet.

| Class    | Example calls                                                               | Responsibility          |
| -------- | --------------------------------------------------------------------------- | ----------------------- |
| Announce | announce.push(...), announce.dismiss(), announce.setEnabled(...)            | Popup queue and display |
| NewBadge | newBadge.add(tab, itemId), newBadge.clear(tab, itemId), newBadge.count(tab) | Unread content          |
| LogBadge | logBadge.add(entryId), logBadge.markRead(entryId), logBadge.count()         | Unread LAB LOG entries  |

I'd keep rendering and saved-state management inside each class, or have each class use your existing UI and save helpers. The classes should not directly manipulate one another's state.

### 2\. One important distinction: opening a NEW item

I'd recommend that clicking a NEW item clears its NEW status and performs its normal action in the same click.

For example:

* A Copper Sample discovery makes the FIELD WORK card NEW.

* FIELD WORK's tab shows a counter of `1`.

* The player clicks the card.

* The unread flag clears and the counter drops to `0`.

* The card opens normally — no second click required.

If you deliberately want the first click to only acknowledge NEW, that can be supported as an option, but I wouldn't make it the default. The single-click approach feels more natural and avoids extra friction.

Also, the counter should be derived from the number of unread items rather than manually incremented and decremented without checking state. That helps prevent duplicate events or repeated clicks from corrupting the count.

### 3\. What happens when one event occurs?

Suppose the player discovers a new material in FIELD WORK. The game could issue three independent requests:

GAME EVENT

Copper Sample discovered

Announce

Queues “New material discovered: Copper Sample!” and optionally offers a button to open FIELD WORK.

NewBadge

Marks the relevant FIELD WORK item unread and updates its tab counter.

LogBadge

Adds an unread LAB LOG notification if the event should be counted there.

These are independent requests. You can create an announcement without a badge, a badge without a popup, or a log entry without either. Disabling popups should never silently disable the other two systems.

### 4\. Save each system's state separately

I'd structure the saved data conceptually like this:

```js
{
  announcements: {
    enabled: true,
    queue: []
  },

  newBadges: {
    // Tab and item identifiers for unread content
  },

  logBadges: {
    // Unread LAB LOG entry identifiers
  }
}
```

This is an illustration of the organization, not a proposed replacement for your current save structure. We should preserve existing saved data where practical and migrate it if necessary.

One extra detail: if you dismiss an announcement, that should remove it from the announcement queue only. It should not automatically clear NEW or mark a log entry as read. Likewise, if the player visits the relevant content, that should not automatically dismiss an unrelated popup.

### 5\. Where I'd start in your existing code

Don't build all three classes from scratch yet. You already have much of the behavior. First, let's identify which existing functions own each responsibility, then extract or standardize them with minimal disruption.

I'd inspect these areas in order:

* Announcement rendering and dismissal — how `showToast` or the current popup works, whether it has a queue, and how a popup can navigate to a tab.

* Unread content tracking — your existing `addLog` notification targets or other badge functions, plus the code that handles clicking a NEW item.

* LAB LOG unread tracking — how log entries become unread and when their badge count is cleared.

* Save/load — where these states are persisted and restored.

Your current `addLog()` already has `notificationTargets`, so we should examine how it fits into this design before changing it. It may be useful to retain that function as an event entry point, or we may find that its notification responsibilities should be separated.

Let's start with the announcement and badge-related code you were already searching for. If you have the output from the earlier `grep` command, paste it here. Otherwise, rerun:

```bash
cd ~/projects/kSim-mobile

grep -R -n \
  --exclude-dir=.git \
  --exclude-dir=node_modules \
  'showToast\|notificationTargets\|onNavigate\|NEW MATERIAL DISCOVERED' \
  main.js src
```

From those results, we can identify the actual starting point and map the existing code to `Announce`, `NewBadge`, and `LogBadge` before making any edits.
