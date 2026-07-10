## 2024-03-24 - Focus Indicators on Canvas Menus
**Learning:** In browser games that are heavily keyboard-driven (e.g., using WASD for movement), users often instinctually use the keyboard (like the Tab key) to navigate through HTML overlay menus (Start Screen, Game Over screen). This makes `focus-visible` states critical for accessibility and usability in what might otherwise seem like a mouse-driven UI layer.
**Action:** Always ensure that any HTML UI elements overlaid on a canvas game have clear keyboard focus indicators, even if the primary interaction is intended to be via mouse or touch.
## 2024-07-10 - Adding Unit Tests with JSDOM
**Learning:** Testing a monolithic game.js file requiring a browser context needs JSDOM to correctly mock globals (like AudioContext, Canvas context, etc) so we can evaluate the source safely and test its classes. Using Regex to parse out classes is brittle and should be avoided.
**Action:** I set up JSDOM to wrap the execution of `game.js`, exposing `Projectile` globally, allowing for comprehensive unmocked testing of the Projectile class using mocha and chai.
