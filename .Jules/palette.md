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
## 2024-11-20 - Adding aria-describedby for Dialogs
**Learning:** For accessibility in custom dialogs (e.g., `#game-over`, `#start-screen`), pairing `aria-labelledby` with `aria-describedby` ensures screen readers announce critical internal context (like instructions or scores) upon opening.
**Action:** Always map the ID of a descriptive `<p>` or `<div>` to a dialog's `aria-describedby` attribute to improve screen reader context.
## 2024-11-20 - Respecting prefers-reduced-motion
**Learning:** Animations like screen shakes, pulsing objects, and scrolling backgrounds can trigger nausea or discomfort for users with vestibular disorders. It is crucial to respect the user's OS-level motion preferences using the `prefers-reduced-motion` media query in CSS and `window.matchMedia` in JavaScript.
**Action:** Always check for `window.matchMedia('(prefers-reduced-motion: reduce)').matches` before executing non-essential decorative animations or screen shakes, and provide a static alternative or disable the effect when true.
## 2024-11-20 - Powerup Announcement Accessibility
**Learning:** For frequently updating UI elements like countdown timers, using `aria-live="polite"` directly on the container causes screen reader spam. It is better to hide the frequently updating element with `aria-hidden="true"` and use a dedicated, visually hidden `.sr-only` region to announce only meaningful state changes (e.g., when a timer starts or depletes).
**Action:** When using a visually hidden `aria-live` region for accessibility announcements, clear its `textContent` after a brief delay (e.g., using `setTimeout`) to ensure that consecutive identical messages are correctly re-announced by screen readers.
