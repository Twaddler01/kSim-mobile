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
    formatNumber
} from "./src/functions.js";

const SAVE_KEY = "ksim-origins-save-v1";
const app = document.querySelector("#app");
let activeTab = "discoveries";
let tabs = null;
let game = loadGame();

function loadGame() {
    try {
        const saved = JSON.parse(localStorage.getItem(SAVE_KEY));
        if (!saved || saved.version !== initialGameData.version)
            return structuredClone(initialGameData);
        return {
            ...structuredClone(initialGameData),
            ...saved,
            resources: { ...initialGameData.resources, ...saved.resources },
            upgrades: { ...initialGameData.upgrades, ...saved.upgrades }
        };
    } catch (error) {
        console.warn("Save could not be loaded:", error);
        return structuredClone(initialGameData);
    }
}
function saveGame() {
    try {
        game.lastTick = Date.now();
        localStorage.setItem(SAVE_KEY, JSON.stringify(game));
    } catch (error) {
        console.warn("Save could not be stored:", error);
    }
}
function makeResourceCard(key, definition) {
    const card = el("div", { className: "resource" });
    card.append(
        el("div", { className: "resource-top" }, [
            el("span", { className: "resource-icon", text: definition.icon }),
            el("span", { text: definition.label })
        ]),
        el("div", {
            className: "resource-value",
            text: formatNumber(game.resources[key])
        }),
        el("div", {
            className: "resource-rate",
            text:
                key === "energy"
                    ? `+${1 + game.upgrades.efficientClicks} / stir`
                    : definition.description
        })
    );
    return card;
}
function renderResources() {
    return el(
        "div",
        { className: "resource-grid" },
        Object.entries(resourceDefinitions).map(([key, definition]) =>
            makeResourceCard(key, definition)
        )
    );
}
function renderDiscoveries() {
    const list = el("div", { className: "item-list" });
    for (const item of discoveries) {
        const found = game.discoveries.includes(item.id);
        const row = el("div", { className: "item-row" }, [
            el("div", { text: item.icon }),
            el("div", { className: "item-copy" }, [
                el("div", { className: "item-title", text: item.name }),
                el("div", {
                    className: "item-description",
                    text: found
                        ? item.description
                        : `Unknown reaction. Progress: ${Math.min(game.clicks, item.requirement)} / ${item.requirement} stirs.`
                }),
                el("div", {
                    className: "item-meta",
                    text: found ? "DISCOVERED" : "UNDISCOVERED"
                })
            ]),
            el("span", { className: "muted", text: found ? "✓" : "🔒" })
        ]);
        list.append(row);
    }
    return list;
}
function renderUpgrades() {
    const list = el("div", { className: "item-list" });
    for (const item of upgradeDefinitions) {
        const level = game.upgrades[item.id],
            cost = upgradeCost(item, level),
            maxed = level >= item.maxLevel;
        const row = el("div", { className: "item-row" });
        row.append(
            el("div", { text: item.icon }),
            el("div", { className: "item-copy" }, [
                el("div", {
                    className: "item-title",
                    text: `${item.name} · Lv ${level}/${item.maxLevel}`
                }),
                el("div", {
                    className: "item-description",
                    text: item.description
                }),
                el("div", {
                    className: "item-meta",
                    text: maxed ? "MAX LEVEL" : `Cost: ${costLabel(cost)}`
                })
            ]),
            Button(
                maxed ? "MAX" : "Upgrade",
                () => {
                    const result = buyUpgrade(game, item.id);
                    if (!result.ok) addLog(game, result.reason);
                    saveGame();
                    render();
                },
                {
                    variant: "secondary-button",
                    disabled: maxed || !canAfford(game, cost)
                }
            )
        );
        list.append(row);
    }
    return list;
}
function renderLog() {
    return el(
        "div",
        { className: "log-list" },
        game.log.map(line => el("div", { className: "log-entry", text: line }))
    );
}
function render() {
    app.replaceChildren();
    const header = el("header", { className: "topbar" }, [
        el("div", { className: "brand" }, [
            el("div", { className: "eyebrow", text: "A DOM simulation" }),
            el("div", { className: "brand-title", text: "kSim / ORIGINS" })
        ]),
        el("div", {
            className: "stage-pill",
            text:
                game.discoveries.length === discoveries.length
                    ? "LIFE EMERGING"
                    : "STAGE 00 · SOUP"
        })
    ]);
    const resourcesCard = Card("INVENTORY", renderResources(), "LIVE TOTALS");
    const stirButton = el(
        "button",
        {
            type: "button",
            className: "soup-orb",
            "aria-label": "Stir primordial soup",
            onClick: event => {
                const gained = stir(game);
                showFloatText(
                    event.clientX,
                    event.clientY,
                    `+${gained.energy} ⚡`
                );
                if (game.clicks % 5 === 0)
                    addLog(
                        game,
                        `The soup stirs. Total reactions: ${game.clicks}.`
                    );
                saveGame();
                render();
            }
        },
        [el("span", { text: "🫧" })]
    );
    const progress = ProgressBar({
        label: "Chemical activity",
        value: game.clicks,
        max: discoveries.at(-1).requirement,
        format: (v, m) => `${Math.min(v, m)} / ${m} reactions`
    });
    const simPanel = Card(
        "PRIMORDIAL SOUP",
        [
            el("div", { className: "sim-card" }, [
                el("div", {
                    className: "orb-caption",
                    text: "Tap the soup to stir the mixture and create energy."
                }),
                el("div", { className: "soup-orb-wrap" }, [stirButton]),
                progress,
                el("div", { className: "button-row" }, [
                    Button(
                        "Stir ×10",
                        () => {
                            for (let i = 0; i < 10; i++) stir(game);
                            addLog(
                                game,
                                "You vigorously stirred the soup ten times."
                            );
                            saveGame();
                            render();
                        },
                        { variant: "primary-button" }
                    ),
                    Button(
                        "Reset Save",
                        () => {
                            if (
                                confirm("Erase this simulation and start over?")
                            ) {
                                localStorage.removeItem(SAVE_KEY);
                                game = structuredClone(initialGameData);
                                render();
                            }
                        },
                        { variant: "secondary-button" }
                    )
                ])
            ])
        ],
        "TAP TO EXPERIMENT"
    );
    const tabDefinitions = [
        { id: "discoveries", label: "DISCOVER", render: renderDiscoveries },
        { id: "upgrades", label: "UPGRADES", render: renderUpgrades },
        { id: "log", label: "LOG", render: renderLog }
    ];
    if (!tabs) {
        tabs = new Tabs({
            activeId: activeTab,
            label: "Simulation inventory sections",
            onChange: id => {
                activeTab = id;
                render();
            },
            tabs: tabDefinitions
        });
    } else {
        // Reuse the same component instance across game renders. The tab strip
        // and panel remain stable, preserving horizontal scroll and DOM ownership.
        tabs.setTabs(tabDefinitions, { activeId: activeTab });
    }
    const panelTitles = {
        discoveries: "DISCOVERY INDEX",
        upgrades: "RESEARCH & AUTOMATION",
        log: "FIELD NOTES"
    };
    const labPanel = Card(
        panelTitles[activeTab] ?? "SIMULATION",
        tabs.element,
        activeTab.toUpperCase()
    );
    app.append(
        header,
        resourcesCard,
        el("div", { className: "game-columns" }, [simPanel, labPanel]),
        el("div", {
            className: "footer-note",
            text: "Autosaves on every action · Built with native HTML, CSS and JavaScript"
        })
    );
}
function showFloatText(x, y, text) {
    const node = el("div", {
        className: "float-text",
        text,
        style: { left: `${x}px`, top: `${y}px` }
    });
    document.body.append(node);
    node.addEventListener("animationend", () => node.remove(), { once: true });
    setTimeout(() => node.remove(), 1000);
}
// Passive automation runs at one-second intervals; render only when it produces resources.
setInterval(() => {
    const level = game.upgrades.autoStir;
    if (!level) return;
    stir(game, level);
    saveGame();
    render();
}, 1000);
window.kSim = {
    get data() {
        return game;
    },
    save: saveGame,
    render,
    stir: () => {
        stir(game);
        saveGame();
        render();
    },
    clearStorage: () => {
        localStorage.removeItem(SAVE_KEY);
        console.log("kSim save cleared.");
    },

    reset: () => {
        localStorage.removeItem(SAVE_KEY);
        game = structuredClone(initialGameData);
        render();
        console.log("kSim simulation reset.");
    }
};
render();
console.log("kSim Origins loaded. Try window.kSim in the developer console.");
