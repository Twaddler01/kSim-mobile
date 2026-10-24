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
    checkDiscoveries
} from "./src/functions.js";

const SAVE_KEY = "ksim-quantum-foundations-v1";
const app = document.getElementById("app");

function freshGame() {
    return JSON.parse(JSON.stringify(initialGameData));
}

function loadGame() {
    try {
        const saved = localStorage.getItem(SAVE_KEY);
        if (!saved) return freshGame();
        const parsed = JSON.parse(saved);
        return {
            ...freshGame(),
            ...parsed,
            resources: {
                ...initialGameData.resources,
                ...(parsed.resources ?? {})
            },
            upgrades: {
                ...initialGameData.upgrades,
                ...(parsed.upgrades ?? {})
            },
            discoveries: Array.isArray(parsed.discoveries)
                ? parsed.discoveries
                : [],
            log: Array.isArray(parsed.log)
                ? parsed.log
                : [...initialGameData.log],
            triggered: Array.isArray(parsed.triggered) ? parsed.triggered : [],

            announcement: parsed.announcement ?? null
        };
    } catch (error) {
        console.warn("Could not load Quantum Foundations save:", error);
        return freshGame();
    }
}

let game = loadGame();
let activeTab = "lab";
let toastText = "";
let toastTimer = null;
let inventoryExpanded = false;
let ui = {};

const activeFloatTexts = [];
const MAX_FLOAT_TEXTS = 5;

function showResourcePopups(gains, event) {
    const x = event?.clientX ?? window.innerWidth / 2;
    const y = event?.clientY ?? window.innerHeight / 2;

    for (const gain of gains) {
        if (!gain.amount) continue;

        // Keep only the five newest popups.
        while (activeFloatTexts.length >= MAX_FLOAT_TEXTS) {
            activeFloatTexts.shift().remove();
        }

        const stackOffset = activeFloatTexts.length * 24;

        const popup = el("div", {
            className: "resource-float",
            text: `+${formatNumber(gain.amount)} ${gain.icon}`,
            style: {
                left: `${x}px`,
                top: `${y - stackOffset}px`
            },
            "aria-hidden": "true"
        });

        document.body.append(popup);
        activeFloatTexts.push(popup);

        popup.addEventListener(
            "animationend",
            () => {
                popup.remove();

                const index = activeFloatTexts.indexOf(popup);
                if (index !== -1) activeFloatTexts.splice(index, 1);
            },
            { once: true }
        );

        // Fallback in case animationend doesn't fire.
        setTimeout(() => {
            popup.remove();

            const index = activeFloatTexts.indexOf(popup);
            if (index !== -1) activeFloatTexts.splice(index, 1);
        }, 1000);
    }
}

function save() {
    try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(game));
    } catch (error) {
        console.warn("Could not save Quantum Foundations:", error);
    }
}

// Process any event triggers already satisfied by a loaded save.
checkDiscoveries(game);
save();

function resourceVisible(resource) {
    return (
        !resource.unlockDiscovery ||
        game.discoveries.includes(resource.unlockDiscovery)
    );
}

function renderResources() {
    const resources = resourceDefinitions.filter(resourceVisible);

    ui.inventoryValues = new Map();
    ui.inventoryDetailValues = new Map();
    ui.inventoryIds = resources.map(resource => resource.id);

    const toggleChevron = el("span", {
        className: "inventory-chevron",
        text: inventoryExpanded ? "⌃" : "⌄"
    });

    ui.inventoryToggleChevron = toggleChevron;

    const toggle = el(
        "button",
        {
            type: "button",
            className: "inventory-toggle",
            "aria-expanded": String(inventoryExpanded),
            onClick: () => {
                const oldPanel = ui.inventoryPanel;
                inventoryExpanded = !inventoryExpanded;
                const newPanel = renderResources();
                oldPanel.replaceWith(newPanel);
                updateInventory();
            }
        },
        [
            el("span", {
                className: "inventory-toggle-title",
                text: "INVENTORY"
            }),
            toggleChevron
        ]
    );

    const compact = el(
        "div",
        {
            className: "inventory-compact",
            role: "list",
            "aria-label": "Current resources"
        },
        resources.map(resource => {
            const value = el("span", {
                className: "resource-chip-value",
                text: formatNumber(game.resources[resource.id] ?? 0)
            });

            ui.inventoryValues.set(resource.id, value);

            return el(
                "div",
                {
                    className: "resource-chip",
                    role: "listitem",
                    title: resource.name
                },
                [
                    el("span", {
                        className: "resource-chip-icon",
                        "aria-hidden": "true",
                        text: resource.icon
                    }),
                    value
                ]
            );
        })
    );

    const expanded = inventoryExpanded
        ? el(
              "div",
              {
                  className: "inventory-expanded",
                  role: "list",
                  "aria-label": "Resource details"
              },
              resources.map(resource => {
                  const value = el("strong", {
                      className: "inventory-item-value",
                      text: formatNumber(game.resources[resource.id] ?? 0)
                  });

                  ui.inventoryDetailValues.set(resource.id, value);

                  return el(
                      "article",
                      {
                          className: "inventory-item",
                          role: "listitem"
                      },
                      [
                          el("span", {
                              className: "inventory-item-icon",
                              "aria-hidden": "true",
                              text: resource.icon
                          }),
                          el("div", { className: "inventory-item-copy" }, [
                              el("strong", { text: resource.name }),
                              el("small", { text: resource.description })
                          ]),
                          value
                      ]
                  );
              })
          )
        : null;

    const panel = el(
        "section",
        {
            className: `inventory-panel${inventoryExpanded ? " is-expanded" : ""}`
        },
        [toggle, compact, expanded]
    );

    ui.inventoryPanel = panel;
    return panel;
}

