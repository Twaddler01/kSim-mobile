// main.js

// ===================================
// IMPORTS
// ===================================

// Debug
import { initializeDebug } from "./debug/debug.js";
import DebugPanel from "./debug/DebugPanel.js";
import {
    journalCatalog,
    getJournalEntry,
    getJournalEntriesByCategory,
    getJournalEntriesByType,
    getVisibleJournalEntries
} from "../src/data/journal/catalog.js";

import {
    getRecipesUsing,
    getRecipesProducing,
    getRecipeInputs,
    getRecipeOutputs,
    getFieldMaterials,
    getMaterialField,
    getFieldUnlock
} from "../src/data/journal/relationships.js";

// Panels
import DiscoveryPanel from "./src/ui/panels/DiscoveryPanel.js";
import SynthesisPanel from "./src/ui/panels/SynthesisPanel.js";
import UpgradePanel from "./src/ui/panels/UpgradePanel.js";
import LogPanel from "./src/ui/panels/LogPanel.js";
import JournalPanel from "./src/ui/panels/journal/JournalPanel.js";
import PlanPanel from "./src/ui/panels/PlanPanel.js";
import GatheringField from "./src/ui/panels/GatheringField.js";
import Inventory from "./src/ui/panels/Inventory.js";

// Components
import { el } from "./src/ui/components/Element.js";
import { Button } from "./src/ui/components/Button.js";
import { Card } from "./src/ui/components/Card.js";
import { ProgressBar } from "./src/ui/components/ProgressBar.js";
import Badge from "./src/ui/components/Badge.js";
import CollapsiblePanel from "./src/ui/components/CollapsiblePanel.js";

// Nvigation
import { Tabs } from "./src/ui/navigation/Tabs/Tabs.js";

////

import { initialGameData } from "./src/data/initialGameData.js";
import { resourceDefinitions } from "./src/data/resources.js";
import { discoveries } from "./src/data/discoveries.js";
import { upgradeDefinitions } from "./src/data/upgrades.js";
import { FIELD_DEFINITIONS } from "./src/data/fields.js";
import {
    addLog,
    stir,
    buyUpgrade,
    upgradeCost,
    canAfford,
    payCost,
    costLabel,
    formatNumber,
    consumeParticles,
    completeDiscovery
} from "./src/functions.js";

import { materials } from "./src/data/materials.js";
import {
    initializeInventory,
    syncInventoryDiscovery,
    addInventoryItem,
    removeInventoryItem
} from "./src/data/inventory.js";

import ResourcePopups from "./src/ui/effects/ResourcePopups.js";
import SaveManager from "./src/managers/SaveManager.js";
import UnlockManager from "./src/managers/UnlockManager.js";
import EventProcessor from "./src/managers/EventProcessor.js";
import { progressionUnlocks } from "./src/data/progression.js";

import {
    navigateTo as coordinateNavigation,
    navigateToItem as navigateTabToItem,
    registerPage
} from "./src/ui/navigation/itemNavigation.js";

import { recoverMaterial } from "./src/systems/MaterialRecovery.js";

import UnreadManager from "./src/managers/UnreadManager.js";
import Announce from "./src/notifications/Announce.js";
import NewBadge from "./src/notifications/NewBadge.js";
import Toast from "./src/notifications/Toast.js";

const saveManager = new SaveManager({
    key: "ksim-quantum-foundations-v1",
    initialData: initialGameData
});

const app = document.getElementById("app");

let game = saveManager.load();
initializeInventory(game);

const unlockManager = new UnlockManager(game);

// Application and domain-system state.
game.appState ??= {};
game.appState.navigation ??= {};
game.appState.navigation.activeFieldId ??= null;

const eventProcessor = new EventProcessor(game);

// Permanent gathering-field unlock definitions.
for (const field of FIELD_DEFINITIONS) {
    unlockManager.registerUnlock({
        id: field.id,
        initialUnlocked: false
    });

    if (field.unlockTrigger) {
        eventProcessor.registerEvent({
            id: `field:${field.id}`,
            trigger: field.unlockTrigger,
            content: field
        });
    }
}

// Permanent upgrade unlock definitions.
for (const upgrade of upgradeDefinitions) {
    unlockManager.registerUnlock({
        id: upgrade.id,
        initialUnlocked: ["energyYield", "particleStability"].includes(
            upgrade.id
        )
    });

    if (upgrade.trigger) {
        eventProcessor.registerEvent({
            id: `upgrade:${upgrade.id}`,
            trigger: upgrade.trigger,
            content: upgrade
        });
    }
}

// Ordinary discoveries and hidden observations.
for (const discovery of discoveries) {
    if (discovery.hidden) {
        eventProcessor.registerEvent({
            id: `observation:${discovery.id}`,
            trigger: discovery.trigger,
            content: discovery
        });
    } else {
        eventProcessor.registerEvent({
            id: `discovery:${discovery.id}`,
            trigger: discovery.trigger,
            content: discovery
        });
    }
}

// Permanent progression unlock definitions.
for (const unlock of progressionUnlocks) {
    unlockManager.registerUnlock({
        id: unlock.id,
        initialUnlocked: unlock.initialUnlocked
    });

    eventProcessor.registerEvent({
        id: `progression:${unlock.id}`,
        trigger: unlock.trigger,
        content: unlock
    });
}

let activeTab = "lab";
let ui = {};
const gatheringFields = new Map();
const fieldNewBadges = new Map();

let fieldWorkView = "selector";
let gatheringField = null;

const announce = new Announce();

let announcementsEnabled = false;

