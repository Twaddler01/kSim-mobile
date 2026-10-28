import { addShapes } from "./svgHelpers.js";

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

function drawQuartzCore(svg) {
    addShapes(svg, [
        // Dark mineral base
        {
            tag: "path",
            attrs: {
                d: "M7 34 L13 27 L21 31 L28 26 L38 32 L43 39 L36 44 L14 44 L6 39 Z",
                fill: "#55566B",
                stroke: "#34384C",
                "stroke-width": 1
            }
        },

        // Left crystal
        {
            tag: "polygon",
            attrs: {
                points: "9,29 8,18 13,12 19,18 18,32",
                fill: "#B8D9FF",
                stroke: "#E9F4FF",
                "stroke-width": 0.8
            }
        },
        {
            tag: "polygon",
            attrs: {
                points: "8,18 13,12 14,22",
                fill: "#F5FBFF"
            }
        },
        {
            tag: "polygon",
            attrs: {
                points: "13,12 19,18 14,22",
                fill: "#8CB9F2"
            }
        },
        {
            tag: "polygon",
            attrs: {
                points: "14,22 19,18 18,32 10,33",
                fill: "#718CC9"
            }
        },

        // Main crystal
        {
            tag: "polygon",
            attrs: {
                points: "17,30 17,12 24,3 31,12 31,33 24,38",
                fill: "#C9D8FF",
                stroke: "#F5F8FF",
                "stroke-width": 0.9,
                "stroke-linejoin": "round"
            }
        },
        {
            tag: "polygon",
            attrs: {
                points: "17,12 24,3 24,17 19,21",
                fill: "#F7FCFF"
            }
        },
        {
            tag: "polygon",
            attrs: {
                points: "24,3 31,12 28,21 24,17",
                fill: "#FFF0CC"
            }
        },
        {
            tag: "polygon",
            attrs: {
                points: "19,21 24,17 24,35 17,30",
                fill: "#A5B7F0"
            }
        },
        {
            tag: "polygon",
            attrs: {
                points: "24,17 28,21 31,12 31,33 24,35",
                fill: "#7F91D0"
            }
        },

        // Right crystal
        {
            tag: "polygon",
            attrs: {
                points: "30,32 32,19 37,14 42,20 40,34 35,38",
                fill: "#B9C8F5",
                stroke: "#EDF3FF",
                "stroke-width": 0.7
            }
        },
        {
            tag: "polygon",
            attrs: {
                points: "32,19 37,14 37,25",
                fill: "#F7FCFF"
            }
        },
        {
            tag: "polygon",
            attrs: {
                points: "37,14 42,20 37,25",
                fill: "#D4BDF7"
            }
        },
        {
            tag: "polygon",
            attrs: {
                points: "37,25 42,20 40,34 35,38",
                fill: "#8796D0"
            }
        },

        // Front crystal
        {
            tag: "polygon",
            attrs: {
                points: "22,37 22,29 26,25 30,29 30,38 26,41",
                fill: "#E5E8FF",
                stroke: "#FFFFFF",
                "stroke-width": 0.7
            }
        },
        {
            tag: "polygon",
            attrs: {
                points: "22,29 26,25 26,34",
                fill: "#FFFFFF"
            }
        },
        {
            tag: "polygon",
            attrs: {
                points: "26,25 30,29 26,34",
                fill: "#C4B5F2"
            }
        },
        {
            tag: "polygon",
            attrs: {
                points: "26,34 30,29 30,38 26,41",
                fill: "#8E9CD8"
            }
        },

        // Crystal glints
        {
            tag: "path",
            attrs: {
                d: "M20 12 L24 6 M11 18 L13 15 M34 20 L37 16",
                fill: "none",
                stroke: "#FFFFFF",
                "stroke-width": 0.9,
                "stroke-linecap": "round",
                opacity: 0.9
            }
        }
    ]);
}

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
    stone: { core: drawStoneCore },
    quartz: { core: drawQuartzCore },
    copper: { core: drawCopperCore }
};
