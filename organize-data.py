
#!/usr/bin/env python3

"""
kSim-mobile — Batch 2 data organization

Default: dry-run only.
Apply changes: python organize-data.py --apply
"""

from pathlib import Path, PurePosixPath
import argparse
import os
import re
import shutil
import sys


ROOT = Path(__file__).resolve().parent
SRC = ROOT / "src"
DATA_FILE = SRC / "data.js"
BACKUP_FILE = SRC / "data.js.batch2.bak"

# Export name -> destination module
EXPORTS = {
    "initialGameData": "initialGameData.js",
    "resourceDefinitions": "resources.js",
    "discoveries": "discoveries.js",
    "upgradeDefinitions": "upgrades.js",
    "FIELD_DEFINITIONS": "fields.js",
}

# Only files that actually need to move.
MOVES = {
    "src/data/refinement.js": "src/data/recipes/refinement.js",
    "src/data/fabrication.js": "src/data/recipes/fabrication.js",
    "src/data/assembly.js": "src/data/recipes/assembly.js",
}

# Matches ordinary static named imports.
IMPORT_RE = re.compile(
    r"""(?P<indent>^[ \t]*)import\s*
        \{(?P<names>[^{}]*?)\}\s*
        from\s*
        (?P<quote>["'])
        (?P<source>[^"']+)
        (?P=quote)
        (?P<semicolon>;?)
    """,
    re.MULTILINE | re.VERBOSE,
)


def relative_import(importer, target):
    """Return a JS import path from importer to target."""
    importer_dir = PurePosixPath(importer).parent
    relative = os.path.relpath(
        str(target),
        str(importer_dir)
    ).replace("\\", "/")

    if not relative.startswith("."):
        relative = "./" + relative

    return relative


def normalize_project_path(path):
    """Normalize a project-relative path using POSIX separators."""
    normalized = os.path.normpath(str(path)).replace("\\", "/")
    return normalized.removeprefix("./")


def resolve_import(importer, source):
    """Resolve an import source to a project-relative path."""
    importer_dir = PurePosixPath(importer).parent
    resolved = importer_dir / source
    return normalize_project_path(resolved)


def parse_import_names(names):
    """Parse named imports while preserving aliases."""
    result = []

    for item in names.split(","):
        item = item.strip()

        if not item:
            continue

        result.append(item)

    return result


def get_original_name(specifier):
    """Get the exported name, ignoring any local alias."""
    parts = re.split(r"\s+as\s+", specifier.strip())

    if len(parts) == 2:
        return parts[0].strip()

    return parts[0].strip()


def split_data_import(importer, names):
    """Split imports from data.js into their new destination modules."""
    grouped = {}

    for specifier in parse_import_names(names):
        original_name = get_original_name(specifier)

        if original_name not in EXPORTS:
            raise ValueError(
                f"Unknown export '{original_name}' imported by {importer}"
            )

        destination = EXPORTS[original_name]
        grouped.setdefault(destination, []).append(specifier)

    replacements = []

    for destination, specifiers in grouped.items():
        target = f"src/data/{destination}"
        source = relative_import(importer, target)

        replacements.append(
            f'import {{ {", ".join(specifiers)} }} from "{source}";'
        )

    return "\n".join(replacements)


def transform_imports(importer, content):
    """Update imports that reference data.js or moved recipe files."""
    changed = False

    def replace(match):
        nonlocal changed

        source = match.group("source")
        resolved = resolve_import(importer, source)

        # Imports from the old central data.js.
        if resolved == "src/data.js":
            replacement = split_data_import(
                importer,
                match.group("names")
            )
            changed = True
            return replacement

        # Imports from recipe files that are moving.
        for old_path, new_path in MOVES.items():
            if resolved == normalize_project_path(old_path):
                new_source = relative_import(importer, new_path)

                changed = True
                return (
                    f'import {{ {match.group("names").strip()} }} '
                    f'from "{new_source}";'
                )

        return match.group(0)

    updated = IMPORT_RE.sub(replace, content)
    return updated, changed


def extract_data_exports(content):
    """Extract each expected export block from src/data.js."""
    pattern = re.compile(
        r"^export\s+const\s+([A-Za-z_$][\w$]*)\s*=",
        re.MULTILINE
    )

    matches = list(pattern.finditer(content))

    if not matches:
        raise ValueError("No 'export const' declarations found in src/data.js")

    found = {
        match.group(1)
        for match in matches
    }

    missing = set(EXPORTS) - found
    unexpected = found - set(EXPORTS)

    if missing:
        raise ValueError(
            "Missing expected exports: " + ", ".join(sorted(missing))
        )

    if unexpected:
        print(
            "WARNING: Additional exports found: "
            + ", ".join(sorted(unexpected))
        )

    header = content[:matches[0].start()].strip()

    extracted = {}

    for index, match in enumerate(matches):
        name = match.group(1)
        start = match.start()

        if index + 1 < len(matches):
            end = matches[index + 1].start()
        else:
            end = len(content)

        block = content[start:end].strip()

        if name in EXPORTS:
            extracted[name] = block

    return header, extracted


