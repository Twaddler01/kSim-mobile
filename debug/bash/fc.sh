
fc() {
    # ========================================
    # CONFIGURATION
    # ========================================

    local -a allowed_extensions=("js" "css" "html")
    local -a excluded_dirs=(".git" "mobile_dev_console")

    # ========================================
    # SETTINGS / VARIABLES
    # ========================================

    local save_log=false
    local copy_clip=false
    local filename file search_path lower_file dir
    local failed=0
    local log_file="$HOME/fc-output.txt"
    local temp_file

    local -a files=()
    local -a results=()
    local -a matches=()
    local -a candidates=()

    # ========================================
    # HELPER: CHECK FILE FILTERS
    # ========================================

    is_allowed_file() {
        local path="${1,,}"
        local ext="${path##*.}"
        local allowed=false
        local excluded=false
        local folder

        # Check extension
        for folder in "${allowed_extensions[@]}"; do
            if [[ "$ext" == "$folder" ]]; then
                allowed=true
                break
            fi
        done

        [[ "$allowed" == false ]] && return 1

        # Check excluded directories
        for folder in "${excluded_dirs[@]}"; do
            case "/$path/" in
                *"/$folder/"*)
                    excluded=true
                    break
                    ;;
            esac
        done

        [[ "$excluded" == false ]]
    }

    # ========================================
    # PARSE OPTIONS
    # ========================================

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
  -log     Save output to ~/fc-output.txt
  -clip    Copy output to Android clipboard

File filters:
  .js, .css, .html only
  Excludes .git/
  Excludes mobile_dev_console/

Features:
  - Direct path lookup
  - Recursive, case-insensitive search
  - Extension-independent fallback
  - Returns all matching files
  - Per-file results report

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

    # ========================================
    # CLIPBOARD REQUIREMENTS
    # ========================================

    if [[ "$copy_clip" == true ]] &&
        ! command -v termux-clipboard-set &>/dev/null; then

        echo
        echo "ERROR: Clipboard support is not installed."
        echo
        echo "The -clip option requires:"
        echo "  1. Termux:API Android app"
        echo "  2. termux-api package in Termux"
        echo
        echo "Install the package with:"
        echo "  pkg install termux-api"
        echo
        echo "Then try again."
        return 1
    fi

    temp_file=$(mktemp) || return 1

    # ========================================
    # SEARCH FILES
    # ========================================

    {
        for filename in "${files[@]}"; do
            matches=()
            candidates=()

            # Direct path first
            if [[ -f "$filename" ]]; then
                candidates+=("$filename")

            elif [[ "$filename" == */* ]]; then
                # Exact relative path, case-insensitive
                search_path="${filename#./}"

                while IFS= read -r file; do
                    candidates+=("$file")
                done < <(
                    find . \
                        \( -type d \( \
                            -name ".git" -o \
                            -name "mobile_dev_console" \
                        \) -prune \) -o \
                        -type f -iwholename "./$search_path" -print \
                        2>/dev/null
                )

            else
                # Exact filename search
                while IFS= read -r file; do
                    candidates+=("$file")
                done < <(
                    find . \
                        \( -type d \( \
                            -name ".git" -o \
                            -name "mobile_dev_console" \
                        \) -prune \) -o \
                        -type f -iname "$filename" -print \
                        2>/dev/null
                )
            fi

            # Apply filters
            for file in "${candidates[@]}"; do
                if is_allowed_file "$file"; then
                    matches+=("$file")
                fi
            done

            # Extension-independent fallback
            if [[ ${#matches[@]} -eq 0 &&
                  ! -f "$filename" &&
                  "$filename" != */* ]]; then

                candidates=()

                while IFS= read -r file; do
                    candidates+=("$file")
                done < <(
                    find . \
                        \( -type d \( \
                            -name ".git" -o \
                            -name "mobile_dev_console" \
                        \) -prune \) -o \
                        -type f -iname "$filename.*" -print \
                        2>/dev/null
                )

                for file in "${candidates[@]}"; do
                    if is_allowed_file "$file"; then
                        matches+=("$file")
                    fi
                done
            fi

            # Not found
            if [[ ${#matches[@]} -eq 0 ]]; then
                echo
                echo "===== cat $filename"
                echo
                echo "[ No matching files found ]"

                results+=("NOT FOUND: $filename")
                failed=1
                continue
            fi

            # Output matching files
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

    # ========================================
    # DISPLAY OUTPUT
    # ========================================

    cat "$temp_file"

    # ========================================
    # SAVE LOG
    # ========================================

    if [[ "$save_log" == true ]]; then
        if cp "$temp_file" "$log_file"; then
            echo "Saved: $log_file" >&2
        else
            echo "ERROR: Could not save log." >&2
            failed=1
        fi
    fi

    # ========================================
    # CLIPBOARD
    # ========================================

    if [[ "$copy_clip" == true ]]; then
        if termux-clipboard-set < "$temp_file"; then
            echo "Copied to Android clipboard." >&2
        else
            echo "ERROR: Clipboard operation failed." >&2
            echo "Check that the Termux:API Android app is installed." >&2
            failed=1
        fi
    fi

    rm -f "$temp_file"

    # ========================================
    # RESULTS
    # ========================================

    echo
    echo "========== RESULTS =========="

    for file in "${results[@]}"; do
        echo "$file"
    done

    echo "============================="

    return "$failed"
}
