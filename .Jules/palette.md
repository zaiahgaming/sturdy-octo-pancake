## 2024-03-24 - Focus Indicators on Canvas Menus
**Learning:** In browser games that are heavily keyboard-driven (e.g., using WASD for movement), users often instinctually use the keyboard (like the Tab key) to navigate through HTML overlay menus (Start Screen, Game Over screen). This makes `focus-visible` states critical for accessibility and usability in what might otherwise seem like a mouse-driven UI layer.
**Action:** Always ensure that any HTML UI elements overlaid on a canvas game have clear keyboard focus indicators, even if the primary interaction is intended to be via mouse or touch.

## 2026-07-10 - Launcher and Multi-Game Support
**Learning:** Expanding a single canvas game into a multi-game launcher involves careful file management, ensuring all individual games maintain their UI layers and interactions without interfering with each other or the shared launcher interface. Creating consistent aesthetic elements across multiple interconnected HTML pages is essential.
**Action:** Always verify UI functionality across all interconnected game pages when implementing a main launcher, to confirm "Back to Menu" buttons work and no style regressions occurred.
