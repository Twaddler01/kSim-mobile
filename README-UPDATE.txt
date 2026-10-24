kSim — Beyond Reality: Quantum Foundations update (UI-compatible revision)

Files:
- main.js
- styles.css
- src/data.js
- src/functions.js

Important:
- This revision was adapted to the supplied current UI component APIs:
  - Button(label, onClick, { variant, disabled })
  - Card(title, children, subtitle)
  - ProgressBar({ label, value, max, format(value, max) })
  - Tabs({ tabs: [{ id, label, render() }], activeId, onChange, label })
- Keep your existing src/ui folder unchanged.
- Keep your current index.html and DevTools bootstrap. Change the document title to:
  kSim — Beyond Reality | Quantum Foundations
  Also update the visible brand/stage labels in your existing HTML if those labels are currently hardcoded there. The main.js replacement renders the in-game panels, not the outer header.
- The save key is ksim-quantum-foundations-v1. It leaves ksim-origins-save-v1 untouched.
- Reset Save resets only Quantum Foundations.
- This stage intentionally contains no automation or universe travel.

Copy the four included code files into the matching locations in kSim-mobile, then reload the page.