function showAnnouncement(announcement) {
    if (!announcementsEnabled) return;

    announce.show(announcement);
}

const resourcePopups = new ResourcePopups({
    formatNumber,
    maxVisible: 5
});

function save() {
    saveManager.save(game);
}

function resetGame() {
    const fresh = saveManager.freshGame();

    // Persist the fresh game before changing the active session.
    if (!saveManager.save(fresh)) {
        alert("Could not reset the game because the new save failed.");
        return;
    }

    game = fresh;

    // Rebuild all UI and in-memory state from the saved fresh game.
    window.location.reload();
}

const unreadManager = new UnreadManager({
    getGame: () => game,
    save,
    onChange: () => {
        ui.tabs?.update({ refreshContent: false });
        updateFieldSelectionButtonBadge();
        refreshFieldNewBadges();
    },
    isTabActive: tabId => activeTab === tabId
});

function notifyUnread(tabId, itemId, options = {}) {
    unreadManager.notify(tabId, itemId, options);
}

// Starting conditions
if (unlockManager.unlock("labValley")) {
    notifyUnread("gathering", "field-labValley");
}

function logEvent(game, message, options = {}) {
    return addLog(game, message, {
        onUnread: notifyUnread,
        ...options
    });
}

function handleFieldUnlock(fieldId, { notify = true } = {}) {
    if (!unlockManager.unlock(fieldId)) return false;

    const field = FIELD_DEFINITIONS.find(item => item.id === fieldId);

    if (!field) return false;

    if (notify) {
        notifyUnread("gathering", `field-${fieldId}`);
    }

    logEvent(game, `NEW FIELD AVAILABLE: ${field.name} unlocked.`, {
        category: "activity",
        tab: "log"
    });

    if (notify) {
        showToast(`${field.name} unlocked!`);

        showAnnouncement({
            title: "NEW FIELD AVAILABLE",
            message: `${field.name}: ${field.description}`
        });
    }

    return true;
}

function discoverMaterial(material, source = "recovery") {
    if (!material?.id || material.category !== "raw") {
        return false;
    }

    game.operations ??= {};
    game.operations.discoveredMaterials ??= {};

    const records = game.operations.discoveredMaterials;

    if (records[material.id]) {
        return false;
    }

    records[material.id] = {
        discoveredAt: Date.now(),
        source,
        notes: ""
    };

    logEvent(game, `NEW MATERIAL DISCOVERED: ${material.name}.`, {
        category: "activity",
        tab: "log",
        notificationTargets: [
            {
                tab: "operations",
                itemId: `material-${material.id}`
            }
        ]
    });

    showAnnouncement({
        title: "NEW MATERIAL DISCOVERED",
        message: `${material.name}: ${
            material.description ??
            "A new raw material has been added to the research inventory."
        }`
    });

    return true;
}

// Persistent Operations state.
game.operations ??= {};

// Quantum Field is temporarily inactive.
game.operations.quantumFieldUnlocked = false;

const synthesisPanel = new SynthesisPanel({
    getGame: () => game,
    save,
    refreshUI: options => refreshUI(options),
    showToast: message => showToast(message),
    processProgression
});

const discoveryPanel = new DiscoveryPanel({
    getGame: () => game,
    discoveries,
    resourceDefinitions,
    canAfford,
    costLabel,

    hasEventOccurred: id => eventProcessor.hasOccurred(`observation:${id}`),

    completeInvestigation,

    showToast: message => showToast(message),
    unreadManager
});

const logPanel = new LogPanel({
    getGame: () => game,
    unreadManager,
    onChange: () => refreshUI({ database: true }),
    onNavigate: target => navigateToItem(target)
});

const journalPanel = new JournalPanel({
    getGame: () => game
});

function updateInventory() {
    ui.inventory?.update();
}

function navigateTo(target = {}) {
    return coordinateNavigation(ui.tabs, target);
}

function navigateToItem(target) {
    return navigateTabToItem(ui.tabs, target);
}

function registerFieldNavigationPages() {
    registerPage("gathering", "selector", {
        activate: () => {
            fieldWorkView = "selector";
            ui.fieldSelectionButton = null;
            ui.tabs?.update({ refreshContent: true });
            return true;
        }
    });

    for (const field of FIELD_DEFINITIONS) {
        registerPage("gathering", field.id, {
            activate: () => {
                if (!unlockManager.isUnlocked(field.id)) {
                    console.warn(`[Navigation] Failed: gathering/${field.id}`, {
                        reason: "field-locked"
                    });
                    return false;
                }

                game.appState.navigation.activeFieldId = field.id;

                unreadManager.markRead("gathering", `field-${field.id}`);

                save();

                gatheringField = getGatheringField(field.id);
                fieldWorkView = "field";

                ui.tabs?.update({ refreshContent: true });

                return true;
            }
        });
    }
}

registerFieldNavigationPages();

function renderDatabasePanel(title, count, content) {
    return el("section", { className: "database-view" }, [
        el("div", { className: "section-heading" }, [
            el("div", {}, [
                el("div", { className: "eyebrow", text: "LAB DATABASE" }),
                el("h2", { text: title })
            ]),
            el("span", {
                className: "count-pill",
                text: count
            })
        ]),
        content
    ]);
}

function updateActiveDatabaseCount(count) {
    const countPill = ui.tabs?.panel?.querySelector(
        ".database-view .count-pill"
    );

    if (countPill) {
        countPill.textContent = count;
    }
}

// ========================================
// TAB CONTENT RENDERERS
// ========================================

function renderLabTab() {
    return ui.labContent;
}

