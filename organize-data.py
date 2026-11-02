
from pathlib import Path
import argparse
import re
import shutil
import sys

ROOT = Path(__file__).resolve().parent
SRC = ROOT / "src"

# Existing files that need to move.
MOVES = {
    "src/data/inventory.js": "src/data/inventory.js",
    "src/data/materials.js": "src/data/materials.js",
    "src/data/plans.js": "src/data/plans.js",
    "src/data/progression.js": "src/data/progression.js",
    "src/data/refinement.js": "src/data/recipes/refinement.js",
    "src/data/fabrication.js": "src/data/recipes/fabrication.js",
    "src/data/assembly.js": "src/data/recipes/assembly.js",
}

# Each export from the old data.js has one destination.
EXPORTS = {
    "initialGameData": "initialGameData.js",
    "resourceDefinitions": "resources.js",
    "discoveries": "discoveries.js",
    "upgradeDefinitions": "upgrades.js",
    "FIELD_DEFINITIONS": "fields.js",
}

# Used to identify imports that need to be redirected
# from the old data.js into the new definition modules.
EXPORT_MODULES = {
    "initialGameData": "initialGameData.js",
    "resourceDefinitions": "resources.js",
    "discoveries": "discoveries.js",
    "upgradeDefinitions": "upgrades.js",
    "FIELD_DEFINITIONS": "fields.js",
}

IMPORT_RE = re.compile(
    r'(?P<statement>import\s+(?P<clause>[\s\S]*?)\s+from\s+'
    r'(?P<quote>["\'])(?P<path>[^"\']+)(?P=quote)\s*;?)',
    re.MULTILINE
)

def relative_import(importer, target):
    path = Path(
        __import__("os").path.relpath(
            target,
            importer.parent
        )
    ).as_posix()

    if not path.startswith("."):
        path = "./" + path

    return path

def split_data_file(content):
    header = content[:content.index("export const initialGameData")]

    sections = {}

    for name, filename in EXPORTS.items():
        marker = f"export const {name} ="

        if marker not in content:
            raise ValueError(f"Missing export: {name}")

        start = content.index(marker)

        next_positions = [
            content.find(f"export const {other} =", start + len(marker))
            for other in EXPORTS
            if content.find(f"export const {other} =", start + len(marker)) != -1
        ]

        end = min(next_positions) if next_positions else len(content)

        sections[filename] = content[start:end].strip() + "\n"

    sections["initialGameData.js"] = (
        header + sections["initialGameData.js"]
    )

    return sections

def transform_imports(path, content, old_to_new):
    old_path = Path(path)

    def replace(match):
        clause = match.group("clause")
        old_specifier = match.group("path")

        if not old_specifier.startswith("."):
            return match.group("statement")

        old_target = (old_path.parent / old_specifier).as_posix()
        old_target = str(Path(old_target))

        # Imports from the former combined data.js need splitting
        # according to their imported names.
        if old_target == "src/data.js":
            names = re.findall(
                r'\b([A-Za-z_$][\w$]*)\b',
                clause
            )

            # Preserve aliases as well as ordinary named imports.
            imports = []
            for name in dict.fromkeys(names):
                if name in EXPORT_MODULES:
                    module = EXPORT_MODULES[name]
                    target = Path("src/data") / module
                    specifier = relative_import(
                        Path(path),
                        target
                    )
                    imports.append(
                        f'import {{ {name} }} from "{specifier}";'
                    )

            if imports:
                return "\n".join(imports)

            return match.group("statement")

        new_target = old_to_new.get(old_target)

        if new_target is None:
            return match.group("statement")

        specifier = relative_import(
            Path(path),
            Path(new_target)
        )

        return match.group("statement").replace(
            old_specifier,
            specifier
        )

    return IMPORT_RE.sub(replace, content)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    if args.apply and args.dry_run:
        parser.error("Choose either --apply or --dry-run")

    apply = args.apply

    old_data = SRC / "data.js"

    if not old_data.exists():
        sys.exit("ERROR: src/data.js was not found.")

    if (SRC / "data" / "recipes").exists() and any(
        (SRC / "data" / "recipes").iterdir()
    ):
        sys.exit("ERROR: recipes folder already contains files.")

    content = old_data.read_text(encoding="utf-8")
    sections = split_data_file(content)

    # Map old file locations to their new locations.
    path_map = {
        "src/data.js": None,
        **MOVES
    }

    for filename in EXPORTS.values():
        path_map[f"src/data/{filename}"] = f"src/data/{filename}"

    # The importer's old path is needed to resolve its existing
    # relative imports before calculating its new relative paths.
    importer_moves = {
        "src/data.js": None,
        **{
            old: new
            for old, new in MOVES.items()
        }
    }

    operations = []

    # Prepare new definition files.
    for filename, text in sections.items():
        target = SRC / "data" / filename
        operations.append(("write", target, text))

    # Prepare existing module moves.
    for old, new in MOVES.items():
        source = ROOT / old
        target = ROOT / new

        if not source.exists():
            sys.exit(f"ERROR: Missing source file: {old}")

        operations.append(("move", source, target))

    # Update all JavaScript imports.
    changes = []

    for file in ROOT.rglob("*.js"):
        relative = file.relative_to(ROOT).as_posix()

        if "node_modules" in file.parts or ".git" in file.parts:
            continue

        new_relative = importer_moves.get(relative, relative)

        if new_relative is None:
            continue

        text = file.read_text(encoding="utf-8")
        updated = transform_imports(
            new_relative,
            text,
            path_map
        )

        if updated != text:
            changes.append((file, updated))

    print("\nDATA ORGANIZATION PLAN")
    print("======================")

    for action, source, destination in operations:
        if action == "write":
            print(f"CREATE {destination.relative_to(ROOT)}")
        else:
            print(
                f"MOVE   {source.relative_to(ROOT)}"
                f" -> {destination.relative_to(ROOT)}"
            )

    for file, updated in changes:
        print(f"IMPORT {file.relative_to(ROOT)}")

    print(f"\n{len(operations)} file operations")
    print(f"{len(changes)} import updates")

    if not apply:
        print("\nDry run only. No files changed.")
        print("Run with --apply to perform the migration.")
        return

    # Make a backup before changing anything.
    backup = ROOT / "data.js.batch2.bak"

    if backup.exists():
        sys.exit("ERROR: data.js.batch2.bak already exists.")

    shutil.copy2(old_data, backup)

    # Create the new folders and write definitions.
    for action, source, destination in operations:
        if action == "write":
            destination.parent.mkdir(parents=True, exist_ok=True)
            destination.write_text(source, encoding="utf-8")
        else:
            destination.parent.mkdir(parents=True, exist_ok=True)
            shutil.move(str(source), str(destination))

    # Rewrite imports.
    for file, updated in changes:
        file.write_text(updated, encoding="utf-8")

    old_data.unlink()

    print("\nMigration complete.")
    print(f"Backup: {backup.relative_to(ROOT)}")

if __name__ == "__main__":
    main()
