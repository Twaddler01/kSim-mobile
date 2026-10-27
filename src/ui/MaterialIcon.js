const SVG_NS = "http://www.w3.org/2000/svg";

const materialDrawings = {
    copper(svg) {
        svg.setAttribute("viewBox", "0 0 48 48");

        const shapes = [
            {
                tag: "path",
                attrs: {
                    d: "M24 3 38 12 42 29 29 43 12 39 5 23 11 9Z",
                    fill: "#713b2b",
                    stroke: "#f0a078",
                    "stroke-width": "1.5",
                    "stroke-linejoin": "round"
                }
            },
            {
                tag: "path",
                attrs: {
                    d: "M24 3 25 20 11 9Z",
                    fill: "#f4b08a"
                }
            },
            {
                tag: "path",
                attrs: {
                    d: "M24 3 38 12 25 20Z",
                    fill: "#c87950"
                }
            },
            {
                tag: "path",
                attrs: {
                    d: "M11 9 25 20 12 29 5 23Z",
                    fill: "#db895d"
                }
            },
            {
                tag: "path",
                attrs: {
                    d: "M25 20 38 12 42 29 27 30Z",
                    fill: "#a95c3d"
                }
            },
            {
                tag: "path",
                attrs: {
                    d: "M12 29 25 20 27 30 29 43 12 39Z",
                    fill: "#b96b49"
                }
            },
            {
                tag: "path",
                attrs: {
                    d: "M27 30 42 29 29 43Z",
                    fill: "#e6a078"
                }
            },
            {
                tag: "path",
                attrs: {
                    d: "M18 13 22 10",
                    fill: "none",
                    stroke: "#ffe0c7",
                    "stroke-width": "1.5",
                    "stroke-linecap": "round"
                }
            }
        ];

        for (const shape of shapes) {
            const element = document.createElementNS(SVG_NS, shape.tag);

            for (const [name, value] of Object.entries(shape.attrs)) {
                element.setAttribute(name, value);
            }

            svg.append(element);
        }
    }
};

export function MaterialIcon(materialId, { size = 32, className = "" } = {}) {
    const svg = document.createElementNS(SVG_NS, "svg");

    svg.setAttribute("width", String(size));
    svg.setAttribute("height", String(size));
    svg.setAttribute("viewBox", "0 0 48 48");
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    svg.setAttribute("class", `material-icon ${className}`.trim());

    const draw = materialDrawings[materialId];

    if (draw) {
        draw(svg);
    } else {
        // Temporary fallback until each material has an SVG.
        const fallback = document.createElementNS(SVG_NS, "text");

        fallback.setAttribute("x", "24");
        fallback.setAttribute("y", "32");
        fallback.setAttribute("text-anchor", "middle");
        fallback.setAttribute("font-size", "28");
        fallback.setAttribute("fill", "currentColor");
        fallback.textContent = "◈";

        svg.append(fallback);
    }

    return svg;
}

export default MaterialIcon;
