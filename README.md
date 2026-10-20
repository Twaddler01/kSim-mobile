# kSim — Origins

A mobile-first native HTML/CSS/JavaScript simulation prototype. No Phaser dependency.

## Install into your existing project

Copy `index.html`, `main.js`, `functions.js`, `data.js`, `styles.css`, and the `ui/` directory into `~/projects/kSim-mobile/`. Keep your existing `mobile-dev-console/` folder alongside them. The supplied `index.html` expects that folder at `./mobile-dev-console/`.

Run your existing DevServer and open `/` or `/index.html`.

## Included

- DOM helper: `el()`, `append()`, `div()`, `span()`, `heading()`
- Reusable `Button()`, `Card()`, and `ProgressBar()` components
- Click-to-stir primordial soup gameplay
- Resources, discovery milestones, upgrades, basic automation
- Responsive mobile layout, autosave via localStorage, event log
- `window.kSim` debug API for inspection from the browser/dev console

## Main files

- `data.js`: initial save data and game definitions
- `functions.js`: simulation rules and resource logic
- `main.js`: app wiring and rendering
- `ui/`: reusable native DOM components
- `styles.css`: visual styling

This is a starter scaffold; new mechanics can be added without introducing a game engine.
# kSim-mobile
