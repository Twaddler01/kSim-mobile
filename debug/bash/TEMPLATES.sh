
# === kSim-mobile ===
cd ~/projects/kSim-mobile
git add .
git commit -m "update"
git push origin main

# === mobile-ui-framework ===
cd /data/data/com.termux/files/home/storage/shared/Documents/main-project/mobile-ui-framework
git add .
git commit -m "debug tests"
git push origin main

# === mobile-dev-console ===
cd /data/data/com.termux/files/home/storage/shared/Documents/main-project/mobile-dev-console
git add .
git commit -m "v1.0.2 update 000"
git push origin main

# COPY: rsync -av \
mkdir -p releases/v1.0.1
rsync -avn \
  --exclude='/.git/' \
  --exclude='/releases/' \
  --exclude='/node_modules/' \
  --exclude='/gitignored/' \
  --exclude='/LICENSE' \
  --exclude='/DevServer/' \
  --exclude='/_old/' \
  --exclude='/.gitignore' \
  --exclude='/code-dump.txt' \
  ./ releases/v1.0.1/
cd /data/data/com.termux/files/home/storage/shared/Documents/main-project/mobile-dev-console/releases/v1.0.1



# === acode-code-dump ===
cd ~/projects/acode-code-dump
git add .
git commit -m "update"
git push origin main

# BUILD
cd ~/projects/acode-code-dump
npm run build
cp plugin.zip ~/storage/shared/Documents/acode-code-dump/plugin.zip

# DEV 
cd ~/projects/acode-code-dump
npm run dev




# === devServer ===
cd /data/data/com.termux/files/home/storage/shared/Documents/main-project/mobile-dev-console/DevServer
node startServer.js








directory: /data/data/com.termux/files/home/storage/shared/Documents/main-project
start_page: /mobile-dev-console/index.html

directory: /data/data/com.termux/files/home/projects/kSim-mobile
start_page: index.html



git tag -f v1.0.1 944c10f
git push --force origin refs/tags/v1.0.1


/data/data/com.termux/files/home/storage/shared/Documents/temp


# === TERMUX ===

grep -rnE "NEW SYSTEM AVAILABLE: Fabricator" --include="*.js" .

multiple...

grep -rnE "effects.js" --include="*.js" .
grep -rnE "toast" --include="*.css" .

craftRecipe() and applyEffects() a

# MORE:
# Include line numbers
grep -n "function" main.js
# Case-insensitive
grep -in "function" main.js
# Search recursively through JS files
grep -rn -C 6 -E "craftRecipe|applyEffects" .
grep -rn -C 1 \
    --color=always \
    --group-separator="----------" \
    -E "synthesis|inventory" . \
    --include="*.css"

# CUSTOM:

fc src/ui/Badge.js src/ui/CollapsiblePanel.js src/ui/SynthesisPanel.js styles.css

fc -clip src/ui/Badge.js src/ui/CollapsiblePanel.js src/ui/SynthesisPanel.js styles.css

fc -log src/ui/Badge.js src/ui/CollapsiblePanel.js src/ui/SynthesisPanel.js styles.css

fc -clip -log "styles" "badge"

fc SynthesisEngine.js src/triggers/effects.js -clip


fc -clip data.js functions.js EventProcessor.js SaveManager.js


# TEMP RUNS

grep -RIn 'panel' \
  --include="*.css" \
  --exclude-dir=node_modules \
  --exclude-dir=mobile-dev-console \
  .






grep -rn "svgHelpers" . --exclude-dir=.git --exclude-dir=node_modules --exclude-dir=mobile-dev-console --exclude-dir=ideas --exclude-dir=debug




git mv src/ui/panels/GatheringField.js src/ui/panels/FieldWorkPanel.js

grep -IlRZ \
  --exclude-dir=.git \
  --exclude-dir=node_modules \
  --exclude-dir=mobile-dev-console \
  --exclude-dir=ideas \
  --exclude-dir=debug \
  "GatheringField" . |
xargs -0 -r sed -i 's/GatheringField/FieldWorkPanel/g'




fc -clip FieldCanvas.js FieldScene.js FieldWorkPanel.js
