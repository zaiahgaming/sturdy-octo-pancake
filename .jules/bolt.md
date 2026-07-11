## 2026-07-11 - Avoid Math.hypot in hot paths
**Learning:** In HTML5 Canvas collision detection, avoid `Math.hypot` in frequent O(N*M) checks (like projectiles vs enemies) due to square root performance costs.
**Action:** Always use squared distance calculations (`dx*dx + dy*dy < radius*radius`) in hot paths.
