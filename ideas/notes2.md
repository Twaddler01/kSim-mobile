
#
#
#

I'd start by designing the trigger lifecycle, before changing any code.

We already have a working condition evaluator. I wouldn't replace it. Instead, we'll build a consistent way for the different game systems to use it.

### 1\. Establish the core architecture

I'd separate this into three responsibilities:

1\. Trigger Evaluator

Stateless

* Evaluates whether conditions are satisfied.

* Knows nothing about saves or notifications.

* Returns `true` or `false`.

2\. Occurrence Tracking

Persistent

* Records when one-time events occur.

* Prevents an event from firing twice.

* Survives reloads.

3\. Event Handlers

System-owned

* Apply effects.

* Record discoveries.

* Unlock content.

* Generate notifications and announcements.

### 2\. Define the lifecycle

For a one-time event, the process should be:

```text
Evaluate condition
       |
       v
 Is condition true?
    /       \
   No       Yes
   |         |
  Stop    Already occurred?
             /      \
            Yes      No
             |        |
            Stop   Record occurrence
                        |
                        v
                   Apply effects
                        |
                        v
                  Notify application
```

An important detail: record the occurrence before applying effects. That helps prevent duplicate execution if effects or callbacks indirectly cause another evaluation.

### 3\. Audit existing systems before implementation

I'd start with these two functions in `src/functions.js`:

* `checkDiscoveries()` — handles ordinary discoveries and hidden events.

* `checkUpgradeUnlocks()` — handles equipment/upgrade availability.

They currently have different approaches to remembering what happened.

We should inspect both before deciding what to consolidate.

Please run:

```bash
sed -n '150,410p' src/functions.js
```

And:

```bash
sed -n '90,225p' src/data.js
```

### 4\. The design decisions we'll settle

Before implementing anything, we'll establish:

| Question                                      | Proposed direction                       |
| --------------------------------------------- | ---------------------------------------- |
| Who evaluates conditions?                     | Shared evaluator                         |
| Who records occurrences?                      | Owning progression system                |
| Are discoveries repeatable?                   | No, unless explicitly designed otherwise |
| Are unlocks permanent?                        | Yes, by default                          |
| Can conditions be temporary?                  | Yes                                      |
| Are notifications part of trigger processing? | No                                       |
| Can events have multiple effects?             | Yes                                      |

One more architectural principle I'd preserve: not every satisfied condition needs an occurrence record. A temporary resource requirement, for example, should simply be evaluated when needed.

My goal is to give kSim one consistent foundation for discoveries, milestones, unlocks, research events, manufacturing, and eventually much more complicated progression.

We'll build that foundation incrementally rather than introducing a giant event framework all at once.
