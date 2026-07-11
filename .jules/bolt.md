## 2024-05-24 - Optimize Collision Detection Performance
**Learning:** In HTML5 Canvas collision detection, avoid `Math.hypot` in frequent O(N*M) checks (like projectiles vs enemies) due to square root performance costs.
**Action:** Replaced `Math.hypot` with squared distance calculations (`dx*dx + dy*dy < radius*radius`) in hot paths inside `game.js`.