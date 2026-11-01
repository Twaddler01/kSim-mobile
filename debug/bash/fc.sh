fc() {
    local save_log=false
    local copy_clip=false
    local filename file
    local failed=0
    local log_file="$HOME/fc-output.txt"
    local temp_file
    local -a files=()
    local -a results=()
    local -a matches=()

    # Parse options
    for arg in "$@"; do
        case "$arg" in
            -log)  save_log=true ;;
            -clip) copy_clip=true ;;
            *)     files+=("$arg") ;;
        esac
    done

    if [[ ${#files[@]} -eq 0 ]]; then
        cat <<'EOF'
Usage: fc [options] filename [...]

Options:
  -log     Save combined output to ~/fc-output.txt
  -clip    Copy combined output to Android clipboard

Features:
  - Direct path lookup
  - Recursive, case-insensitive filename search
  - Extension-independent fallback
  - Returns all matching files
  - Reports success/failure for each file

Examples:
  fc main.js
  fc SynthesisEngine
  fc inventory styles badge
  fc -log main.js data.js
  fc -clip inventory
  fc -clip -log inventory styles badge
EOF
        return 0
    fi

    temp_file=$(mktemp) || return 1

    {
        for filename in "${files[@]}"; do
            matches=()

            # Direct path first
            if [[ -f "$filename" ]]; then
                matches+=("$filename")

            elif [[ "$filename" == */* ]]; then
                # Exact path, case-insensitive
                while IFS= read -r file; do
                    matches+=("$file")
                done < <(find . -type f -iwholename "./$filename" -print 2>/dev/null)

            else
                # Exact filename matches
                while IFS= read -r file; do
                    matches+=("$file")
                done < <(find . -type f -iname "$filename" -print 2>/dev/null)

                # Filename without extension
                if [[ ${#matches[@]} -eq 0 ]]; then
                    while IFS= read -r file; do
                        matches+=("$file")
                    done < <(find . -type f -iname "$filename.*" -print 2>/dev/null)
                fi
            fi

            if [[ ${#matches[@]} -eq 0 ]]; then
                echo
                echo "===== cat $filename"
                echo
                echo "[ Not found ]"
                results+=("NOT FOUND: $filename")
                failed=1
                continue
            fi

            for file in "${matches[@]}"; do
                echo
                echo "===== cat $file"
                echo

                if cat "$file"; then
                    results+=("OK: $file")
                else
                    results+=("ERROR: $file")
                    failed=1
                fi

                echo
            done
        done
    } > "$temp_file"

    # Display combined contents
    cat "$temp_file"

    # Save log
    if [[ "$save_log" == true ]]; then
        if cp "$temp_file" "$log_file"; then
            echo "Saved: $log_file" >&2
        else
            echo "ERROR: Could not save log." >&2
            failed=1
        fi
    fi

    # Clipboard
    if [[ "$copy_clip" == true ]]; then
        if command -v termux-clipboard-set &>/dev/null &&
            termux-clipboard-set < "$temp_file"; then
            echo "Copied to Android clipboard." >&2
        else
            echo "ERROR: Clipboard copy failed." >&2
            failed=1
        fi
    fi

    rm -f "$temp_file"

    # Final per-file report (not included in clipboard or log)
    echo
    echo "========== RESULTS =========="

    for result in "${results[@]}"; do
        echo "$result"
    done

    echo "============================="

    return "$failed"
}