function renderGatheringTab() {
    if (fieldWorkView === "field") {
        return renderFieldWorkContent(renderActiveField());
    }

    updateFieldCards();

    return renderFieldWorkContent(renderFieldSelector());
}

function renderFieldSelector() {
    updateFieldCards();
    return ui.fieldSelection;
}

function getFieldNewBadge(fieldId) {
    if (!fieldNewBadges.has(fieldId)) {
        fieldNewBadges.set(
            fieldId,
            new NewBadge({
                unreadManager,
                tabId: "gathering",
                itemId: `field-${fieldId}`,
                getElement: () =>
                    [
                        ...(ui.fieldCards?.querySelectorAll(
                            "[data-field-title]"
                        ) ?? [])
                    ].find(element => element.dataset.fieldTitle === fieldId),
                placement: "inline",
                ariaLabel: "New field"
            })
        );
    }

    return fieldNewBadges.get(fieldId);
}

function refreshFieldNewBadges() {
    for (const field of FIELD_DEFINITIONS) {
        getFieldNewBadge(field.id).refresh();
    }
}

function hasUnreadFieldContent() {
    return FIELD_DEFINITIONS.some(field =>
        unreadManager.isUnread("gathering", `field-${field.id}`)
    );
}

function updateFieldSelectionButtonBadge() {
    const button = ui.fieldSelectionButton;

    if (!button) return;

    // Remove the previous badge before recalculating.
    button.querySelector(".field-selection-button__badge")?.remove();

    if (!hasUnreadFieldContent()) return;

    button.append(
        Badge({
            text: "NEW",
            variant: "new",
            className: "field-selection-button__badge",
            ariaLabel: "New field content"
        })
    );
}

function renderActiveField() {
    gatheringField = getGatheringField();

    const selectionButton = Button(
        "← FIELD SELECTIONS",
        () => {
            fieldWorkView = "selector";
            ui.fieldSelectionButton = null;

            ui.tabs?.update({ refreshContent: true });
        },
        { variant: "secondary-button" }
    );

    ui.fieldSelectionButton = selectionButton;

    // Show NEW if any field-selection content is unread.
    updateFieldSelectionButtonBadge();

    return el(
        "div",
        {
            className: "field-work-active-view"
        },
        [
            el(
                "div",
                {
                    className: "field-work-toolbar"
                },
                [selectionButton]
            ),

            gatheringField.getElement(),

            el("div", { className: "field-upgrade-grid" }, [
                Card(
                    "Improved Tools",
                    el("p", {
                        className: "muted",
                        text: "Better equipment could improve material recovery."
                    }),
                    "FIELD UPGRADE",
                    {
                        tabId: "gathering",
                        itemId: "field-upgrade-tools",
                        icon: "🛠️",
                        variant: "upgrade"
                    }
                ),

                Card(
                    "Efficient Extraction",
                    el("p", {
                        className: "muted",
                        text: "Refine field procedures to recover samples more efficiently."
                    }),
                    "FIELD UPGRADE",
                    {
                        tabId: "gathering",
                        itemId: "field-upgrade-extraction",
                        icon: "⚙️",
                        variant: "upgrade"
                    }
                )
            ])
        ]
    );
}

function renderFieldWorkContent(content) {
    return el("div", { className: "field-work-content" }, [content]);
}

function renderSynthesisTab() {
    return synthesisPanel.getElement();
}

function renderEquipmentTab() {
    return renderDatabasePanel(
        "Lab Equipment",
        `${Object.values(game.upgrades).reduce((a, b) => a + b, 0)} levels`,
        upgradePanel.render()
    );
}

function renderPlanTab() {
    return planPanel.getElement();
}

function renderLogTab() {
    return renderDatabasePanel(
        "Experiment Log",
        `${game.log.length} entries`,
        logPanel.render()
    );
}

function renderJournalTab() {
    return journalPanel.getElement();
}

function renderDebugTab() {
    return debugPanel.getElement();
}

// ========================================
// TAB REGISTRATION
// ========================================

function renderTabContent() {
    const tabDefinitions = [
        {
            id: "debug",
            label: "DEBUG",
            render: renderDebugTab
        },
        {
            id: "lab",
            label: "LAB",
            render: renderLabTab
        },
        {
            id: "gathering",
            label: "FIELD WORK",
            render: renderGatheringTab
        },
        {
            id: "synthesis",
            label: "SYNTHESIS",
            render: renderSynthesisTab
        },
        {
            id: "equipment",
            label: "EQUIPMENT",
            render: renderEquipmentTab
        },
        {
            id: "plan",
            label: "PLAN",
            render: renderPlanTab
        },
        {
            id: "log",
            label: "LAB LOG",
            render: renderLogTab
        },
        {
            id: "journal",
            label: "JOURNAL",
            render: renderJournalTab
        }
    ];

    const tabs = new Tabs({
        activeId: activeTab,
        label: "Laboratory sections",
        unreadManager,
        tabs: tabDefinitions.map(tab => ({
            ...tab,
            unread: [
                "gathering",
                "observations",
                "equipment",
                "log",
                "operations"
            ].includes(tab.id)
        })),
        onChange: id => {
            activeTab = id;
            updateActiveTabUI();
        }
    });

    ui.tabs = tabs;

    return tabs.element;
}

const toast = new Toast();

function showToast(message, options) {
    toast.show(message, options);
}

