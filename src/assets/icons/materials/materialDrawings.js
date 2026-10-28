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

function drawStoneCore(svg) {
    const shapes = [
        {
            tag: "path",
            attrs: {
                d: "M7 17 15 6 29 4 40 14 43 27 34 40 18 43 6 32 4 23Z",
                fill: "#555e68",
                stroke: "#aeb7c2",
                "stroke-width": "1.5",
                "stroke-linejoin": "round"
            }
        },
        {
            tag: "path",
            attrs: {
                d: "M15 6 23 18 7 17Z",
                fill: "#c0c7ce"
            }
        },
        {
            tag: "path",
            attrs: {
                d: "M15 6 29 4 23 18Z",
                fill: "#929ca7"
            }
        },
        {
            tag: "path",
            attrs: {
                d: "M29 4 40 14 30 23 23 18Z",
                fill: "#737e8a"
            }
        },
        {
            tag: "path",
            attrs: {
                d: "M7 17 23 18 18 31 6 32 4 23Z",
                fill: "#89939e"
            }
        },
        {
            tag: "path",
            attrs: {
                d: "M23 18 30 23 34 40 18 43 18 31Z",
                fill: "#626c77"
            }
        },
        {
            tag: "path",
            attrs: {
                d: "M30 23 40 14 43 27 34 40Z",
                fill: "#a3adb8"
            }
        },
        {
            tag: "path",
            attrs: {
                d: "M11 25 16 21",
                fill: "none",
                stroke: "#dce1e6",
                "stroke-width": "1.5",
                "stroke-linecap": "round"
            }
        }
    ];

    addShapes(svg, shapes);
}

export const materialDrawings = {
    stone: {
        core: drawStoneCore
    },
    copper: {
        core: drawCopperCore
    }
};