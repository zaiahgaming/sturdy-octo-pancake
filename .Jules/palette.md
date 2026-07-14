## 2024-03-24 - Focus Indicators on Canvas Menus
**Learning:** In browser games that are heavily keyboard-driven (e.g., using WASD for movement), users often instinctually use the keyboard (like the Tab key) to navigate through HTML overlay menus (Start Screen, Game Over screen). This makes `focus-visible` states critical for accessibility and usability in what might otherwise seem like a mouse-driven UI layer.
**Action:** Always ensure that any HTML UI elements overlaid on a canvas game have clear keyboard focus indicators, even if the primary interaction is intended to be via mouse or touch.
## 2026-07-10 - Avoid direct use of hasOwnProperty
**Learning:** Direct use of `hasOwnProperty` on an object (e.g., `obj.hasOwnProperty(key)`) is a security vulnerability (prototype pollution/override). An attacker could pass a key named "hasOwnProperty" and override the method, causing a crash or unexpected behavior when it's called.
**Action:** Use `Object.prototype.hasOwnProperty.call(obj, key)` to safely check for properties.
## 2024-11-06 - [Canvas Focus UX]
**Learning:** Requiring users to click the canvas before keyboard inputs register is poor UX. Adding tabindex and programmatically focusing the canvas on start/restart improves keyboard accessibility.
**Action:** Added tabindex="0" and aria-label to the canvas, and called canvas.focus() in the start and restart button click handlers.
## 2026-07-12 - [Accessible Fullscreen Toggle]
**Learning:** Adding dynamic `aria-pressed` states and dynamic text to toggle buttons like a Fullscreen button helps screen reader users understand the button's purpose and its current state. Relying on visual changes alone makes it opaque.
**Action:** Always add dynamic text and `aria-pressed` attributes to buttons that function as toggles.
## 2024-05-24 - [Accessible Modal Descriptions]
**Learning:** When using custom dialogs with `role="dialog"`, screen readers announce the element referenced by `aria-labelledby`. However, critical context within the modal (like instructions or a final score) might not be announced automatically upon opening.
**Action:** Always pair `aria-labelledby` with `aria-describedby` on custom dialogs to point to the paragraph or container holding the descriptive text, ensuring a complete context is read out to the user.
