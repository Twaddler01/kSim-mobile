// main.js
import ExplorationDemo from "./src/ui/panels/ExplorationDemo.js";
// ===================================
// IMPORTS
// ===================================

// Debug
import attachDebugPanel from "./debug/attach.js";

// Panels
import DiscoveryPanel from "./src/ui/panels/DiscoveryPanel.js";
import SynthesisPanel from "./src/ui/panels/SynthesisPanel.js";
import UpgradePanel from "./src/ui/panels/UpgradePanel.js";
import LogPanel from "./src/ui/panels/LogPanel.js";
import JournalPanel from "./src/ui/panels/journal/JournalPanel.js";
import PlanPanel from "./src/ui/panels/PlanPanel.js";
import GatheringField from "./src/ui/panels/GatheringField.js";
import Inventory from "./src/ui/panels/Inventory.js";
// TODO
import ExperimentPanel from "./src/ui/panels/ExperimentPanel.js";

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

/* TODO
const experimentPanel = new ExperimentPanel({
    getGame: () => game,
    discoveries,
    save,
    refreshUI: options => refreshUI(options),
    showToast: message => showToast(message),
    processProgression,
    notifyUnread,
    resourcePopups,
    unreadManager
});
*/

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
    id: "explore",
    label: "EXPLORE",
    render: renderExploreTab
},
        // TODO: Attach ExperimentPanel to its own tab once the
        // experiments system unlocks in progression.
        //
        // {
        //     id: "experiments",
        //     label: "EXPERIMENTS",
        //     render: () => experimentPanel.getElement()
        // },
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

            // TODO
            // Hidden observation becomes available.
            if (id.startsWith("observation:")) {
                console.warn('TODO: observations tab');
                return;
                
                /*const observation = content;
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
                continue;*/
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

function updateActiveTabUI() {
    // Stop the canvas loop when we're not on the explore tab.
    if (activeTab !== "explore") {
        explorationDemo.deactivate();
    }

    switch (activeTab) {
        case "explore":
            explorationDemo.update(); // activates if needed
            break;
        case "debug":
            debugPanel.update();
            break;
        case "lab":
            updateLabTab();
            break;
        // TODO
        // case "experiments":
        //     experimentPanel.update();
        //     break;
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

function updateLabTab() {
    // The LAB tab currently renders only the static intro + reset panel.
    // Experiment UI lives in ExperimentPanel and will move to its own tab
    // once the experiments system unlocks.
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

function renderExploreTab() {
    return explorationDemo.getElement();
}

const explorationDemo = new ExplorationDemo({
    showToast: message => showToast(message),
    onCollect: total => {
        // Hook point for real integration — e.g.:
        // logEvent(game, `Field sample recovered (${total} total).`, {
        //     category: "activity",
        //     tab: "log"
        // });
        // Or route it through recoverMaterial / addInventoryItem.
    }
});

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
    // TODO
    // experiment: (count = 1) => experimentPanel.runExperiments(count),
    clearStorage: () => saveManager.clear(),
    reset: resetGame
};

// --------------------------------------------------
// DEBUG TAB
// --------------------------------------------------

const debugPanel = attachDebugPanel({
    getGame: () => game,
    save,
    refreshUI,
    showToast,
    showAnnouncement,
    logEvent,
    processProgression
});

// FINAL STATE
announcementsEnabled = true;
render();