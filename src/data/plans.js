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
            ).href,
            evidence:
                tileEvidence[position] ??
                "The expression has been recorded. Its significance remains under investigation.",

            hiddenUnlock: hiddenUnlocks[position] ?? null
        };
    });
}

const tileEvidence = {
    "r01-c01":
        "A time-dependent state is present. Its rate of change can be measured, but its origin remains unknown.",
    "r01-c02":
        "A diffusion-like term appears in the reconstruction. Its coefficient does not match the current calibration model.",
    "r01-c03":
        "A coupling term links the state to another quantity. The relationship is not yet experimentally verified.",
    "r01-c04":
        "A baseline frequency is subtracted from the expression. The reason for this correction is unclear.",

    "r02-c01":
        "The familiar energy relation appears beside unfamiliar terms. Their connection requires further investigation.",
    "r02-c02":
        "A scale-dependent correction appears. Its magnitude may change under different experimental conditions.",
    "r02-c03":
        "A simple multiplier appears in the model. It may represent a normalization step.",
    "r02-c04":
        "The expression resolves to a time-dependent result. The model's output can now be compared with observations.",

    "r03-c01":
        "An accumulated density term appears. The source quantity has not been identified.",
    "r03-c02":
        "A temporal correction is present. It may account for a delay between cause and measurement.",
    "r03-c03":
        "A rotational field term appears. No corresponding field has been identified in the current laboratory model.",
    "r03-c04":
        "A second coefficient appears with no matching entry in the calibration records.",

    "r04-c01":
        "The expression approaches a limiting condition. The assumed limit has not been tested.",
    "r04-c02":
        "The state is evaluated at a specific time. Earlier measurements do not fully reproduce this result.",
    "r04-c03":
        "The symbol K appears again. No known parameter in the laboratory database accounts for its presence.",
    "r04-c04":
        "The expression ends at a zero condition. It is unclear whether this represents equilibrium or a boundary."
};

const hiddenUnlocks = {
    "r03-c03": {
        id: "unclassified-field-signature",
        title: "Unclassified Field Signature",
        message:
            "A field signature has appeared in the reconstructed model without a corresponding entry in the instrument database."
    },
    "r04-c03": {
        id: "recurring-k-coefficient",
        title: "Recurring Coefficient",
        message:
            "The coefficient K appears in another theoretical context. The relationship between the observations remains unverified."
    }
};

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