function updateInventory() {
    const resources = resourceDefinitions.filter(resourceVisible);
    const ids = resources.map(resource => resource.id);

    // Rebuild only the inventory if a resource becomes newly visible.
    if (JSON.stringify(ids) !== JSON.stringify(ui.inventoryIds)) {
        const oldPanel = ui.inventoryPanel;
        const newPanel = renderResources();
        oldPanel.replaceWith(newPanel);
        return;
    }

    for (const resource of resources) {
        const value = formatNumber(game.resources[resource.id] ?? 0);

        const compactValue = ui.inventoryValues.get(resource.id);
        if (compactValue) compactValue.textContent = value;

        const detailValue = ui.inventoryDetailValues.get(resource.id);
        if (detailValue) detailValue.textContent = value;
    }
}

function renderDiscoveries() {
    const list = el("div", { className: "item-list" });

    for (const item of discoveries) {
        const triggered = (game.triggered ?? []).includes(item.id);

        // Hidden observations remain completely invisible until triggered.
        if (item.hidden && !triggered) continue;

        const unlocked = game.discoveries.includes(item.id);
        const investigatable = item.hidden && !unlocked;
        const cost = item.cost ?? {};
        const affordable = canAfford(game, cost);

        const body = el("div", { className: "item-details" }, [
            el("div", { className: "item-heading" }, [
                el("span", {
                    className: "item-icon",
                    text: item.icon
                }),
                el("strong", {
                    text: unlocked
                        ? item.name
                        : investigatable
                          ? "Unknown Energy Source"
                          : "Unconfirmed Observation"
                }),
                el("span", {
                    className: `status ${unlocked ? "status-found" : ""}`,
                    text: unlocked
                        ? "RECORDED"
                        : investigatable
                          ? "INVESTIGATION AVAILABLE"
                          : "UNKNOWN"
                })
            ]),

            el("p", {
                className: "item-description",
                text: unlocked
                    ? item.description
                    : investigatable
                      ? "A signal has been detected, but its source is unknown. Allocate research resources to investigate it."
                      : `Perform ${item.requirement} experiments to verify this observation.`
            })
        ]);

        if (investigatable) {
            body.append(
                el("div", {
                    className: "cost-line",
                    text: `Investigation cost: ${costLabel(cost, resourceDefinitions)}`
                }),
                Button(
                    "INVESTIGATE",
                    () => {
                        if (!game.triggered.includes(item.id)) return;
                        if (game.discoveries.includes(item.id)) return;

                        if (!payCost(game, cost)) {
                            showToast("Insufficient research resources.");
                            return;
                        }

                        game.discoveries.push(item.id);

                        addLog(
                            game,
                            `INVESTIGATION COMPLETE: ${item.name}. ${item.description}`
                        );

                        save();
                        refreshUI({ database: true });
                    },
                    {
                        variant: "primary-button",
                        disabled: !affordable
                    }
                )
            );
        }

        if (!unlocked && !investigatable) {
            body.append(
                ProgressBar({
                    label: "Experiment count",
                    value: Math.min(game.clicks, item.requirement),
                    max: item.requirement,
                    format: (value, max) => `${Math.floor(value)} / ${max}`
                })
            );
        }

        list.append(
            el(
                "article",
                {
                    className: `list-item ${unlocked ? "is-unlocked" : ""}`
                },
                [body]
            )
        );
    }

    return list;
}

