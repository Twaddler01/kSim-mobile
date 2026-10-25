import { el } from "./Element.js";
import { Button } from "./Button.js";
import { ProgressBar } from "./ProgressBar.js";
import { itemDomId } from "./itemNavigation.js";

export default class DiscoveryPanel {
    constructor({
        getGame,
        discoveries,
        resourceDefinitions,
        canAfford,
        payCost,
        costLabel,
        addLog,
        save,
        showToast,
        refreshUI,
        unreadManager
    }) {
        this.getGame = getGame;
        this.discoveries = discoveries;
        this.resourceDefinitions = resourceDefinitions;
        this.canAfford = canAfford;
        this.payCost = payCost;
        this.costLabel = costLabel;
        this.addLog = addLog;
        this.save = save;
        this.showToast = showToast;
        this.refreshUI = refreshUI;
        this.unreadManager = unreadManager;
    }

    get game() {
        return this.getGame();
    }

    render() {
        const game = this.game;
        const list = el("div", { className: "item-list" });

        for (const item of this.discoveries) {
            const triggered = (game.triggered ?? []).includes(item.id);

            // Hidden observations remain invisible until triggered.
            if (item.hidden && !triggered) continue;

            const unlocked = game.discoveries.includes(item.id);
            const unread = this.unreadManager?.isUnread(
                "observations",
                item.id
            );
            const investigatable = item.hidden && !unlocked;
            const cost = item.cost ?? {};
            const affordable = this.canAfford(game, cost);

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
                        text: `Investigation cost: ${this.costLabel(
                            cost,
                            this.resourceDefinitions
                        )}`
                    }),
                    Button("INVESTIGATE", () => this.investigate(item), {
                        variant: "primary-button",
                        disabled: !affordable
                    })
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
                        id: itemDomId("observations", item.id),
                        className:
                            `list-item ${unlocked ? "is-unlocked" : ""}` +
                            (unread ? " is-unread" : ""),
                        onClick: () => {
                            if (unread) {
                                this.unreadManager?.markRead(
                                    "observations",
                                    item.id
                                );
                            }
                        }
                    },
                    [body]
                )
            );
        }

        return list;
    }

    investigate(item) {
        const game = this.game;

        if (!(game.triggered ?? []).includes(item.id)) return;
        if (game.discoveries.includes(item.id)) return;

        const cost = item.cost ?? {};

        if (!this.payCost(game, cost)) {
            this.showToast("Insufficient research resources.");
            return;
        }

        game.discoveries.push(item.id);

        this.addLog(
            game,
            `INVESTIGATION COMPLETE: ${item.name}. ${item.description}`,
            "important",
            "observations",
            item.id
        );

        this.save();
        this.refreshUI({ database: true });
    }
}
