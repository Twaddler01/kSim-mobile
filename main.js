import DebugButton from "./debug/DebugButtons.js";

import {
    initialGameData,
    resourceDefinitions,
    discoveries,
    upgradeDefinitions
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
import ResourcePopups from "./src/ui/ResourcePopups.js";
import SaveManager from "./src/SaveManager.js";
import { navigateToItem as navigateTabToItem } from "./src/ui/itemNavigation.js";
import AnnouncementOverlay from "./src/ui/AnnouncementOverlay.js";

// TABS
import DiscoveryPanel from "./src/ui/DiscoveryPanel.js";
import UpgradePanel from "./src/ui/UpgradePanel.js";
import LogPanel from "./src/ui/LogPanel.js";
import PlanPanel from "./src/ui/PlanPanel.js";
import { SynthesisPanel } from "./src/ui/SynthesisPanel.js";
import GatheringField from "./src/ui/GatheringField.js";

import { ensureManufacturingState } from "./src/systems/SynthesisEngine.js";

import {
    getRecoveryTarget,
    recoverMaterial,
    selectRandomRecoveryTarget
} from "./src/systems/MaterialRecovery.js";
import { materialDefinitions } from "./src/data/manufacturing.js";
import MaterialRecoveryOrb from "./src/ui/MaterialRecoveryOrb.js";

import UnreadManager from "./src/UnreadManager.js";
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
let previousAnnouncementIds = new Set();
let gatheringField = null;

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
        if (ui.tabs) {
            ui.tabs.update();
        }
    },
    isTabActive: tabId => activeTab === tabId
});

function notifyUnread(tabId, itemId) {
    unreadManager.notify(tabId, itemId);
}

function logEvent(game, message, options = {}) {
    return addLog(game, message, {
        onUnread: notifyUnread,
        ...options
    });
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

    return true;
}

// Process any event triggers already satisfied by a loaded save.
checkDiscoveries(game);

ensureManufacturingState(game);

// Persistent Operations unlocks.
// Existing saves with 5+ Copper should already have Quantum Field unlocked.
game.operations ??= {};

game.operations.quantumFieldUnlocked ??= (game.inventory.copper ?? 0) >= 5;

// Initialize or migrate equipment unlocks without creating
// fresh notifications for conditions already satisfied in a save.
checkUpgradeUnlocks(game, notifyUnread, { notify: false });

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

