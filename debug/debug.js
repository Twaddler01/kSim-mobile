// debug/debug.js
import DebugButton from "./DebugButtons.js";

export function initializeDebug(main = {}) {

const game = window.game;
const kSim = window.kSim;

const { 
    ui, 
    el, 
    Card, 
    Button,
    ProgressBar
} = main;
    
new DebugButton({
    id: "cardtestdebug",
    label: "add: CARD TEST",
    run: () => {
        if (ui.tabs.tabs.some(tab => tab.id === "card-test")) return;

        ui.tabs.addTab({
            id: "card-test",
            label: "CARD TEST",
            render: renderCardTestTab
        }, {
            activate: true
        });
    }
});

new DebugButton({
    id: "cardtestdebug2",
    label: "remove: CARD TEST",
    run: () => {
        ui.tabs.removeTab("card-test");
    }
});










new DebugButton({
    id: "testAnnouncement",
    label: "testAnnouncement",
    run: () => {
        kSim.testAnnouncement();
        setTimeout(() => {
            kSim.testAnnouncement();
        }, 2000);
    }
});

new DebugButton({
    id: "showAnnouncementLab",
    label: "showAnnouncementLab",
    run: () => {
        showAnnouncement({
            title: "NAV: PLAN TAB",
            message: "Go to PLAN tab.",
            actionLabel: "OPEN PLAN",
            onGoTo: () => navigateTo({ tab: "plan" })
        });
    }
});

new DebugButton({
    id: "showAnnouncementField",
    label: "showAnnouncementField",
    run: () => {
        showAnnouncement({
            title: "NEW FIELD",
            message: "Review the new discovery in FIELD WORK.",
            actionLabel: "VIEW NOW",
            onGoTo: () =>
                navigateToItem({
                    tab: "gathering",
                    itemId: "field-quartz"
                })
        });
    }
});

const navigationTests = [
    {
        name: "Open FIELD WORK",
        target: { tab: "gathering" }
    },
    {
        name: "Open field selector",
        target: { tab: "gathering", pageId: "selector" }
    },
    {
        name: "Open Quartz Field",
        target: { tab: "gathering", pageId: "copper" }
    },
    {
        name: "Open Quartz upgrade card",
        target: {
            tab: "gathering",
            pageId: "copper",
            itemId: "field-upgrade-tools"
        }
    },
    {
        name: "Test invalid page",
        target: {
            tab: "gathering",
            pageId: "not-a-real-field"
        }
    }
];

let navigationTestIndex = 0;

async function runNextNavigationTest() {
    const test = navigationTests[navigationTestIndex];

    if (!test) {
        console.log("[Navigation Test] All tests completed. Resetting cycle.");
        navigationTestIndex = 0;
        return;
    }

    console.log(
        `[Navigation Test ${navigationTestIndex + 1}/${navigationTests.length}] ${test.name}`,
        test.target
    );

    const result = await navigateTo(test.target);

    console.log(`[Navigation Test] ${test.name}:`, result);

    navigationTestIndex = (navigationTestIndex + 1) % navigationTests.length;
}

new DebugButton({
    id: "navigationTestCycle",
    label: "Navigation Test →",
    run: () => runNextNavigationTest()
});

// ==================================
// FUNCTIONS
// ==================================

function debugLogState(label = "Manual log check") {
    const entries = game.log ?? [];
    const unread = game.unread ?? {};

    const snapshot = {
        label,
        time: new Date().toISOString(),
        logLength: entries.length,

        visibleLogEntries: entries.filter(
            entry =>
                entry?.tab === "log" &&
                typeof entry.message === "string" &&
                entry.message.trim().length > 0
        ).length,

        entries: entries.map(entry => ({
            id: entry?.id ?? null,
            category: entry?.category ?? "LEGACY/UNKNOWN",
            tab: entry?.tab ?? "MISSING",
            message: entry?.message ?? String(entry),
            timestamp: entry?.timestamp ?? null
        })),

        logSequence: game.logSequence ?? null,

        unread: {
            items: structuredClone(unread.items ?? {}),
            pending: structuredClone(unread.pending ?? {})
        },

        savedLog: (() => {
            try {
                const saved = JSON.parse(
                    localStorage.getItem("ksim-quantum-foundations-v1")
                );

                return {
                    logLength: saved?.log?.length ?? 0,
                    entries: (saved?.log ?? []).map(entry => ({
                        id: entry?.id ?? null,
                        category: entry?.category ?? "LEGACY/UNKNOWN",
                        tab: entry?.tab ?? "MISSING",
                        message: entry?.message ?? String(entry)
                    })),
                    unread: saved?.unread ?? null
                };
            } catch (error) {
                return { error: String(error) };
            }
        })()
    };

    console.log(`[LOG DEBUG] ${label}`, snapshot);
    return snapshot;
}

function renderCardTestTab() {
    // Demo-only state. Recreated whenever the tab is rendered.
    let processStarted = false;
    let processProgress = 0;

    const container = el("div", {
        className: "card-test-playground"
    });

    // ========================================
    // Example 1: Basic refinement
    // ========================================

    const refinementCard = Card(
        "Purify Silica",
        [
            Card.Text("Refine raw silica into a more useful material."),

            Card.Requirements([
                {
                    icon: "🪨",
                    label: "Raw Silica",
                    available: 24,
                    required: 5
                }
            ]),

            Card.Output([
                {
                    icon: "💎",
                    label: "Refined Silica",
                    amount: 2
                }
            ]),

            Card.Text("Duration: 0.5 seconds"),

            Card.Actions([
                {
                    label: "Refine",
                    onClick: () => alert("Demo: Refinement started!")
                }
            ])
        ],
        "Basic material processing",
        { icon: "⚗️" }
    );

    // ========================================
    // Example 2: Fabrication
    // ========================================

    const fabricationCard = Card(
        "Copper Wiring",
        [
            Card.Text("Fabricate conductive wiring for future equipment."),

            Card.Status("Ready", { variant: "ready" }),

            Card.Requirements([
                {
                    icon: "🟠",
                    label: "Copper",
                    available: 18,
                    required: 8
                },
                {
                    icon: "💎",
                    label: "Refined Silica",
                    available: 3,
                    required: 2
                },
                {
                    icon: "⚡",
                    label: "Energy",
                    available: 45,
                    required: 20
                }
            ]),

            Card.Output([
                {
                    icon: "🔌",
                    label: "Copper Wiring",
                    amount: 3
                },
                {
                    icon: "♻️",
                    label: "Metal Scrap",
                    amount: 1
                }
            ]),

            Card.Text("Duration: 12 seconds"),

            Card.Actions([
                {
                    label: "Fabricate ×1",
                    onClick: () => alert("Demo: Fabrication started!")
                },
                {
                    label: "Fabricate ×10",
                    variant: "secondary-button",
                    disabled: true
                }
            ])
        ],
        "Component manufacturing",
        { icon: "🔧" }
    );

    // ========================================
    // Example 3: Active assembly
    // ========================================

    const progressBar = Card.Progress({
        label: "Assembly progress",
        value: 0,
        max: 30,
        format: (value, max) => `${Math.floor(value)} / ${max}s`
    });

    const status = Card.Status("Idle", { variant: "default" });

    const progressText = Card.Text("Waiting for assembly to begin.");

    const startButton = Button("Start Assembly", () => {
        if (processStarted) return;

        processStarted = true;
        processProgress = 0;

        status.textContent = "Running";
        status.className = "card-status card-status--running";

        progressText.textContent = "Assembly in progress...";

        startButton.disabled = true;

        const interval = setInterval(() => {
            processProgress = Math.min(30, processProgress + 1);
            progressBar.setValue(processProgress, 30);

            if (processProgress >= 30) {
                clearInterval(interval);

                status.textContent = "Complete";
                status.className = "card-status card-status--complete";

                progressText.textContent = "Assembly completed!";
                startButton.disabled = false;
                startButton.textContent = "Assembled";
                startButton.disabled = true;
            }
        }, 1000);
    });

    const assemblyCard = Card(
        "Experimental Energy Core",
        [
            Card.Text("Combine several components into a functional machine."),

            status,

            Card.Requirements([
                {
                    icon: "🔌",
                    label: "Copper Wiring",
                    available: 6,
                    required: 4
                },
                {
                    icon: "💎",
                    label: "Refined Silica",
                    available: 2,
                    required: 2
                },
                {
                    icon: "⚡",
                    label: "Energy",
                    available: 120,
                    required: 100
                },
                {
                    icon: "🧪",
                    label: "Exotic Matter",
                    available: 0,
                    required: 1
                }
            ]),

            Card.Output([
                {
                    icon: "🔋",
                    label: "Experimental Energy Core",
                    amount: 1
                }
            ]),

            Card.Section("Process", [
                progressBar,
                progressText
            ]),

            Card.Actions([
                startButton,
                {
                    label: "Cancel",
                    disabled: true
                }
            ])
        ],
        "Complex equipment assembly",
        { icon: "⚙️" }
    );

    container.append(
        refinementCard,
        fabricationCard,
        assemblyCard
    );

    return container;
}




/*
new DebugButton({
    id: "add_100_energy",
    label: "Add +100 energy",
    run: () => {
        game.resources.energy += 100;
        save();
        render();
        console.log("+100 energy added!");
    }
});

new DebugButton({
    id: "test_100_experiments",
    label: "Test 100 experiments",
    run: () => {
        runExperiments(100);
        console.log("+100 experiments tested!");
    }
});



new DebugButton({
    id: "labLog",
    label: "labLog",
    run: () => {
        const log = kSim.data.log;
        console.log(log);
    }
});

*/

}