function processProgression({ notify = true } = {}) {
    let changed = false;
    let batch;

    // Process repeatedly because completing one discovery
    // can satisfy another event's trigger.
    do {
        batch = eventProcessor.process();

        for (const event of batch) {
            const { id, definition } = event;
            const content = definition.content;

            // Progression system becomes permanently available.
            if (id.startsWith("progression:")) {
                const unlockId = id.slice("progression:".length);

                if (!unlockManager.unlock(unlockId)) continue;

                logEvent(game, `NEW SYSTEM AVAILABLE: ${content.name}.`, {
                    category: "activity",
                    tab: "log"
                });

                if (notify) {
                    showToast(`${content.name} unlocked!`);
                }

                changed = true;
                continue;
            }

            // Ordinary scientific discovery.
            if (id.startsWith("discovery:")) {
                const completed = completeDiscovery(game, content, {
                    onUnread: notifyUnread,
                    onProgress: processProgression
                });

                if (completed) {
                    changed = true;
                }

                continue;
            }

            // Hidden observation becomes available.
            if (id.startsWith("observation:")) {
                const observation = content;
                const announcement = observation.announcement;

                logEvent(
                    game,
                    `ALERT: ${announcement?.message ?? observation.name}`,
                    {
                        category: "important",
                        tab: "observations",
                        contentId: observation.id,
                        notificationTargets: [
                            {
                                tab: "observations",
                                itemId: observation.id
                            }
                        ]
                    }
                );

                if (notify && announcement) {
                    showAnnouncement(announcement);
                }

                changed = true;
                continue;
            }

            // Upgrade becomes permanently available.
            if (id.startsWith("upgrade:")) {
                const upgradeId = id.slice("upgrade:".length);

                if (!unlockManager.unlock(upgradeId)) {
                    continue;
                }

                const upgrade = content;

                if (upgrade) {
                    if (notify) {
                        notifyUnread("equipment", upgradeId);
                    }

                    logEvent(
                        game,
                        `NEW EQUIPMENT AVAILABLE: ${upgrade.name}.`,
                        {
                            category: "activity",
                            tab: "equipment"
                        }
                    );

                    if (notify) {
                        showToast(`${upgrade.name} unlocked!`);
                    }
                }

                changed = true;
                continue;
            }

            // Gathering field becomes permanently available.
            if (id.startsWith("field:")) {
                const fieldId = id.slice("field:".length);

                if (handleFieldUnlock(fieldId, { notify })) {
                    changed = true;
                }
            }
        }
    } while (batch.length > 0);

    // The remembered field must always remain unlocked.
    const navigation = game.appState.navigation;
    const activeFieldId = navigation.activeFieldId;

    if (activeFieldId && !unlockManager.isUnlocked(activeFieldId)) {
        navigation.activeFieldId = null;
        changed = true;
    }

    if (changed) {
        save();
    }

    return changed;
}

function completeInvestigation(item) {
    if (!item?.id) return false;

    if (!eventProcessor.hasOccurred(`observation:${item.id}`)) {
        return false;
    }

    game.discoveries ??= [];

    if (game.discoveries.includes(item.id)) {
        return false;
    }

    if (!payCost(game, item.cost ?? {})) {
        return false;
    }

    game.discoveries.push(item.id);

    logEvent(
        game,
        `INVESTIGATION COMPLETE: ${item.name}. ${item.description}`,
        {
            category: "important",
            tab: "observations",
            contentId: item.id,
            notificationTargets: [
                {
                    tab: "observations",
                    itemId: item.id
                }
            ]
        }
    );

    save();
    refreshUI({ database: true });

    return true;
}

// Evaluate conditions already satisfied by the loaded save.
// Suppress transient notifications during initial startup.
processProgression({ notify: false });

function runExperiments(count = 1, event = null, costs = []) {
    const result = stir(game, count, {
        onProgress: processProgression,
        onUnread: notifyUnread
    });

    const changes = [
        ...costs,
        { amount: result.energy, icon: "⚡" },
        { amount: result.particles, icon: "⚛️" },
        { amount: result.research, icon: "🔬" },
        { amount: result.exoticMatter, icon: "🌀" }
    ];

    if (count > 1) {
        addLog(game, `BATCH COMPLETE: ${count} experiments run.`);
    }

    // Combine gains and costs for each resource.
    const totals = new Map();

    for (const change of changes) {
        if (!change.amount) continue;

        totals.set(change.icon, (totals.get(change.icon) ?? 0) + change.amount);
    }

    const popups = [...totals.entries()]
        .filter(([, amount]) => amount !== 0)
        .map(([icon, amount]) => ({ icon, amount }));

    save();
    refreshUI({ database: true });
    resourcePopups.show(popups, event);
}

function getExperimentProgress() {
    const milestones = discoveries.filter(
        item => !item.hidden && item.trigger?.type === "experimentCount"
    );

    const nextDiscovery = milestones.find(
        item => !game.discoveries.includes(item.id)
    );

    const finalMilestone = milestones.at(-1);

    if (!finalMilestone) {
        return {
            nextDiscovery: null,
            value: 0,
            max: 1
        };
    }

    const nextRequirement =
        nextDiscovery?.trigger?.min ?? finalMilestone?.trigger?.min ?? 0;
    const finalRequirement = finalMilestone.trigger.min;

    return {
        nextDiscovery,
        value: nextDiscovery
            ? Math.min(game.clicks, nextRequirement)
            : finalRequirement,
        max: nextDiscovery ? nextRequirement : finalRequirement
    };
}

