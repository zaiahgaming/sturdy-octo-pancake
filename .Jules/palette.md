## 2024-03-24 - Focus Indicators on Canvas Menus
**Learning:** In browser games that are heavily keyboard-driven (e.g., using WASD for movement), users often instinctually use the keyboard (like the Tab key) to navigate through HTML overlay menus (Start Screen, Game Over screen). This makes `focus-visible` states critical for accessibility and usability in what might otherwise seem like a mouse-driven UI layer.
**Action:** Always ensure that any HTML UI elements overlaid on a canvas game have clear keyboard focus indicators, even if the primary interaction is intended to be via mouse or touch.
## 2026-07-10 - Security fix: Object property overriding vulnerability
**Learning:** Directly calling `hasOwnProperty` on objects can be dangerous if the object might have a property named `hasOwnProperty` or its prototype has been polluted.
**Action:** Use `Object.prototype.hasOwnProperty.call(obj, prop)` instead of `obj.hasOwnProperty(prop)` for safer property checking.
