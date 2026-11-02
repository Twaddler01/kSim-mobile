// src/data/journal/catalog.js

import { locations } from "../entities/locations.js";
import { FIELD_DEFINITIONS } from "../fields.js";
import { materials } from "../materials.js";

import { refinementRecipes } from "../recipes/refinement.js";
import { fabricationRecipes } from "../recipes/fabrication.js";
import { assemblyRecipes } from "../recipes/assembly.js";

import { resourceDefinitions } from "../resources.js";

// --------------------------------------------------
// CATALOG BUILDER
// --------------------------------------------------

function createEntry(source, type, category) {
    return {
        id: source.id,
        type,
        category,
        name: source.name,
        icon: source.icon ?? "❔",
        description: source.description ?? "",

        metadata: {
            hidden: false,
            tags: [],
            ...source.metadata
        },

        source
    };
}

// --------------------------------------------------
// ENTITY COLLECTIONS
// --------------------------------------------------

const locationEntries = locations.map(location =>
    createEntry(location, "location", "locations")
);

const fieldEntries = FIELD_DEFINITIONS.map(field =>
    createEntry(field, "field", "fields")
);

const materialEntries = materials.map(material => {
    const categoryMap = {
        raw: "rawMaterials",
        processed: "processedMaterials",
        crafted: "craftedMaterials"
    };

    return createEntry(
        material,
        "material",
        categoryMap[material.category] ?? "materials"
    );
});

const recipeEntries = [
    ...refinementRecipes.map(recipe =>
        createEntry(recipe, "recipe", "refinementRecipes")
    ),
    ...fabricationRecipes.map(recipe =>
        createEntry(recipe, "recipe", "fabricationRecipes")
    ),
    ...assemblyRecipes.map(recipe =>
        createEntry(recipe, "recipe", "assemblyRecipes")
    )
];

const resourceEntries = resourceDefinitions.map(resource =>
    createEntry(resource, "resource", "resources")
);

// --------------------------------------------------
// PUBLIC CATALOG
// --------------------------------------------------

export const journalCatalog = [
    ...locationEntries,
    ...fieldEntries,
    ...resourceEntries,
    ...materialEntries,
    ...recipeEntries
];

// --------------------------------------------------
// LOOKUP HELPERS
// --------------------------------------------------

export function getJournalEntry(id, type = null) {
    return (
        journalCatalog.find(entry =>
            entry.id === id &&
            (!type || entry.type === type)
        ) ?? null
    );
}

export function getJournalEntriesByCategory(category) {
    return journalCatalog.filter(
        entry => entry.category === category
    );
}

export function getJournalEntriesByType(type) {
    return journalCatalog.filter(
        entry => entry.type === type
    );
}

export function getVisibleJournalEntries() {
    return journalCatalog.filter(
        entry => !entry.metadata.hidden
    );
}