function getGatheringField(fieldId = game.appState.navigation.activeFieldId) {
    const field =
        FIELD_DEFINITIONS.find(item => item.id === fieldId) ??
        FIELD_DEFINITIONS[0];

    if (!gatheringFields.has(field.id)) {
        gatheringFields.set(
            field.id,
            new GatheringField({
                field,
                onGather: (event, target) => {
                    const result = recoverMaterial(
                        game,
                        target.id,
                        target.richness ?? 1
                    );
                    if (!result.ok) {
                        showToast(result.reason);
                        return false;
                    }

                    resourcePopups.show(
                        [
                            {
                                amount: result.amount ?? 1,
                                icon: result.item.icon,
                                materialId: result.item.id
                            }
                        ],
                        event
                    );

                    const newlyDiscovered = discoverMaterial(
                        result.item,
                        "gathering-field"
                    );

                    if (newlyDiscovered) {
                        showToast(
                            `New material discovered: ${result.item.name}`
                        );
                    }

                    processProgression();
                    save();
                    refreshUI({ database: true });

                    return true;
                }
            })
        );
    }

    return gatheringFields.get(field.id);
}

function updateFieldCards() {
    if (!ui.fieldCards) return;

    const cards = FIELD_DEFINITIONS.map(field => {
        const unlocked = unlockManager.isUnlocked(field.id);
        const active = game.appState.navigation.activeFieldId === field.id;

        const selectButton = el(
            "button",
            {
                type: "button",
                className: "field-selection-card__main",
                disabled: !unlocked,
                "aria-label": unlocked
                    ? `Select ${field.name}`
                    : `${field.name}, locked`,
                onClick: () => {
                    if (!unlocked) return;

                    game.appState.navigation.activeFieldId = field.id;
                    save();
                    updateFieldCards();
                }
            },
            [
                el("span", {
                    className: "field-selection-card__icon",
                    text: field.icon ?? "◈"
                }),
                el(
                    "span",
                    {
                        className: "field-selection-card__copy"
                    },
                    [
                        el(
                            "span",
                            {
                                className: "field-selection-card__title",
                                dataset: { fieldTitle: field.id }
                            },
                            [el("strong", { text: field.name })]
                        ),

                        el("span", {
                            className: "field-selection-card__description",
                            text: unlocked
                                ? field.description
                                : `Requires ${field.unlockTrigger?.amount ?? 0} ${
                                      field.unlockTrigger?.item ?? "resources"
                                  } Samples`
                        })
                    ]
                )
            ]
        );

        const actions = el(
            "span",
            { className: "field-selection-card__actions" },
            [
                el("span", {
                    className: "field-selection-card__status",
                    text: !unlocked
                        ? "LOCKED"
                        : active
                          ? "SELECTED"
                          : "AVAILABLE"
                }),
                ...(unlocked && active
                    ? [
                          Button(
                              "GO",
                              () => {
                                  navigateTo({
                                      tab: "gathering",
                                      pageId: field.id
                                  });
                              },
                              { variant: "primary-button" }
                          )
                      ]
                    : [])
            ]
        );

        return el(
            "div",
            {
                className: [
                    "field-selection-card",
                    unlocked ? "is-unlocked" : "is-locked",
                    active ? "is-active" : ""
                ]
                    .filter(Boolean)
                    .join(" ")
            },
            [selectButton, actions]
        );
    });

    ui.fieldCards.replaceChildren(...cards);
    refreshFieldNewBadges();
}

function updateOperationsUI() {
    // Announcements are independent of the Quantum Field panel.
    updateFieldCards();

    const unlocked = Boolean(game.operations?.quantumFieldUnlocked);
    const panel = ui.quantumFieldPanel;

    if (!panel) return;

    if (unlocked && panel.locked) {
        panel.unlock({
            unread: unreadManager.isUnread("operations", "quantum-field"),
            expanded: false
        });
    } else if (!unlocked && !panel.locked) {
        panel.setLocked(true);
    }

    if (unlocked && panel.status !== "AVAILABLE") {
        panel.setStatus("AVAILABLE");
    }

    // Keep the panel indicator synchronized with persisted unread state.
    panel.setUnread(unreadManager.isUnread("operations", "quantum-field"));
}

function updateActiveTabUI() {
    switch (activeTab) {
        case "debug":
            debugPanel.update();
            break;
        case "lab":
            updateLabTab();
            break;

        case "gathering":
            updateGatheringTab();
            break;

        case "synthesis":
            synthesisPanel.update();
            break;

        case "equipment":
            updateEquipmentTab();
            break;

        case "plan":
            updatePlanTab();
            break;

        case "log":
            updateLogTab();
            break;

        case "journal":
            updateJournalTab();
            break;
    }
}

function updateExperimentUI() {
    if (!ui.experimentProgress) return;

    const { nextDiscovery, value, max } = getExperimentProgress();

    ui.experimentCount.textContent = `${formatNumber(game.clicks)} experiments completed`;

    ui.runTenButton.disabled = (game.inventory.particles ?? 0) < 10;

    ui.convertButton.disabled = (game.inventory.particles ?? 0) <= 0;

    const progressLabel = ui.experimentProgress.querySelector(
        ".progress-label span:first-child"
    );

    if (progressLabel) {
        progressLabel.textContent = nextDiscovery
            ? `Experiment progress:`
            : "Observation index complete";
    }

    ui.experimentProgress.setValue(value, max);
}

function updateLabTab() {
    // TODO: updateLabUI();
}

function updateGatheringTab() {
    if (fieldWorkView === "field") {
        gatheringField = getGatheringField();
        gatheringField.update();
    } else {
        updateFieldCards();
    }
}

function updateEquipmentTab() {
    upgradePanel.update();

    updateActiveDatabaseCount(
        `${Object.values(game.upgrades).reduce((a, b) => a + b, 0)} levels`
    );
}

