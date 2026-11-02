
#!/usr/bin/env python3

"""
kSim-mobile — Batch 3: Manager organization

Dry-run:
    python organize-managers.py

Apply:
    python organize-managers.py --apply
"""

from pathlib import Path
import argparse
import sys


ROOT = Path(__file__).resolve().parent
SRC = ROOT / "src"
MANAGERS = SRC / "managers"
MAIN = ROOT / "main.js"

FILES = [
    "SaveManager.js",
    "UnreadManager.js",
    "UnlockManager.js",
    "EventProcessor.js",
]

IMPORT_REPLACEMENTS = {
    './src/SaveManager.js':
        './src/managers/SaveManager.js',

    './src/UnreadManager.js':
        './src/managers/UnreadManager.js',

    './src/UnlockManager.js':
        './src/managers/UnlockManager.js',

    './src/EventProcessor.js':
        './src/managers/EventProcessor.js',
}


def build_plan():
    if not MAIN.exists():
        raise FileNotFoundError("main.js was not found.")

    moves = []

    for filename in FILES:
        source = SRC / filename
        destination = MANAGERS / filename

        if not source.is_file():
            raise FileNotFoundError(f"Missing source: {source}")

        if destination.exists():
            raise FileExistsError(
                f"Destination already exists: {destination}"
            )

        moves.append((source, destination))

    main_content = MAIN.read_text(encoding="utf-8")
    updated_content = main_content

    for old_import, new_import in IMPORT_REPLACEMENTS.items():
        old_statement = f'from "{old_import}"'
        new_statement = f'from "{new_import}"'

        count = updated_content.count(old_statement)

        if count != 1:
            raise ValueError(
                f"Expected exactly one import for {old_import}; "
                f"found {count}."
            )

        updated_content = updated_content.replace(
            old_statement,
            new_statement
        )

    if updated_content == main_content:
        raise ValueError("No import changes were detected.")

    return moves, main_content, updated_content


def display_plan(moves):
    print("\nMANAGER ORGANIZATION PLAN")
    print("=" * 26)

    print("\nCREATE DIRECTORY:")
    print("  src/managers/")

    print("\nMOVE FILES:")

    for source, destination in moves:
        print(
            f"  {source.relative_to(ROOT)}"
            f" -> {destination.relative_to(ROOT)}"
        )

    print("\nUPDATE IMPORTS:")
    for old_import, new_import in IMPORT_REPLACEMENTS.items():
        print(f"  {old_import} -> {new_import}")

    print("\nOnly main.js imports will be changed.")


def apply_plan(moves, original_main, updated_main):
    MANAGERS.mkdir(parents=True, exist_ok=True)

    moved = []
    main_backup = MAIN.with_name("main.js.batch3.bak")

    if main_backup.exists():
        raise FileExistsError(
            f"Backup already exists: {main_backup}"
        )

    try:
        # Back up main.js before modifying it.
        main_backup.write_text(
            original_main,
            encoding="utf-8"
        )

        # Move the manager files.
        for source, destination in moves:
            source.rename(destination)
            moved.append((source, destination))

        # Update main.js last.
        MAIN.write_text(
            updated_main,
            encoding="utf-8"
        )

    except Exception:
        # Restore any files already moved.
        for source, destination in reversed(moved):
            if destination.exists():
                destination.rename(source)

        if main_backup.exists():
            MAIN.write_text(
                original_main,
                encoding="utf-8"
            )

        raise

    print("\nMigration applied successfully.")
    print(f"Backup retained: {main_backup.relative_to(ROOT)}")


def main():
    parser = argparse.ArgumentParser(
        description="Organize kSim-mobile manager modules."
    )

    parser.add_argument(
        "--apply",
        action="store_true",
        help="Apply changes. Default is dry-run."
    )

    args = parser.parse_args()

    try:
        moves, original_main, updated_main = build_plan()

        display_plan(moves)

        if not args.apply:
            print("\nDRY RUN ONLY — no files changed.")
            print("Review the plan, then run with --apply.")
            return

        print("\nApplying migration...")
        apply_plan(moves, original_main, updated_main)

    except Exception as error:
        print(f"\nERROR: {error}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
