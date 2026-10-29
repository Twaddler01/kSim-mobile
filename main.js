import DebugButton from "./debug/DebugButtons.js";

import {
    initialGameData,
    resourceDefinitions,
    discoveries,
    upgradeDefinitions,
    FIELD_DEFINITIONS
} from "./src/data.js";
import { el } from "./src/ui/Element.js";
import { Button } from "./src/ui/Button.js";
import { ProgressBar } from "./src/ui/ProgressBar.js";
import { Tabs } from "./src/ui/Tabs/Tabs.js";
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
    checkDiscoveries,
    checkUpgradeUnlocks
} from "./src/functions.js";

import CollapsiblePanel from "./src/ui/CollapsiblePanel.js";

import Inventory from "./src/ui/Inventory.js";
import { materials } from "./src/data/materials.js";

import ResourcePopups from "./src/ui/ResourcePopups.js";
import SaveManager from "./src/SaveManager.js";
import { navigateToItem as navigateTabToItem } from "./src/ui/itemNavigation.js";
import Badge from "./src/ui/Badge.js";

// TABS
import DiscoveryPanel from "./src/ui/DiscoveryPanel.js";
import UpgradePanel from "./src/ui/UpgradePanel.js";
import LogPanel from "./src/ui/LogPanel.js";
import PlanPanel from "./src/ui/PlanPanel.js";
import GatheringField from "./src/ui/GatheringField.js";

import { ensureManufacturingState } from "./src/systems/SynthesisEngine.js";

import {
    recoverMaterial
} from "./src/systems/MaterialRecovery.js";

import UnreadManager from "./src/UnreadManager.js";
import { evaluateTrigger } from "./src/triggers/conditions.js";

import Announce from "./src/notifications/Announce.js";
import NewBadge from "./src/notifications/NewBadge.js";

const saveManager = new SaveManager({
    key: "ksim-quantum-foundations-v1",
    initialData: initialGameData
});

const app = document.getElementById("app");

let game = saveManager.load();
let activeTab = "lab";
let toastText = "";
let toastTimer = null;
let ui = {};
const gatheringFields = new Map();
const fieldNewBadges = new Map();

let fieldWorkView = "selector";
let gatheringField = null;

const announce = new Announce();

let announcementsEnabled = false;

function showAnnouncement(announcement) {
    if (!announcementsEnabled) return;

    announce.show({
        title: announcement.title,
        message: announcement.message
    });
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

function logEvent(game, message, options = {}) {
    return addLog(game, message, {
        onUnread: notifyUnread,
        ...options
    });
}

function checkGatheringFieldUnlocks() {
    game.operations ??= {};
    game.operations.unlockedFields ??= {};

    game.operations.unlockedFields.copper = true;
    game.operations.unlockedFields.stone = true;

    for (const field of FIELD_DEFINITIONS) {
        if (!field.unlockTrigger) continue;

        if (game.operations.unlockedFields[field.id]) continue;

        if (!evaluateTrigger(game, field.unlockTrigger)) continue;

        if (!unlockField(field.id)) continue;

        logEvent(game, `NEW FIELD AVAILABLE: ${field.name} unlocked.`, {
            category: "activity",
            tab: "log"
        });

        showToast(`${field.name} unlocked!`);
    }

    if (!game.operations.unlockedFields[game.operations.activeFieldId]) {
        game.operations.activeFieldId = "copper";
    }
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

// Process any event triggers already satisfied by a loaded save.
checkDiscoveries(game, notifyUnread);

ensureManufacturingState(game);

// Persistent Operations unlocks.
// Existing saves with 5+ Copper should already have Quantum Field unlocked.
game.operations ??= {};

// Quantum Field is temporarily inactive.
game.operations.quantumFieldUnlocked = false;

game.operations.unlockedFields ??= {
    labValley: true,
    copper: true,
    quartz: true
};

//game.operations.unlockedFields.copper = true;
game.operations.activeFieldId ??= "stone";

// Initialize or migrate equipment unlocks without creating
// fresh notifications for conditions already satisfied in a save.
checkUpgradeUnlocks(game, notifyUnread, { notify: false });

checkGatheringFieldUnlocks();

// Migrate existing unread field announcements to field-card badges.
for (const field of FIELD_DEFINITIONS) {
    if (
        game.operations.unlockedFields[field.id] &&
        unreadManager.isUnread("gathering", `announcement-field-${field.id}`)
    ) {
        unreadManager.notify("gathering", `field-${field.id}`);
    }
}

save();

const discoveryPanel = new DiscoveryPanel({
    getGame: () => game,
    discoveries,
    resourceDefinitions,
    canAfford,
    payCost,
    costLabel,
    addLog: logEvent,
    save,
    showToast: message => showToast(message),
    refreshUI: options => refreshUI(options),
    onUnread: notifyUnread,
    unreadManager
});

const logPanel = new LogPanel({
    getGame: () => game,
    unreadManager,
    onChange: () => refreshUI({ database: true }),
    onNavigate: target => navigateToItem(target)
});

function updateInventory() {
    ui.inventory?.update();
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

            gatheringField.getElement()
        ]
    );
}