function updatePlanTab() {
    planPanel.update();
}

function updateLogTab() {
    logPanel.update();

    updateActiveDatabaseCount(`${game.log.length} entries`);
}

function updateJournalTab() {
    journalPanel.update();
}

function updateSharedUI() {
    syncInventoryDiscovery(game);
    updateInventory();
}

function refreshUI({ database = false } = {}) {
    if (!ui.layout) {
        render();
        return;
    }

    updateSharedUI();

    if (database) {
        /// Refresh navigation, unread indicators, and the active panel.
        ui.tabs.update({ refreshContent: true });
    }

    updateActiveTabUI();
}

const upgradePanel = new UpgradePanel({
    getGame: () => game,
    upgradeDefinitions,
    resourceDefinitions,
    upgradeCost,
    canAfford,

    buyUpgrade: (game, id) => {
        const purchased = buyUpgrade(game, id);

        if (purchased) {
            processProgression();
        }

        return purchased;
    },

    isUnlocked: id => unlockManager.isUnlocked(id),

    costLabel,
    save,
    showToast: message => showToast(message),
    refreshUI: options => refreshUI(options),
    unreadManager
});

const planPanel = new PlanPanel({
    getGame: () => game,
    save,
    refreshUI: options => refreshUI(options),

    onCellSelect: (plan, cell, state) => {
        if (state.insufficientResearch) {
            showToast("Not enough Research points.");
            return;
        }

        if (state.revealed) {
            // Later: open tile details and modification controls.
        }
    },

    onEvidence: (plan, cell) => {
        logEvent(
            game,
            `PLAN ${plan.number}: Evidence recorded for ${cell.id}. ${cell.evidence}`,
            { category: "discovery", tab: "log" }
        );
    },

    onHiddenUnlock: (plan, cell, clue) => {
        logEvent(game, `ANOMALY // ${clue.title}: ${clue.message}`, {
            category: "important",
            tab: "log"
        });

        showToast(`New observation: ${clue.title}`);
    },

    onComplete: plan => {
        logEvent(
            game,
            `PLAN ${plan.number} COMPLETE: ${plan.name} has been reconstructed. The model is ready for further investigation.`,
            { category: "important", tab: "log" }
        );

        showToast(`PLAN ${plan.number} reconstructed.`);
    }
});

