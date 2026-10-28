import { el } from "./Element.js";
import { createSvgElement } from "../assets/icons/materials/svgHelpers.js";
import { materialDrawings } from "../assets/icons/materials/materialDrawings.js";

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

    createMaterialIcon(target) {
        const svg = createSvgElement("svg", {
            class: "orb-material-icon",
            viewBox: "0 0 48 48",
            width: "32",
            height: "32",
            "aria-hidden": "true",
            focusable: "false"
        });

        const drawing = materialDrawings[target.id];

        if (drawing?.core) {
            drawing.core(svg);
        } else {
            // Fall back to the material's existing icon.
            const text = createSvgElement("text", {
                x: "24",
                y: "32",
                "text-anchor": "middle",
                "font-size": "28"
            });

            text.textContent = target.icon ?? "◈";
            svg.append(text);
        }

        return svg;
    }

    render() {
        this.symbol = el("span", {
            className: "orb-symbol"
        });

        this.label = el("span", {
            className: "orb-button-label",
            text: "GATHER MATERIALS"
        });

        this.description = el("span", {
            className: "orb-sub-label"
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

        // Replace the icon only when the target material changes.
        if (this.currentIconId !== target.id) {
            this.symbol.replaceChildren(this.createMaterialIcon(target));

            this.currentIconId = target.id;
        }

        this.label.textContent = "GATHER MATERIALS";
        this.description.textContent = (
            target.description || target.name
        ).toUpperCase();

        this.orb.setAttribute("aria-label", `Gather ${target.name}`);

        this.count.textContent = `${this.game.inventory?.[target.id] ?? 0} ${target.name.toLowerCase()} samples`;
    }
}