function renderUpgrades() {
    const list = el("div", { className: "item-list" });
    for (const item of upgradeDefinitions) {
        const level = game.upgrades[item.id] ?? 0;
        const maxed = level >= item.maxLevel;
        const cost = upgradeCost(item, level);
        const affordable = !maxed && canAfford(game, cost);
        const body = el("div", { className: "item-details" }, [
            el("div", { className: "item-heading" }, [
                el("span", { className: "item-icon", text: item.icon }),
                el("strong", { text: item.name }),
                el("span", {
                    className: "level-pill",
                    text: `LV ${level}/${item.maxLevel}`
                })
            ]),
            el("p", { className: "item-description", text: item.description }),
            el("div", {
                className: "cost-line",
                text: maxed
                    ? "Maximum level reached"
                    : `Cost: ${costLabel(cost, resourceDefinitions)}`
            }),
            Button(
                maxed ? "MAX LEVEL" : "INSTALL UPGRADE",
                () => {
                    if (buyUpgrade(game, item.id)) {
                        save();
                        refreshUI({ database: true });
                    } else {
                        showToast("Insufficient resources.");
                    }
                },
                { variant: "secondary-button", disabled: !affordable || maxed }
            )
        ]);
        list.append(el("article", { className: "list-item" }, [body]));
    }
    return list;
}

function renderLog() {
    return el(
        "div",
        { className: "log-list" },
        game.log.map(line =>
            el("div", { className: "log-entry" }, [
                el("span", { className: "log-marker", text: "›" }),
                el("span", { text: line })
            ])
        )
    );
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
                    renderDiscoveries()
                )
        },
        {
            id: "equipment",
            label: "EQUIPMENT",
            render: () =>
                renderDatabasePanel(
                    "Lab Equipment",
                    `${Object.values(game.upgrades).reduce((a, b) => a + b, 0)} levels`,
                    renderUpgrades()
                )
        },
        {
            id: "log",
            label: "LAB LOG",
            render: () =>
                renderDatabasePanel(
                    "Experiment Log",
                    `${game.log.length} entries`,
                    renderLog()
                )
        }
    ];

    const tabs = new Tabs({
        activeId: activeTab,
        label: "Laboratory sections",
        tabs: tabDefinitions,
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

function runExperiments(count = 1, event = null) {
    const result = stir(game, count);

    const gains = [
        { amount: result.energy, icon: "⚡" },
        { amount: result.particles, icon: "⚛️" },
        { amount: result.research, icon: "🔬" },
        { amount: result.exoticMatter, icon: "🌀" }
    ].filter(gain => gain.amount > 0);

    if (count > 1) {
        addLog(game, `BATCH COMPLETE: ${count} experiments run.`);
    }

    save();
    refreshUI({ database: true });
    showResourcePopups(gains, event);
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

function updateExperimentUI() {
    if (!ui.experimentProgress) return;

    const visibleMilestones = discoveries.filter(item => !item.hidden);
    const nextDiscovery = visibleMilestones.find(
        item => !game.discoveries.includes(item.id)
    );

    const finalMilestone = visibleMilestones.at(-1);
    const progressValue = nextDiscovery
        ? Math.min(game.clicks, nextDiscovery.requirement)
        : finalMilestone.requirement;

    const progressMax = nextDiscovery
        ? nextDiscovery.requirement
        : finalMilestone.requirement;

    ui.experimentCount.textContent = `${formatNumber(game.clicks)} experiments completed`;

    ui.runTenButton.disabled = (game.resources.particles ?? 0) < 10;

    ui.convertButton.disabled = (game.resources.particles ?? 0) <= 0;

    const progressLabel = ui.experimentProgress.querySelector(
        ".progress-label span:first-child"
    );

    if (progressLabel) {
        progressLabel.textContent = nextDiscovery
            ? `Next observation: ${nextDiscovery.name}`
            : "Observation index complete";
    }

    ui.experimentProgress.setValue(progressValue, progressMax);
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

function render() {
    if (!app) return;

    if (ui.layout) {
        updateInventory();
        updateExperimentUI();
        updateToast();
        updateAnnouncement();
        return;
    }

    const visibleMilestones = discoveries.filter(item => !item.hidden);

    const nextDiscovery = visibleMilestones.find(
        item => !game.discoveries.includes(item.id)
    );

    const finalMilestone = visibleMilestones.at(-1);
    const progressValue = nextDiscovery
        ? Math.min(game.clicks, nextDiscovery.requirement)
        : finalMilestone.requirement;

    const progressMax = nextDiscovery
        ? nextDiscovery.requirement
        : finalMilestone.requirement;

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
            runExperiments(10, event);
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

                showResourcePopups(
                    [
                        { amount: result.energy, icon: "⚡" },
                        { amount: result.particles, icon: "⚛️" }
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
            ? `Next observation: ${nextDiscovery.name}`
            : "Observation index complete",
        value: progressValue,
        max: progressMax,
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
                        game = freshGame();
                        save();
                        refreshUI({ database: true });
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

    const layout = el("div", { className: "game-layout" }, [
        topbar,
        renderResources(),
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
        const result = stir(game, multiplier);
        save();
        refreshUI({ database: true });
        return result;
    },
    experiment: runExperiments,
    clearStorage: () => localStorage.removeItem(SAVE_KEY),
    reset: () => {
        game = freshGame();
        save();
        refreshUI({ database: true });
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