function render() {
    if (!app) return;

    if (ui.layout) {
        updateSharedUI();
        return;
    }

    const { nextDiscovery, value, max } = getExperimentProgress();

    const intro = el("section", { className: "lab-intro sim-card" }, [
        el("div", {
            className: "eyebrow",
            text: "RESEARCH FACILITY // SECTOR 01"
        }),
        el("h1", { text: "The Quantum Laboratory" }),
        el("p", {
            text: "The field generator is online. Your instruments are calibrated just well enough to begin. Produce quantum energy, observe particle formation, and record anything that should not be possible."
        }),
        el("div", {
            className: "lab-warning",
            text: "⚠ RESEARCH NOTE: Theoretical safety limits are not the same as proven safety limits."
        })
    ]);

    const orb = el(
        "button",
        {
            className: "quantum-orb",
            type: "button",
            "aria-label": "Run one quantum experiment",
            onClick: event => runExperiments(1, event)
        },
        [
            el("span", { className: "orb-rings" }),
            el("span", { className: "orb-symbol", text: "⚛" }),
            el("span", {
                className: "orb-button-label",
                text: "RUN EXPERIMENT"
            }),
            el("span", {
                className: "orb-sub-label",
                text: "MANUAL FIELD TEST"
            })
        ]
    );

    const experimentCount = el("div", {
        className: "experiment-count",
        text: `${formatNumber(game.clicks)} experiments completed`
    });

    ui.experimentCount = experimentCount;

    const runTenButton = Button(
        "RUN ×10",
        event => {
            if ((game.inventory.particles ?? 0) < 10) {
                showToast("Requires 10 Particles.");
                return;
            }

            removeInventoryItem(game, "particles", 10);

            addLog(
                game,
                "BATCH: Consumed 10 Particles to run ten experiments."
            );
            runExperiments(10, event, [{ amount: -10, icon: "⚛️" }]);
        },
        {
            variant: "primary-button",
            disabled: (game.inventory.particles ?? 0) < 10
        }
    );

    const convertButton = Button(
        "CONVERT",
        event => {
            const result = consumeParticles(game);

            if (result.particles > 0) {
                save();

                refreshUI({ database: true });

                resourcePopups.show(
                    [
                        { amount: result.energy, icon: "⚡" },
                        { amount: -result.particles, icon: "⚛️" }
                    ],
                    event
                );
            }
        },
        {
            variant: "primary-button",
            disabled: (game.inventory.particles ?? 0) <= 0
        }
    );

    ui.runTenButton = runTenButton;
    ui.convertButton = convertButton;

    const experimentProgress = ProgressBar({
        label: nextDiscovery
            ? `Experiment progress:`
            : "Observation index complete",
        value,
        max,
        format: (value, max) =>
            nextDiscovery ? `${Math.floor(value)} / ${max}` : "COMPLETE"
    });

    ui.experimentProgress = experimentProgress;

    const fieldContent = el("div", { className: "field-panel-content" }, [
        el("p", {
            className: "muted",
            text: "Each experiment produces energy. Particle formation and research observations are probabilistic."
        }),

        el("div", { className: "quantum-orb-wrap" }, [orb]),

        experimentCount,

        el("div", { className: "bonus-actions" }, [
            el("div", { className: "bonus-row" }, [
                el("div", { className: "bonus-copy" }, [
                    el("strong", {
                        className: "bonus-title",
                        text: "EXPERIMENT ×10"
                    }),
                    el("p", {
                        className: "bonus-description",
                        text: "Consume 10 Particles to run ten experiments."
                    })
                ]),
                runTenButton
            ]),

            el("div", { className: "bonus-row" }, [
                el("div", { className: "bonus-copy" }, [
                    el("strong", {
                        className: "bonus-title",
                        text: "CONSUME PARTICLES"
                    }),
                    el("p", {
                        className: "bonus-description",
                        text: "Consume all available Particles to generate Energy."
                    }),
                    el("p", {
                        className: "bonus-rate",
                        text: "+5 ⚡ Energy per Particle"
                    })
                ]),
                convertButton
            ])
        ]),

        experimentProgress
    ]);

    const quantumFieldPanel = new CollapsiblePanel({
        eyebrow: "INACTIVE SYSTEM",
        title: "Quantum Field",
        status: "INACTIVE",
        content: fieldContent,
        expanded: false,
        locked: !game.operations.quantumFieldUnlocked,
        unread: unreadManager.isUnread("operations", "quantum-field"),
        onAcknowledge: () => {
            unreadManager.markRead("operations", "quantum-field");
        }
    });

    ui.quantumFieldPanel = quantumFieldPanel;

    ui.fieldSelection = el(
        "section",
        {
            className: "field-selection-section"
        },
        [
            el("div", {
                className: "eyebrow",
                text: "GATHERING LOCATIONS"
            }),
            el("h2", { text: "Select a Field" }),
            el("p", {
                className: "muted",
                text: "Choose a field, then enter it when you're ready."
            }),
            (ui.fieldCards = el("div", {
                className: "field-selection-list"
            }))
        ]
    );

    updateFieldCards();

    const resetPanel = el(
        "section",
        {
            className: "reset-actions"
        },
        [
            Button(
                "RESET GAME",
                () => {
                    if (
                        confirm(
                            "Reset Quantum Foundations progress? This does not affect your older Origins save."
                        )
                    ) {
                        resetGame();
                    }
                },
                {
                    variant: "secondary-button"
                }
            )
        ]
    );

    ui.labContent = el(
        "div",
        {
            className: "lab-tab-content"
        },
        [intro, resetPanel]
    );

    const topbar = el("header", { className: "topbar" }, [
        el("div", { className: "brand" }, [
            el("div", { className: "brand-mark", text: "⚛" }),
            el("div", {}, [
                el("div", {
                    className: "brand-name",
                    text: "kSim — Beyond Reality"
                }),
                el("div", {
                    className: "brand-subtitle",
                    text: "QUANTUM FOUNDATIONS"
                })
            ])
        ]),
        el("span", {
            className: "stage-pill",
            text: "LAB 01"
        })
    ]);

    ui.inventory = new Inventory({
        getGame: () => game,
        formatNumber
    });

    gatheringField = getGatheringField(game.appState.navigation.activeFieldId);

    const layout = el("div", { className: "game-layout" }, [
        topbar,
        ui.inventory.element,
        renderTabContent()
    ]);

    ui.layout = layout;
    app.replaceChildren(layout);

    updateSharedUI();
    updateLabTab();
}

window.kSim = {
    get data() {
        return game;
    },
    save,
    render,
    stir: (multiplier = 1) => {
        const result = stir(game, multiplier, {
            onProgress: processProgression,
            onUnread: notifyUnread
        });

        save();
        refreshUI({ database: true });

        return result;
    },
    experiment: runExperiments,
    clearStorage: () => saveManager.clear(),
    reset: resetGame,
    testAnnouncement: () =>
        showAnnouncement({
            title: "NOTIFICATION TEST",
            message: "The new announcement system is working."
        })
};

// FINAL STATE
announcementsEnabled = true;
render();

// ADD DEBUG

const debugPanel = new DebugPanel({
    getGame: () => game,
    save,
    refreshUI: options => refreshUI(options),
    showToast: message => showToast(message),
    processProgression,
    actions: [
        {
            label: "debugCatalog",
            run: () => debugCatalog()
        },
        {
            label: "Process Progression",
            run: () => {
                processProgression();
                refreshUI({ database: true });
                showToast("Progression processed.");
            }
        },
        {
            label: "Test Log Entry",
            run: () => {
                logEvent(game, "DEBUG: Test log entry.", {
                    category: "activity",
                    tab: "log"
                });

                refreshUI({ database: true });
            }
        },
        {
            label: "Test Announcement",
            run: () => {
                showAnnouncement({
                    title: "DEBUG ANNOUNCEMENT",
                    message: "Testing the announcement system."
                });
            }
        }
    ]
});

initializeDebug({
    ui,
    el,
    Card,
    Button,
    ProgressBar
});

