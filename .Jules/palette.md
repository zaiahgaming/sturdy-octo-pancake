## 2024-03-24 - Focus Indicators on Canvas Menus
**Learning:** In browser games that are heavily keyboard-driven (e.g., using WASD for movement), users often instinctually use the keyboard (like the Tab key) to navigate through HTML overlay menus (Start Screen, Game Over screen). This makes `focus-visible` states critical for accessibility and usability in what might otherwise seem like a mouse-driven UI layer.
**Action:** Always ensure that any HTML UI elements overlaid on a canvas game have clear keyboard focus indicators, even if the primary interaction is intended to be via mouse or touch.

## 2024-07-10 - Adding missing tests for Powerup without external frameworks
**Learning:** Testing code in an environment without standard module exports or external frameworks (e.g. static vanilla JS with a global DOM namespace) can be accomplished effectively using Node's native `vm` module to sandbox the execution, manually mock browser APIs (`window`, `document`, Canvas contexts), and leveraging `node:test` and `node:assert` for assertions.
**Action:** Implemented tests for `Powerup` in `test.js` using `node:test`, successfully isolating the class while fulfilling the constraint of no external build systems or frameworks.