def collect_javascript_files():
    """Find project JS files, excluding generated/dependency folders."""
    excluded = {
        "node_modules",
        ".git",
    }

    files = []

    for path in ROOT.rglob("*.js"):
        relative = path.relative_to(ROOT)

        if any(part in excluded for part in relative.parts):
            continue

        if path == Path(__file__).resolve():
            continue

        files.append(path)

    return sorted(files)


def build_plan():
    """Build all output content and import updates without writing files."""
    if not DATA_FILE.exists():
        raise FileNotFoundError(f"Missing source file: {DATA_FILE}")

    if BACKUP_FILE.exists():
        raise FileExistsError(
            f"Backup already exists: {BACKUP_FILE}\n"
            "Rename or remove it before applying another migration."
        )

    header, extracted = extract_data_exports(
        DATA_FILE.read_text(encoding="utf-8")
    )

    writes = {}

    for export_name, filename in EXPORTS.items():
        destination = SRC / "data" / filename

        if destination.exists():
            raise FileExistsError(
                f"Destination already exists: {destination}"
            )

        block = extracted[export_name]

        if export_name == "initialGameData" and header:
            output = header + "\n\n" + block + "\n"
        else:
            output = block + "\n"

        writes[destination] = output

    moves = []

    for old_relative, new_relative in MOVES.items():
        old_path = ROOT / old_relative
        new_path = ROOT / new_relative

        if not old_path.exists():
            raise FileNotFoundError(f"Missing recipe file: {old_path}")

        if new_path.exists():
            raise FileExistsError(
                f"Recipe destination already exists: {new_path}"
            )

        moves.append((old_path, new_path))

    # Build all import updates in memory.
    import_updates = {}

    for path in collect_javascript_files():
        if path == DATA_FILE:
            continue

        relative = path.relative_to(ROOT).as_posix()
        original = path.read_text(encoding="utf-8")

        updated, changed = transform_imports(relative, original)

        if changed:
            import_updates[path] = updated

    return writes, moves, import_updates


def display_plan(writes, moves, import_updates):
    print("\nDATA ORGANIZATION PLAN")
    print("=" * 22)

    print("\nCREATE:")
    for path in writes:
        print(f"  {path.relative_to(ROOT)}")

    print("\nMOVE:")
    for old_path, new_path in moves:
        print(
            f"  {old_path.relative_to(ROOT)}"
            f" -> {new_path.relative_to(ROOT)}"
        )

    print("\nUPDATE IMPORTS:")
    if import_updates:
        for path in import_updates:
            print(f"  {path.relative_to(ROOT)}")
    else:
        print("  No import changes needed.")

    print("\nBACKUP:")
    print(f"  {BACKUP_FILE.relative_to(ROOT)}")

    print("\nREMOVE:")
    print(f"  {DATA_FILE.relative_to(ROOT)}")


def apply_plan(writes, moves, import_updates):
    """Apply the prepared plan."""
    recipe_directory = SRC / "data" / "recipes"
    recipe_directory.mkdir(parents=True, exist_ok=True)

    # Preserve the original central data file first.
    shutil.copy2(DATA_FILE, BACKUP_FILE)

    try:
        # Write the split data modules.
        for path, content in writes.items():
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(content, encoding="utf-8")

        # Move recipe modules.
        for old_path, new_path in moves:
            new_path.parent.mkdir(parents=True, exist_ok=True)
            shutil.move(str(old_path), str(new_path))

        # Update imports.
        for path, content in import_updates.items():
            path.write_text(content, encoding="utf-8")

        # Remove the original only after the other operations succeed.
        DATA_FILE.unlink()

    except Exception:
        print(
            "\nERROR: Migration stopped partway through.\n"
            f"Original data.js backup is available at: {BACKUP_FILE}"
        )
        raise

    print("\nMigration applied successfully.")
    print(f"Backup retained at: {BACKUP_FILE.relative_to(ROOT)}")


def main():
    parser = argparse.ArgumentParser(
        description="Organize kSim-mobile data modules."
    )

    parser.add_argument(
        "--apply",
        action="store_true",
        help="Apply the migration. Without this flag, only show a dry-run."
    )

    args = parser.parse_args()

    try:
        writes, moves, import_updates = build_plan()
        display_plan(writes, moves, import_updates)

        if not args.apply:
            print("\nDRY RUN ONLY — no files were changed.")
            print("Review the plan, then run with --apply.")
            return

        print("\nApplying migration...")
        apply_plan(writes, moves, import_updates)

    except Exception as error:
        print(f"\nERROR: {error}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
