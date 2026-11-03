// src/ui/panels/ExperimentPanel.js

import { el } from "../components/Element.js";
import { Button } from "../components/Button.js";
import { ProgressBar } from "../components/ProgressBar.js";
import CollapsiblePanel from "../components/CollapsiblePanel.js";

import {
    addLog,
    stir,
    consumeParticles,
    formatNumber
} from "../../functions.js";

import { removeInventoryItem } from "../../data/inventory.js";

/**
 * Quantum Field experiment panel.
 *
 * Owns the manual experiment orb, batch / particle-conversion actions,
 * the discovery progress bar, and the collapsible "Quantum Field" wrapper.
 *
 * Rendered independently of the LAB tab so that a dedicated EXPERIMENTS
 * tab can attach to it later via `experimentPanel.getElement()`.
 */
export default class ExperimentPanel {
    constructor({
        getGame,
        discoveries,
        save,
        refreshUI,
        showToast,
        processProgression,
        notifyUnread,
        resourcePopups,
        unreadManager
    }) {
        this.getGame = getGame;
        this.discoveries = discoveries;
        this.save = save;
        this.refreshUI = refreshUI;
        this.showToast = showToast;
        this.processProgression = processProgression;
        this.notifyUnread = notifyUnread;
        this.resourcePopups = resourcePopups;
        this.unreadManager = unreadManager;

        this.element = null;
        this.refs = {};
    }

    get game() {
        return this.getGame();
    }

    // --------------------------------------------------
    // PROGRESS
    // --------------------------------------------------

    getExperimentProgress() {
        const milestones = this.discoveries.filter(
            item => !item.hidden && item.trigger?.type === "experimentCount"
        );

        const nextDiscovery = milestones.find(
            item => !this.game.discoveries.includes(item.id)
        );

        const finalMilestone = milestones.at(-1);

        if (!finalMilestone) {
            return { nextDiscovery: null, value: 0, max: 1 };
        }

        const nextRequirement =
            nextDiscovery?.trigger?.min ?? finalMilestone.trigger.min ?? 0;
        const finalRequirement = finalMilestone.trigger.min;

        return {
            nextDiscovery,
            value: nextDiscovery
                ? Math.min(this.game.clicks, nextRequirement)
                : finalRequirement,
            max: nextDiscovery ? nextRequirement : finalRequirement
        };
    }

    // --------------------------------------------------
    // ACTIONS
    // --------------------------------------------------

    runExperiments(count = 1, event = null, costs = []) {
        const game = this.game;

        const result = stir(game, count, {
            onProgress: this.processProgression,
            onUnread: this.notifyUnread
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

        const totals = new Map();

        for (const change of changes) {
            if (!change.amount) continue;

            totals.set(
                change.icon,
                (totals.get(change.icon) ?? 0) + change.amount
            );
        }

        const popups = [...totals.entries()]
            .filter(([, amount]) => amount !== 0)
            .map(([icon, amount]) => ({ icon, amount }));

        this.save();
        this.refreshUI({ database: true });
        this.resourcePopups.show(popups, event);
    }

    // --------------------------------------------------
    // RENDERING
    // --------------------------------------------------

    render() {
        const game = this.game;
        const { nextDiscovery, value, max } = this.getExperimentProgress();

        // --- Manual experiment orb ---

        const orb = el(
            "button",
            {
                className: "quantum-orb",
                type: "button",
                "aria-label": "Run one quantum experiment",
                onClick: event => this.runExperiments(1, event)
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

        // --- Experiment counter ---

        const experimentCount = el("div", {
            className: "experiment-count",
            text: `${formatNumber(game.clicks)} experiments completed`
        });

        // --- Batch run (×10) ---

        const runTenButton = Button(
            "RUN ×10",
            event => {
                if ((game.inventory.particles ?? 0) < 10) {
                    this.showToast("Requires 10 Particles.");
                    return;
                }

                removeInventoryItem(game, "particles", 10);

                addLog(
                    game,
                    "BATCH: Consumed 10 Particles to run ten experiments."
                );

                this.runExperiments(10, event, [{ amount: -10, icon: "⚛️" }]);
            },
            {
                variant: "primary-button",
                disabled: (game.inventory.particles ?? 0) < 10
            }
        );

        // --- Convert particles to energy ---

        const convertButton = Button(
            "CONVERT",
            event => {
                const result = consumeParticles(game);

                if (result.particles > 0) {
                    this.save();
                    this.refreshUI({ database: true });

                    this.resourcePopups.show(
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

        // --- Discovery progress ---

        const experimentProgress = ProgressBar({
            label: nextDiscovery
                ? "Experiment progress:"
                : "Observation index complete",
            value,
            max,
            format: (v, m) =>
                nextDiscovery ? `${Math.floor(v)} / ${m}` : "COMPLETE"
        });

        // --- Panel body ---

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
            unread: this.unreadManager.isUnread("operations", "quantum-field"),
            onAcknowledge: () => {
                this.unreadManager.markRead("operations", "quantum-field");
            }
        });

        this.refs = {
            experimentCount,
            runTenButton,
            convertButton,
            experimentProgress,
            quantumFieldPanel
        };

        this.element = el("div", { className: "experiment-panel" }, [
            quantumFieldPanel.element
        ]);

        return this.element;
    }

    getElement() {
        if (!this.element) this.render();

        this.update();
        return this.element;
    }

    // --------------------------------------------------
    // UPDATE
    // --------------------------------------------------

    update() {
        if (!this.element) return this;

        const game = this.game;
        const { nextDiscovery, value, max } = this.getExperimentProgress();

        this.refs.experimentCount.textContent = `${formatNumber(game.clicks)} experiments completed`;

        this.refs.runTenButton.disabled = (game.inventory.particles ?? 0) < 10;

        this.refs.convertButton.disabled = (game.inventory.particles ?? 0) <= 0;

        const progressLabel = this.refs.experimentProgress.querySelector(
            ".progress-label span:first-child"
        );

        if (progressLabel) {
            progressLabel.textContent = nextDiscovery
                ? "Experiment progress:"
                : "Observation index complete";
        }

        this.refs.experimentProgress.setValue(value, max);

        this.updateQuantumFieldPanel();

        return this;
    }

    updateQuantumFieldPanel() {
        const panel = this.refs.quantumFieldPanel;
        if (!panel) return;

        const game = this.game;
        const unlocked = Boolean(game.operations?.quantumFieldUnlocked);

        if (unlocked && panel.locked) {
            panel.unlock({
                unread: this.unreadManager.isUnread(
                    "operations",
                    "quantum-field"
                ),
                expanded: false
            });
        } else if (!unlocked && !panel.locked) {
            panel.setLocked(true);
        }

        if (unlocked && panel.status !== "AVAILABLE") {
            panel.setStatus("AVAILABLE");
        }

        panel.setUnread(
            this.unreadManager.isUnread("operations", "quantum-field")
        );
    }
}