function renderTabContent(labContent, operationsContent) {
    const tabDefinitions = [
        {
            id: "lab",
            label: "LAB",
            render: () => labContent
        },
        {
            id: "gathering",
            label: "GATHER",
            render: () => gatheringField.getElement()
        },
        {
            id: "operations",
            label: "OPERATIONS",
            render: () => operationsContent
        },
        {
            id: "observations",
            label: "OBSERVATIONS",
            render: () =>
                renderDatabasePanel(
                    "Observation Index",
                    `${game.discoveries.length}/${discoveries.length}`,
                    discoveryPanel.render()
                )
        },
        {
            id: "equipment",
            label: "EQUIPMENT",
            render: () =>
                renderDatabasePanel(
                    "Lab Equipment",
                    `${Object.values(game.upgrades).reduce((a, b) => a + b, 0)} levels`,
                    upgradePanel.render()
                )
        },
        {
            id: "synthesis",
            label: "SYNTHESIS",
            render: () =>
                new SynthesisPanel({
                    game,
                    onChange: () => {
                        save();
                        render();
                        showToast("Synthesis complete.");
                    },
                    onToast: showToast
                }).getElement()
        },
        {
            id: "plan",
            label: "PLAN",
            render: () => planPanel.getElement()
        },
        {
            id: "log",
            label: "LAB LOG",
            render: () =>
                renderDatabasePanel(
                    "Experiment Log",
                    `${game.log.length} entries`,
                    logPanel.render()
                )
        }
    ];

    const tabs = new Tabs({
        activeId: activeTab,
        label: "Laboratory sections",
        unreadManager,
        tabs: tabDefinitions.map(tab => ({
            ...tab,
            unread: ["observations", "equipment", "log", "operations"].includes(
                tab.id
            )
        })),
        onChange: id => {
            activeTab = id;
        }
    });

    ui.tabs = tabs;

    //ui.tabs.update();
    //ui.tabs.updateUnreadIndicators();

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

function updateAnnouncement() {
    ui.announcement?.remove();
    ui.announcement = null;

    const announcement = renderAnnouncement();

    if (announcement && ui.layout) {
        ui.announcement = announcement;
        ui.layout.append(announcement);
    }
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
    const result = stir(game, count, notifyUnread);

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

function renderAnnouncement() {
    const announcement = game.announcement;
    if (!announcement) return null;

    return el(
        "div",
        {
            className: "announcement-overlay",
            role: "alertdialog",
            "aria-modal": "true",
            "aria-label": announcement.title
        },
        [
            el("section", { className: "announcement-panel" }, [
                el("div", {
                    className: "announcement-eyebrow",
                    text: "⚠ PRIORITY LAB ALERT"
                }),
                el("div", {
                    className: "announcement-symbol",
                    text: "◉"
                }),
                el("h2", {
                    text: announcement.title
                }),
                el("p", {
                    text: announcement.message
                }),
                el("p", {
                    className: "announcement-detail",
                    text: "A new observation has been added to the laboratory database."
                }),
                Button(
                    "ACKNOWLEDGE",
                    () => {
                        game.announcement = null;
                        save();
                        render();
                    },
                    { variant: "primary-button" }
                )
            ])
        ]
    );
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

function updateMaterialRecoveryUI() {
    ui.materialRecoveryOrb?.update();
}

function updateOperationsUI() {
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

    updateAnnouncementOverlay();
}

function updateAnnouncementOverlay() {
    const records = game.operations?.discoveredMaterials ?? {};

    const announcements = Object.entries(records)
        .filter(([id]) =>
            unreadManager.isUnread("operations", `material-${id}`)
        )
        .sort((a, b) => (b[1].discoveredAt ?? 0) - (a[1].discoveredAt ?? 0))
        .map(([id]) => {
            const material = materialDefinitions.find(item => item.id === id);

            if (!material) return null;

            return {
                id: `material-${id}`,
                title: "NEW MATERIAL DISCOVERED",
                name: material.name,
                message:
                    material.description ??
                    "A new raw material has been added to the research inventory.",
                icon: material.icon ?? "◈",
                category: "material"
            };
        })
        .filter(Boolean);

    const nextIds = new Set(announcements.map(item => item.id));

    const hasNewAnnouncement = [...nextIds].some(
        id => !previousAnnouncementIds.has(id)
    );

    ui.announcementOverlay?.setAnnouncements(announcements);

    if (hasNewAnnouncement) {
        const operationsContent = ui.announcementOverlay?.element.parentElement;

        operationsContent?.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }

    previousAnnouncementIds = nextIds;
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

function refreshUI({ database = false } = {}) {
    if (!ui.layout) {
        render();
        return;
    }

    updateInventory();
    updateMaterialRecoveryUI();
    updateOperationsUI();
    updateExperimentUI();
    updateToast();
    updateAnnouncement();

    // Refresh the active database panel without rebuilding the tab bar.
    if (database && activeTab !== "lab") {
        ui.tabs.update();
    }
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
        updateInventory();
        updateMaterialRecoveryUI();
        updateExperimentUI();
        updateToast();
        updateAnnouncement();
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

    const materialRecoveryOrb = new MaterialRecoveryOrb({
        getGame: () => game,
        getTarget: () => getRecoveryTarget(game),

        onGather: (event, target) => {
            const result = recoverMaterial(game, target.id, 1);

            if (!result.ok) {
                showToast(result.reason);
                return;
            }

            resourcePopups.show(
                [{ amount: result.amount ?? 1, icon: result.item.icon }],
                event
            );

            const newlyDiscovered = discoverMaterial(result.item, "recovery");

            if (newlyDiscovered) {
                showToast(`New material discovered: ${result.item.name}`);
            }

            if (result.unlockedQuantumField) {
                quantumFieldPanel.unlock({
                    unread: false,
                    expanded: false
                });

                logEvent(
                    game,
                    "NEW SYSTEM AVAILABLE: Quantum Field unlocked after recovering five Copper Samples.",
                    {
                        category: "activity",
                        tab: "log",
                        notificationTargets: [
                            {
                                tab: "operations",
                                itemId: "quantum-field"
                            }
                        ]
                    }
                );

                showToast("Quantum Field unlocked!");
            }

            save();
            refreshUI({ database: true });
        }
    });

    ui.materialRecoveryOrb = materialRecoveryOrb;

    const materialRecoveryContent = el(
        "div",
        { className: "field-panel-content" },
        [
            el("p", {
                className: "muted",
                text: "Recover raw materials for future synthesis and equipment."
            }),

            materialRecoveryOrb.getElement(),

            el("p", {
                className: "bonus-description",
                text: "DEBUG: Recover 5 Copper to unlock Quantum Field."
            })
        ]
    );

    const materialRecoveryPanel = new CollapsiblePanel({
        eyebrow: "FIELD OPERATIONS",
        title: "Material Recovery",
        status: "ONLINE",
        content: materialRecoveryContent,
        expanded: true
    });

    const quantumFieldPanel = new CollapsiblePanel({
        eyebrow: "ACTIVE SYSTEM",
        title: "Quantum Field",
        status: game.operations.quantumFieldUnlocked ? "AVAILABLE" : "LOCKED",
        content: fieldContent,
        expanded: false,
        locked: !game.operations.quantumFieldUnlocked,
        unread: unreadManager.isUnread("operations", "quantum-field"),
        onAcknowledge: () => {
            unreadManager.markRead("operations", "quantum-field");
        }
    });

    ui.quantumFieldPanel = quantumFieldPanel;
    ui.materialRecoveryPanel = materialRecoveryPanel;

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

    const labContent = el(
        "div",
        {
            className: "lab-tab-content"
        },
        [intro, resetPanel]
    );

    const announcementOverlay = new AnnouncementOverlay({
        onClose: id => {
            unreadManager.markRead("operations", id);
            updateAnnouncementOverlay();
        }
    });

    ui.announcementOverlay = announcementOverlay;

    const operationsContent = el(
        "div",
        {
            className: "lab-tab-content operations-tab-content"
        },
        [
            materialRecoveryPanel.element,
            quantumFieldPanel.element,
            announcementOverlay.element
        ]
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
        materials: materialDefinitions,
        formatNumber
    });

    gatheringField ??= new GatheringField({
        onGather: (event, target) => {
            const result = recoverMaterial(game, target.id, 1);

            if (!result.ok) {
                showToast(result.reason);
                return false;
            }

            resourcePopups.show(
                [{ amount: result.amount ?? 1, icon: result.item.icon }],
                event
            );

            const newlyDiscovered = discoverMaterial(
                result.item,
                "gathering-field"
            );

            if (newlyDiscovered) {
                showToast(`New material discovered: ${result.item.name}`);
            }

            if (result.unlockedQuantumField) {
                quantumFieldPanel.unlock({
                    unread: false,
                    expanded: false
                });

                logEvent(
                    game,
                    "NEW SYSTEM AVAILABLE: Quantum Field unlocked after recovering five Copper Samples.",
                    {
                        category: "activity",
                        tab: "log",
                        notificationTargets: [
                            {
                                tab: "operations",
                                itemId: "quantum-field"
                            }
                        ]
                    }
                );

                showToast("Quantum Field unlocked!");
            }

            save();
            refreshUI({ database: true });

            return true;
        }
    });

    const layout = el("div", { className: "game-layout" }, [
        topbar,
        ui.inventory.element,
        renderTabContent(labContent, operationsContent)
    ]);

    ui.layout = layout;
    app.replaceChildren(layout);

    updateInventory();
    updateOperationsUI();
    updateExperimentUI();
    updateToast();
    updateAnnouncement();
}

window.kSim = {
    get data() {
        return game;
    },
    save,
    render,
    stir: (multiplier = 1) => {
        const result = stir(game, multiplier, notifyUnread);
        save();
        refreshUI({ database: true });
        return result;
    },
    experiment: runExperiments,
    clearStorage: () => saveManager.clear(),
    reset: resetGame,
    // DEBUG
    randomizeMaterialTarget: () => {
        const target = selectRandomRecoveryTarget(game);

        ui.materialRecoveryOrb?.update();
        save();

        showToast(`Recovery target: ${target.name}`);

        return target;
    }
};

render();

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
    id: "silicon",
    label: "silicon",
    run: () => {
        kSim.data.materialRecovery.currentTarget = "silicon";
        kSim.render();
        console.log("+Silicon added!");
    }
});

new DebugButton({
    id: "randomizeMaterialTarget",
    label: "randomizeMaterialTarget",
    run: () => {
        kSim.randomizeMaterialTarget();
        console.log("randomizeMaterialTarget");
    }
});
