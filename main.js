// main.js

// WIP
import FieldScene from "./src/ui/panels/FieldScene.js";
import { buildMineralSprites } from "./src/data/mineralSprites.js";

let mineralSprites = {};
buildMineralSprites()
    .then(sprites => {
        mineralSprites = sprites;
        ui.fieldWorkPanel?.refreshFieldSprites?.();
        refreshUI();
    })
    .catch(err => console.error("[sprites] failed:", err));

import { buildTileSprites, getTileCache } from "./src/data/tileSprites.js";

buildTileSprites()
    .then(() => {
        ui.fieldWorkPanel?.refreshFieldBackgrounds?.();
        refreshUI();
    })
    .catch(err => console.error("[tiles] failed:", err));

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

import MainObjective from "./src/ui/panels/MainObjective.js";
import ObjectiveTracker from "./src/ui/panels/ObjectiveTracker.js";
import { tryAdvanceStage, getCurrentStage } from "./src/data/stages.js";

// mcv
import FieldWorkPanel from "./src/ui/panels/FieldWorkPanel.js";

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
game.appState.trackerEnabled ??= false;
game.progression ??= { currentStage: 1 };

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
        ui.fieldWorkPanel?.updateFieldSelectionBadge?.();
        ui.fieldWorkPanel?.refreshBadges?.();
    },
    isTabActive: tabId => activeTab === tabId
});

function notifyUnread(tabId, itemId, options = {}) {
    unreadManager.notify(tabId, itemId, options);
}

// Starting conditions
if (unlockManager.unlock("labValley")) {
    notifyUnread("fieldWork", "field-labValley");
}
unlockManager.unlock("labBorderlamds");

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
        notifyUnread("fieldWork", `field-${fieldId}`);
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

function handleFieldGather(field, event, target) {
    const result = recoverMaterial(game, target.id, target.richness ?? 1);
    if (!result.ok) {
        showToast(result.reason);
        return false;
    }
    resourcePopups.show(
        [{ amount: result.amount ?? 1, icon: result.item.icon, materialId: result.item.id }],
        event
    );
    if (discoverMaterial(result.item, "gathering-field")) {
        showToast(`New material discovered: ${result.item.name}`);
    }
    processProgression();
    save();
    refreshUI({ database: true });
    return true;
}

const fieldWorkPanel = new FieldWorkPanel({
    getGame: () => game,
    save,
    unlockManager,
    unreadManager,
    fieldDefinitions: FIELD_DEFINITIONS,
    navigateTo: target => navigateTo(target),
    showToast: message => showToast(message),
    refreshTab: () => ui.tabs?.update({ refreshContent: true }),
    resourcePopups,

    createField: field => new FieldScene({
        field,
        getSprites: () => mineralSprites,
        getTiles: () => getTileCache(),
        onGather: handleFieldGather,
    })
});

ui.fieldWorkPanel = fieldWorkPanel;

const mainObjective = new MainObjective({
    getGame: () => game,
    onToggleTracker: enabled => {
        game.appState.trackerEnabled = enabled;
        save();
        refreshUI();
    }
});

const objectiveTracker = new ObjectiveTracker({
    getGame: () => game,
    navigateToLab: () => navigateTo({ tab: "lab" })
});

// Navigation — still registered in main because it's global,
// but delegating to the panel:
registerPage("fieldWork", "selector", {
    activate: () => fieldWorkPanel.showSelector(),
});
for (const field of FIELD_DEFINITIONS) {
    registerPage("fieldWork", field.id, {
        activate: () => fieldWorkPanel.showField(field.id),
    });
}

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

function renderFieldWorkTab() {
    return fieldWorkPanel.getElement();
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
        // TODO: Attach ExperimentPanel to its own tab once the
        // experiments system unlocks in progression.
        //
        // {
        //     id: "experiments",
        //     label: "EXPERIMENTS",
        //     render: () => experimentPanel.getElement()
        // },
        {
            id: "fieldWork",
            label: "FIELD WORK",
            render: renderFieldWorkTab
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
                "lab",
                "fieldWork",
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

function updateActiveTabUI() {
    // Stop the canvas loop when we're not on the fieldWork tab.
    if (activeTab !== "fieldWork") {
        fieldWorkPanel.deactivateField?.();
    }

    if (activeTab === "lab") {
        const stage = getCurrentStage(game);
        if (stage) {
            unreadManager.markRead("lab", `objective-${stage.id}`);
        }
    }

    switch (activeTab) {
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
        case "fieldWork":
            updateFieldWorkTab();
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
    mainObjective?.update?.();
}

function updateFieldWorkTab() {
    fieldWorkPanel.update();
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

    const result = tryAdvanceStage(game);
    if (result.advanced) {
        save();
        if (result.to) {
            showToast(`Objective complete. New objective: ${result.to.name}.`);
            // Fire the LAB tab badge so the player knows to check in.
            notifyUnread("lab", `objective-${result.to.id}`);
        } else {
            showToast("Objective chain complete.");
        }
    }

    updateSharedUI();
    objectiveTracker?.update?.();

    if (database) {
        ui.tabs.update({ refreshContent: false });
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

    ui.labContent = el("div", { className: "lab-tab-content" }, [
        mainObjective.getElement(),
        intro,
        resetPanel
    ]);

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

    const layout = el("div", { className: "game-layout" }, [
        topbar,
        ui.inventory.element,
        objectiveTracker.getElement(),   // ← sibling, below inventory
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
