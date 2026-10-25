const GRID_SIZE = 4;
const CELL_COST = 10;

function createTiles(planId, expressions) {
    return expressions.map((expression, index) => {
        const row = Math.floor(index / GRID_SIZE) + 1;
        const column = (index % GRID_SIZE) + 1;

        const position = `r${String(row).padStart(2, "0")}-c${String(column).padStart(2, "0")}`;

        return {
            id: position,
            row,
            column,
            expression,
            cost: CELL_COST,
            svg: new URL(
                `../assets/formulas/${planId}/tiles/${position}.svg`,
                import.meta.url
            ).href
        };
    });
}

export const planDefinitions = [
    {
        id: "plan-001",
        number: "001",
        name: "Temporal Resonance",
        description: "THEORETICAL RECONSTRUCTION",
        rows: GRID_SIZE,
        columns: GRID_SIZE,
        cellCost: CELL_COST,
        completeSvg: new URL(
            "../assets/formulas/plan-001/complete.svg",
            import.meta.url
        ).href,
        tiles: createTiles("plan-001", [
            "∂Ψ/∂t",
            "= κ∇²Φ",
            "+ λΨ",
            "− Ω₀",
            "E = mc²",
            "+ β/a",
            "× 2",
            "= R(t)",
            "∫ρ dx",
            "− Ξτ",
            "∇ × A",
            "+ κ₀",
            "lim Δt→0",
            "Ψ(t)",
            "↔ K",
            "Ω = 0"
        ])
    }
];
