import { addShapes } from "./svgHelpers.js";

function drawCopperCore(svg) {
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

    addShapes(svg, shapes);
}

export const materialDrawings = {
    copper: {
        core: drawCopperCore
    }
};