function debugCatalog() {
    console.group("JOURNAL CATALOG TESTS");

    let passed = 0;
    let failed = 0;

    function test(name, condition, details = "") {
        if (condition) {
            passed++;
            console.log(`PASS: ${name}`, details);
        } else {
            failed++;
            console.error(`FAIL: ${name}`, details);
        }
    }

    // --------------------------------------------------
    // CATALOG
    // --------------------------------------------------

    console.group("Catalog");

    test(
        "Catalog contains entries",
        journalCatalog.length > 0,
        `Total: ${journalCatalog.length}`
    );

    test(
        "LAB location exists",
        getJournalEntry("lab", "location") !== null
    );

    test(
        "Quartz material exists",
        getJournalEntry("quartz", "material") !== null
    );

    test(
        "Quartz field exists",
        getJournalEntry("quartz", "field") !== null
    );

    test(
        "Energy resource exists",
        getJournalEntry("energy", "resource") !== null
    );

    test(
        "Missing entry returns null",
        getJournalEntry("doesNotExist") === null
    );

    test(
        "Type-aware lookup distinguishes Quartz",
        getJournalEntry("quartz", "material")?.type === "material" &&
        getJournalEntry("quartz", "field")?.type === "field"
    );

    console.groupEnd();

    // --------------------------------------------------
    // CATEGORIES AND TYPES
    // --------------------------------------------------

    console.group("Categories and Types");

    test(
        "Raw materials category contains Quartz",
        getJournalEntriesByCategory("rawMaterials")
            .some(entry => entry.id === "quartz")
    );

    test(
        "Recipe type returns recipes only",
        getJournalEntriesByType("recipe")
            .every(entry => entry.type === "recipe")
    );

    test(
        "Visible entries exclude hidden entries",
        getVisibleJournalEntries()
            .every(entry => !entry.metadata.hidden)
    );

    console.groupEnd();

    // --------------------------------------------------
    // METADATA
    // --------------------------------------------------

    console.group("Metadata");

    const lab = getJournalEntry("lab", "location");

    test(
        "LAB has Journal category",
        lab?.category === "locations"
    );

    test(
        "LAB metadata has no duplicate category",
        !Object.hasOwn(lab?.metadata ?? {}, "category")
    );

    test(
        "LAB has hidden metadata",
        lab?.metadata.hidden === false
    );

    test(
        "LAB has tags",
        Array.isArray(lab?.metadata.tags) &&
        lab.metadata.tags.includes("hub")
    );

    console.groupEnd();

    // --------------------------------------------------
    // RECIPE RELATIONSHIPS
    // --------------------------------------------------

    console.group("Recipe Relationships");

    const quartzRecipes = getRecipesUsing("quartz");
    const powderRecipes = getRecipesProducing("quartzPowder");

    test(
        "Quartz is used by Crush Quartz",
        quartzRecipes.some(recipe => recipe.id === "crushQuartz")
    );

    test(
        "Quartz is used by Phase-Stable Crystal",
        quartzRecipes.some(recipe =>
            recipe.id === "fabricatePhaseStableCrystal"
        )
    );

    test(
        "Quartz Powder is produced by Crush Quartz",
        powderRecipes.some(recipe => recipe.id === "crushQuartz")
    );

    test(
        "Energy is indexed as a recipe input",
        getRecipesUsing("energy").some(recipe =>
            recipe.id === "crushQuartz"
        )
    );

    test(
        "Unknown recipe input returns empty array",
        getRecipesUsing("doesNotExist").length === 0
    );

    console.groupEnd();

    // --------------------------------------------------
    // RECIPE ITEM LOOKUPS
    // --------------------------------------------------

    console.group("Recipe Items");

    const inputs = getRecipeInputs("crushQuartz");
    const outputs = getRecipeOutputs("crushQuartz");

    const quartzInput = inputs.find(item => item.id === "quartz");
    const energyInput = inputs.find(item => item.id === "energy");
    const powderOutput = outputs.find(item => item.id === "quartzPowder");

    test(
        "Quartz input resolves as material",
        quartzInput?.item?.type === "material"
    );

    test(
        "Quartz input amount is 3",
        quartzInput?.amount === 3
    );

    test(
        "Energy input resolves as resource",
        energyInput?.item?.type === "resource"
    );

    test(
        "Energy input amount is 2",
        energyInput?.amount === 2
    );

    test(
        "Quartz Powder output resolves as material",
        powderOutput?.item?.type === "material"
    );

    test(
        "Quartz Powder output amount is 2",
        powderOutput?.amount === 2
    );

    test(
        "Unknown recipe returns empty inputs",
        getRecipeInputs("doesNotExist").length === 0
    );

    test(
        "Unknown recipe returns empty outputs",
        getRecipeOutputs("doesNotExist").length === 0
    );

    console.groupEnd();

    // --------------------------------------------------
    // FIELD RELATIONSHIPS
    // --------------------------------------------------

    console.group("Field Relationships");

    const labValleyMaterials = getFieldMaterials("labValley");
    const quartzField = getMaterialField("quartz");

    test(
        "Lab Valley returns materials",
        labValleyMaterials.length > 0
    );

    test(
        "Lab Valley contains Quartz",
        labValleyMaterials.some(item => item.id === "quartz")
    );

    test(
        "Lab Valley material entries resolve",
        labValleyMaterials.every(item =>
            item.material?.type === "material"
        )
    );

    test(
        "Quartz resolves to Quartz field",
        quartzField?.id === "quartz" &&
        quartzField?.type === "field"
    );

    test(
        "Unknown field returns empty materials",
        getFieldMaterials("doesNotExist").length === 0
    );

    test(
        "Unknown material returns null field",
        getMaterialField("doesNotExist") === null
    );

    console.log("Lab Valley materials:", labValleyMaterials);
    console.log("Quartz field:", quartzField);
    console.log("Quartz field unlock:", getFieldUnlock("quartz"));

    console.groupEnd();

    // --------------------------------------------------
    // SUMMARY
    // --------------------------------------------------

    console.log("----------------------------------");
    console.log(`CATALOG TESTS: ${passed} passed, ${failed} failed`);
    console.log("----------------------------------");

    console.groupEnd();

    return { passed, failed };
}
