import { el } from "./Element.js";

export default class MaterialRecoveryOrb {
    constructor({ getGame, getTarget, onGather }) {
        this.getGame = getGame;
        this.getTarget = getTarget;
        this.onGather = onGather;

        this.element = this.render();
    }

    get game() {
        return this.getGame();
    }

    get target() {
        return this.getTarget();
    }

    render() {
        this.symbol = el("span", {
            className: "orb-symbol",
            text: this.target.icon
        });

        this.label = el("span", {
            className: "orb-button-label",
            text: "GATHER MATERIALS"
        });

        this.description = el("span", {
            className: "orb-sub-label",
            text: this.target.name.toUpperCase()
        });

        this.count = el("div", {
            className: "experiment-count"
        });

        this.orb = el(
            "button",
            {
                className: "quantum-orb quantum-orb--material",
                type: "button",
                "aria-label": `Gather ${this.target.name}`,
                onClick: event => this.onGather(event, this.target)
            },
            [
                el("span", { className: "orb-rings" }),
                this.symbol,
                this.label,
                this.description
            ]
        );

        this.element = el("div", { className: "quantum-orb-wrap" }, [
            this.orb,
            this.count
        ]);

        this.update();

        return this.element;
    }

    getElement() {
        return this.element;
    }

    update() {
        const target = this.target;

        this.symbol.textContent = target.icon;
        this.label.textContent = "GATHER MATERIALS";
        this.description.textContent = (
            target.description || target.name
        ).toUpperCase();

        this.orb.setAttribute("aria-label", `Gather ${target.name}`);

        this.count.textContent = `${this.game.inventory?.[target.id] ?? 0} ${target.name.toLowerCase()} samples`;
    }
}
