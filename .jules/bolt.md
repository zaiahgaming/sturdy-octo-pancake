## 2024-05-18 - Math.hypot Performance in O(N*M) Paths
**Learning:** In HTML5 Canvas collision detection, avoid `Math.hypot` in frequent O(N*M) checks (like projectiles vs enemies) due to square root performance costs. It introduces measurable frame drops in busy scenes.
**Action:** Always use squared distance calculations (`dx*dx + dy*dy < radius*radius`) in hot paths for logic checks. If true distance is required for vector normalization, prefer `Math.sqrt(dx*dx + dy*dy)` over `Math.hypot` as it evaluates slightly faster in most JS engines.

## 2024-07-13 - Avoid Trigonometric Functions in Hot Paths
**Learning:** In hot paths like 60fps update loops running for multiple entities, calculating directional movement with trigonometric functions (`Math.atan2`, `Math.cos`, `Math.sin`) incurs significant overhead.
**Action:** Prefer basic vector normalization (`dx / dist`, `dy / dist` where `dist = Math.sqrt(dx*dx + dy*dy)`) over trigonometric functions to improve performance.
