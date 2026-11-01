# dirjs          # Current directory
# dirjs -r       # Recursive
# dirjs src      # Specific directory
# dirjs -r src   # Recursive specific directory
# dirjs -r src/ui src/data

dirjs() {
    # ========================================
    # CONFIGURATION
    # ========================================

    local -a allowed_extensions=("js" "css" "html")
    local -a excluded_dirs=("mobile_dev_console" "node_modules")

    # ========================================
    # SETTINGS
    # ========================================

    local recursive=false
    local path dir
    local -a paths=()

    # ========================================
    # PARSE ARGUMENTS
    # ========================================

    for arg in "$@"; do
        if [[ "$arg" == "-r" ]]; then
            recursive=true
        else
            paths+=("$arg")
        fi
    done

    # Default to current directory
    if [[ ${#paths[@]} -eq 0 ]]; then
        paths=(".")
    fi

    # ========================================
    # BUILD FIND FILTERS
    # ========================================

    local -a extension_filters=()
    local -a exclusion_filters=()

    for ext in "${allowed_extensions[@]}"; do
        extension_filters+=(-o -iname "*.$ext")
    done

    # Remove leading -o
    extension_filters=("${extension_filters[@]:1}")

    for dir in "${excluded_dirs[@]}"; do
        exclusion_filters+=(-o -name "$dir")
    done

    # Remove leading -o
    exclusion_filters=("${exclusion_filters[@]:1}")

    # ========================================
    # LIST FILES
    # ========================================

    for path in "${paths[@]}"; do

        if [[ ! -d "$path" ]]; then
            echo "ERROR: Directory not found: $path"
            continue
        fi

        echo
        echo "===== $path ====="

        if [[ "$recursive" == true ]]; then
            find "$path" \
                \( -type d \( "${exclusion_filters[@]}" \) -prune \) -o \
                \( -type f \( "${extension_filters[@]}" \) -print \)

        else
            find "$path" -maxdepth 1 -type f \
                \( "${extension_filters[@]}" \) -print
        fi
    done
}