function renderFieldWorkContent(content) {
    return el("div", { className: "field-work-content" }, [
        content
    ]);
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

// ========================================
// TAB REGISTRATION
// ========================================

function renderTabContent() {
    const tabDefinitions = [
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

function updateToast() {
    if (!ui.layout) return;

    if (!toastText) {
        ui.toast?.remove();
        ui.toast = null;
        return;
    }

    if (!ui.toast) {
        ui.toast = el("div", {
            className: "toast-message",
            role: "status"
        });
        ui.layout.append(ui.toast);
    }

    ui.toast.textContent = toastText;
}

function showToast(message) {
    toastText = message;
    updateToast();

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        toastText = "";
        updateToast();
    }, 1800);
}

function runExperiments(count = 1, event = null, costs = []) {
    const result = stir(game, count, notifyUnread, showAnnouncement);

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

function unlockField(fieldId) {
    game.operations ??= {};
    game.operations.unlockedFields ??= {};
    game.operations.fieldUnlocks ??= {};

    if (game.operations.unlockedFields[fieldId]) {
        return false;
    }

    game.operations.unlockedFields[fieldId] = true;
    game.operations.fieldUnlocks[fieldId] = {
        unlockedAt: Date.now()
    };

    // Content notification: controls the NEW badge on the field card.
    notifyUnread("gathering", `field-${fieldId}`);

    save();

    const field = FIELD_DEFINITIONS.find(item => item.id === fieldId);

    if (field) {
        showAnnouncement({
            title: "NEW FIELD AVAILABLE",
            message: `${field.name}: ${field.description}`
        });
    }

    return true;
}

function getGatheringField(fieldId = game.operations.activeFieldId) {
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

                    checkGatheringFieldUnlocks();
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

    const unlockedFields = game.operations?.unlockedFields ?? {};

    const cards = FIELD_DEFINITIONS.map(field => {
        const unlocked = Boolean(unlockedFields[field.id]);
        const active = game.operations?.activeFieldId === field.id;

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

                    game.operations.activeFieldId = field.id;
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
                                  game.operations.activeFieldId = field.id;

                                  // Acknowledge this field's content notification.
                                  unreadManager.markRead(
                                      "gathering",
                                      `field-${field.id}`
                                  );

                                  save();

                                  gatheringField = getGatheringField(field.id);
                                  fieldWorkView = "field";

                                  ui.tabs?.update({
                                      refreshContent: true
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
        case "lab":
            updateLabTab();
            break;

        case "gathering":
            updateGatheringTab();
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
    }
}

function updateExperimentUI() {
    if (!ui.experimentProgress) return;

    const { nextDiscovery, value, max } = getExperimentProgress();

    ui.experimentCount.textContent = `${formatNumber(game.clicks)} experiments completed`;

    ui.runTenButton.disabled = (game.resources.particles ?? 0) < 10;

    ui.convertButton.disabled = (game.resources.particles ?? 0) <= 0;

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

function updateSharedUI() {
    updateInventory();
    updateToast();
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
    buyUpgrade,
    costLabel,
    save,
    showToast: message => showToast(message),
    refreshUI: options => refreshUI(options),
    onUnread: notifyUnread,
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
            if ((game.resources.particles ?? 0) < 10) {
                showToast("Requires 10 Particles.");
                return;
            }

            game.resources.particles -= 10;

            addLog(
                game,
                "BATCH: Consumed 10 Particles to run ten experiments."
            );
            runExperiments(10, event, [{ amount: -10, icon: "⚛️" }]);
        },
        {
            variant: "primary-button",
            disabled: (game.resources.particles ?? 0) < 10
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
            disabled: (game.resources.particles ?? 0) <= 0
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
        resources: resourceDefinitions,
        materials,
        formatNumber
    });

    gatheringField = getGatheringField(game.operations.activeFieldId);

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
        const result = stir(game, multiplier, notifyUnread, showAnnouncement);
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

// DEBUG AREA

function debugLogState(label = "Manual log check") {
    const entries = game.log ?? [];
    const unread = game.unread ?? {};

    const snapshot = {
        label,
        time: new Date().toISOString(),
        logLength: entries.length,

        visibleLogEntries: entries.filter(
            entry =>
                entry?.tab === "log" &&
                typeof entry.message === "string" &&
                entry.message.trim().length > 0
        ).length,

        entries: entries.map(entry => ({
            id: entry?.id ?? null,
            category: entry?.category ?? "LEGACY/UNKNOWN",
            tab: entry?.tab ?? "MISSING",
            message: entry?.message ?? String(entry),
            timestamp: entry?.timestamp ?? null
        })),

        logSequence: game.logSequence ?? null,

        unread: {
            items: structuredClone(unread.items ?? {}),
            pending: structuredClone(unread.pending ?? {})
        },

        savedLog: (() => {
            try {
                const saved = JSON.parse(
                    localStorage.getItem("ksim-quantum-foundations-v1")
                );

                return {
                    logLength: saved?.log?.length ?? 0,
                    entries: (saved?.log ?? []).map(entry => ({
                        id: entry?.id ?? null,
                        category: entry?.category ?? "LEGACY/UNKNOWN",
                        tab: entry?.tab ?? "MISSING",
                        message: entry?.message ?? String(entry)
                    })),
                    unread: saved?.unread ?? null
                };
            } catch (error) {
                return { error: String(error) };
            }
        })()
    };

    console.log(`[LOG DEBUG] ${label}`, snapshot);
    return snapshot;
}

new DebugButton({
    id: "testAnnouncement",
    label: "testAnnouncement",
    run: () => {
        kSim.testAnnouncement();
        setTimeout(() => {
          kSim.testAnnouncement();
        }, 2000);
    }
});

/*
new DebugButton({
    id: "DebugButton",
    label: "Debug Button",
    run: () => {
        console.log("Debug Button clicked!");
    }
});

new DebugButton({
    id: "add_100_energy",
    label: "Add +100 energy",
    run: () => {
        game.resources.energy += 100;
        save();
        render();
        console.log("+100 energy added!");
    }
});

new DebugButton({
    id: "test_100_experiments",
    label: "Test 100 experiments",
    run: () => {
        runExperiments(100);
        console.log("+100 experiments tested!");
    }
});



new DebugButton({
    id: "labLog",
    label: "labLog",
    run: () => {
        const log = kSim.data.log;
        console.log(log);
    }
});

*/
