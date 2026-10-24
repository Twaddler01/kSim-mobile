import {
    initialGameData,
    resourceDefinitions,
    discoveries,
    upgradeDefinitions
} from "./src/data.js";
import { el } from "./src/ui/Element.js";
import { Button } from "./src/ui/Button.js";
import { Card } from "./src/ui/Card.js";
import { ProgressBar } from "./src/ui/ProgressBar.js";
import { Tabs } from "./src/ui/Tabs/Tabs.js";
import {
    addLog,
    stir,
    buyUpgrade,
    upgradeCost,
    canAfford,
    costLabel,
    formatNumber,
    consumeParticles
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
                : [...initialGameData.log]
        };
    } catch (error) {
        console.warn("Could not load Quantum Foundations save:", error);
        return freshGame();
    }
}

let game = loadGame();
let activeTab = "observations";
let toastText = "";
let toastTimer = null;

function save() {
    try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(game));
    } catch (error) {
        console.warn("Could not save Quantum Foundations:", error);
    }
}

function resourceVisible(resource) {
    return (
        !resource.unlockDiscovery ||
        game.discoveries.includes(resource.unlockDiscovery)
    );
}

function renderResources() {
    return el(
        "div",
        { className: "resource-grid" },
        resourceDefinitions.filter(resourceVisible).map(resource =>
            Card(
                `${resource.icon} ${resource.name}`,
                [
                    el("div", {
                        className: "resource-value",
                        text: formatNumber(game.resources[resource.id] ?? 0)
                    })
                ],
                resource.description
            )
        )
    );
}

function renderDiscoveries() {
    const list = el("div", { className: "item-list" });
    for (const item of discoveries) {
        const unlocked = game.discoveries.includes(item.id);
        const body = el("div", { className: "item-details" }, [
            el("div", { className: "item-heading" }, [
                el("span", { className: "item-icon", text: item.icon }),
                el("strong", {
                    text: unlocked ? item.name : "Unconfirmed Observation"
                }),
                el("span", {
                    className: `status ${unlocked ? "status-found" : ""}`,
                    text: unlocked ? "RECORDED" : "UNKNOWN"
                })
            ]),
            el("p", {
                className: "item-description",
                text: unlocked
                    ? item.description
                    : `Perform ${item.requirement} experiments to verify this observation.`
            })
        ]);
        if (!unlocked) {
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
                { className: `list-item ${unlocked ? "is-unlocked" : ""}` },
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
                        render();
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

function renderTabContent() {
    const tabDefinitions = [
        {
            id: "observations",
            label: "OBSERVATIONS",
            render: renderDiscoveries
        },
        { id: "equipment", label: "EQUIPMENT", render: renderUpgrades },
        { id: "log", label: "LAB LOG", render: renderLog }
    ];

    const tabs = new Tabs({
        activeId: activeTab,
        label: "Laboratory sections",
        tabs: tabDefinitions,
        onChange: id => {
            activeTab = id;
            render();
        }
    });
    return tabs.element;
}

function showToast(message) {
    toastText = message;
    render();
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        toastText = "";
        render();
    }, 1800);
}

function runExperiments(count = 1) {
    const result = stir(game, count);
    const gains = [`+${formatNumber(result.energy)} energy`];
    if (result.particles)
        gains.push(`+${formatNumber(result.particles)} particles`);
    if (result.research)
        gains.push(`+${formatNumber(result.research)} research`);
    if (result.exoticMatter)
        gains.push(`+${formatNumber(result.exoticMatter)} exotic matter`);
    if (count > 1)
        addLog(
            game,
            `BATCH COMPLETE: ${count} experiments run. ${gains.join(", ")}.`
        );
    save();
    showToast(gains.join(" · "));
}

function render() {
    if (!app) return;

    const nextDiscovery = discoveries.find(
        item => !game.discoveries.includes(item.id)
    );
    const progressValue = nextDiscovery
        ? Math.min(game.clicks, nextDiscovery.requirement)
        : discoveries.at(-1).requirement;
    const progressMax = nextDiscovery
        ? nextDiscovery.requirement
        : discoveries.at(-1).requirement;

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
            onClick: () => runExperiments(1)
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
        el("div", {
            className: "experiment-count",
            text: `${formatNumber(game.clicks)} experiments completed`
        }),
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
                Button(
                    "RUN ×10",
                    () => {
                        // Enforce the requirement even if called outside the UI.
                        if ((game.resources.particles ?? 0) < 10) {
                            showToast("Requires 10 Particles.");
                            return;
                        }

                        game.resources.particles -= 10;
                        addLog(
                            game,
                            "BATCH: Consumed 10 Particles to run ten experiments."
                        );
                        runExperiments(10);
                    },
                    {
                        variant: "primary-button",
                        disabled: (game.resources.particles ?? 0) < 10
                    }
                )
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
                Button(
                    "CONVERT",
                    () => {
                        const result = consumeParticles(game);

                        if (result.particles > 0) {
                            save();
                            showToast(
                                `−${formatNumber(result.particles)} Particles · +${formatNumber(result.energy)} Energy`
                            );
                        }
                    },
                    {
                        variant: "secondary-button",
                        disabled: (game.resources.particles ?? 0) <= 0
                    }
                )
            ])
        ]),
        ProgressBar({
            label: nextDiscovery
                ? `Next observation: ${nextDiscovery.name}`
                : "Observation index complete",
            value: progressValue,
            max: progressMax,
            format: (value, max) =>
                nextDiscovery ? `${Math.floor(value)} / ${max}` : "COMPLETE"
        })
    ]);

    const researchPanel = el(
        "section",
        { className: "sim-card research-panel" },
        [
            el("div", { className: "section-heading" }, [
                el("div", {}, [
                    el("div", { className: "eyebrow", text: "LAB DATABASE" }),
                    el("h2", {
                        text:
                            activeTab === "equipment"
                                ? "Lab Equipment"
                                : activeTab === "log"
                                  ? "Experiment Log"
                                  : "Observation Index"
                    })
                ]),
                el("span", {
                    className: "count-pill",
                    text:
                        activeTab === "observations"
                            ? `${game.discoveries.length}/${discoveries.length}`
                            : activeTab === "equipment"
                              ? `${Object.values(game.upgrades).reduce((a, b) => a + b, 0)} levels`
                              : `${game.log.length} entries`
                })
            ]),
            renderTabContent()
        ]
    );

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
                        render();
                    }
                },
                {
                    variant: "secondary-button"
                }
            )
        ]
    );

    const layout = el("div", { className: "game-layout" }, [
        intro,
        renderResources(),
        fieldPanel,
        researchPanel,
        resetPanel
    ]);
    if (toastText)
        layout.append(
            el("div", {
                className: "toast-message",
                role: "status",
                text: toastText
            })
        );
    app.replaceChildren(layout);
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
        render();
        return result;
    },
    experiment: runExperiments,
    clearStorage: () => localStorage.removeItem(SAVE_KEY),
    reset: () => {
        game = freshGame();
        save();
        render();
    }
};

render();
