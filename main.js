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

import Inventory from "./src/ui/Inventory.js";
import ResourcePopups from "./src/ui/ResourcePopups.js";
import SaveManager from "./src/SaveManager.js";
import { navigateToItem as navigateTabToItem } from "./src/ui/itemNavigation.js";

// TABS
import DiscoveryPanel from "./src/ui/DiscoveryPanel.js";
import UpgradePanel from "./src/ui/UpgradePanel.js";
import LogPanel from "./src/ui/LogPanel.js";
import PlanPanel from "./src/ui/PlanPanel.js";

import { SynthesisPanel } from "./src/ui/SynthesisPanel.js";
import { ensureManufacturingState, gatherMaterialSamples } from "./src/systems/SynthesisEngine.js";
import { materialDefinitions } from "./src/data/manufacturing.js";

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

const resourcePopups = new ResourcePopups({
    formatNumber,
    maxVisible: 5
});

function save() {
    saveManager.save(game);
}

function resetGame() {
    game = saveManager.freshGame();
    save();
    refreshUI({ database: true });
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

// Process any event triggers already satisfied by a loaded save.
checkDiscoveries(game);

ensureManufacturingState(game);

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

function renderTabContent(labContent) {
    const tabDefinitions = [
        {
            id: "lab",
            label: "LAB",
            render: () => labContent
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
            render: () => new SynthesisPanel({
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
            unread: ["observations", "equipment", "log"].includes(tab.id)
        })),
        onChange: id => {
            activeTab = id;
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
    const recovered = gatherMaterialSamples(game, count);

if (recovered.length) {
    gains.push(...recovered.map(item => {
        const definition = materialDefinitions.find(entry => entry.id === item.id);
        return `+${item.amount} ${definition?.name ?? item.id}`;
    }));
}

    
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
        nextDiscovery?.trigger?.min ??
        finalMilestone?.trigger?.min ??
        0;
    const finalRequirement = finalMilestone.trigger.min;

    return {
        nextDiscovery,
        value: nextDiscovery
            ? Math.min(game.clicks, nextRequirement)
            : finalRequirement,
        max: nextDiscovery ? nextRequirement : finalRequirement
    };
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

    const fieldPanel = el("section", { className: "sim-card field-panel" }, [
        el("div", { className: "section-heading" }, [
            el("div", {}, [
                el("div", { className: "eyebrow", text: "ACTIVE SYSTEM" }),
                el("h2", { text: "Quantum Field" })
            ]),
            el("span", { className: "live-indicator", text: "● ONLINE" })
        ]),
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
        [intro, fieldPanel, resetPanel]
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
        formatNumber
    });

    const layout = el("div", { className: "game-layout" }, [
        topbar,
        ui.inventory.element,
        renderTabContent(labContent)
    ]);

    ui.layout = layout;
    app.replaceChildren(layout);

    updateInventory();
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
    reset: resetGame
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
