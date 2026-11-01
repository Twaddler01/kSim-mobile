
#echo "Starting UDroid..."
#bash /data/data/com.termux/files/usr/bin/udroid login jammy:xfce4
#echo "Starting VNC server..."
#vncserver :1

source ~/.bash_functions/fc.sh
# alias pushvsim='~/pushvsim.sh'
# alias pushmenu='~/pushmenu.sh'
# alias cdvsim='source ~/cdvsim.sh'
# alias pushvsim2='source ~/pushvsim2.sh'
alias cdesim='source ~/cdesim.sh'
alias pushesim='source ~/pushesim.sh'
alias c='clear'
alias cdk='cd ~/projects/kSim-mobile'

ACODE_PATH_FILE="$HOME/storage/shared/.acode-next-path"

if [ -f "$ACODE_PATH_FILE" ]; then
    IFS= read -r target < "$ACODE_PATH_FILE"
    rm -f "$ACODE_PATH_FILE"

    if [ -d "$target" ]; then
        cd -- "$target"
    fi
fi

# source "$HOME/terminal-capture/capture.sh"

alias capture='bash "$HOME/terminal-capture/run-capture.sh"'

uk() {
    local message="${*:-update}"

    cd ~/projects/kSim-mobile || {
        echo "ERROR: Could not enter project directory."
        return 1
    }

    echo
    echo "================================"
    echo "       kSim GIT UPDATE"
    echo "================================"
    echo

    # Stage all changes
    git add -A || {
        echo "ERROR: Git add failed."
        return 1
    }

    # Check for changes
    if git diff --cached --quiet; then
        echo "No changes to commit."
        echo
        git status --short --branch
        return 0
    fi

    # Show changed files
    echo "FILES UPDATED"
    echo "--------------------------------"
    git diff --cached --name-status

    echo
    echo "CHANGE SUMMARY"
    echo "--------------------------------"
    git diff --cached --stat

    # Commit
    echo
    echo "COMMITTING: $message"
    echo "--------------------------------"

    git commit -m "$message" || {
        echo "ERROR: Git commit failed."
        return 1
    }

    # Push
    echo
    echo "PUSHING TO ORIGIN/MAIN..."
    echo "--------------------------------"

    git push origin main || {
        echo "ERROR: Push failed. Commit is still saved locally."
        return 1
    }

    # Final summary
    echo
    echo "================================"
    echo "       UPDATE SUCCESSFUL"
    echo "================================"
    echo
    echo "LATEST COMMIT:"
    git log -1 --oneline

    echo
    echo "REPOSITORY STATUS:"
    git status --short --branch

    echo
    echo "================================"
}

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
