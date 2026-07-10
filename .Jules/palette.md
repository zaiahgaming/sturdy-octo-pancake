## 2026-07-10 - Testing Vanilla JS in Jest
**Learning:** Testing a monolithic Vanilla JS file that doesn't use standard ES Modules or CommonJS exports requires simulating the browser environment carefully.
**Action:** Mocked DOM objects (`window`, `document`, Canvas `getContext`) and evaluated the game script via `eval` to extract and test the `Player` class in `game.test.js`.
