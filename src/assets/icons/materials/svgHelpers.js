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
