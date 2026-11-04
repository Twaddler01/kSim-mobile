const SVG_NS = "http://www.w3.org/2000/svg";

export function createSvgElement(tag, attrs = {}) {
    const element = document.createElementNS(SVG_NS, tag);

    for (const [name, value] of Object.entries(attrs)) {
        element.setAttribute(name, String(value));
    }

    return element;
}

export function addShape(svg, tag, attrs = {}) {
    const element = createSvgElement(tag, attrs);
    svg.append(element);
    return element;
}

export function addShapes(svg, shapes) {
    for (const shape of shapes) {
        addShape(svg, shape.tag, shape.attrs);
    }
}

export function addFeatherMask(
    svg,
    id,
    { fadeStart = 0.55, fadeEnd = 1.0 } = {}
) {
    const defs = createSvgElement("defs");

    const gradient = createSvgElement("radialGradient", {
        id: `${id}-g`,
        cx: "0.5",
        cy: "0.5",
        r: "0.7"
    });
    gradient.appendChild(
        createSvgElement("stop", {
            offset: String(fadeStart),
            "stop-color": "#fff",
            "stop-opacity": "1"
        })
    );
    gradient.appendChild(
        createSvgElement("stop", {
            offset: String(fadeEnd),
            "stop-color": "#fff",
            "stop-opacity": "0"
        })
    );
    defs.appendChild(gradient);

    const mask = createSvgElement("mask", { id });
    mask.appendChild(
        createSvgElement("rect", {
            width: "48",
            height: "48",
            fill: `url(#${id}-g)`
        })
    );
    defs.appendChild(mask);

    svg.appendChild(defs);
    return mask;
}
