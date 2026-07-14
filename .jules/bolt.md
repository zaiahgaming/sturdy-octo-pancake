## 2024-05-18 - Math.hypot Performance in O(N*M) Paths
**Learning:** In HTML5 Canvas collision detection, avoid `Math.hypot` in frequent O(N*M) checks (like projectiles vs enemies) due to square root performance costs. It introduces measurable frame drops in busy scenes.
**Action:** Always use squared distance calculations (`dx*dx + dy*dy < radius*radius`) in hot paths for logic checks. If true distance is required for vector normalization, prefer `Math.sqrt(dx*dx + dy*dy)` over `Math.hypot` as it evaluates slightly faster in most JS engines.
## 2024-03-20 - Vector Normalization in Canvas Game Loop
**Learning:** Inside 60fps update loops running for multiple entities (O(N) operations), trigonometric functions like Math.atan2, Math.cos, and Math.sin are significantly slower (~10x overhead) than basic vector normalization (dist = Math.sqrt(dx*dx + dy*dy)).
**Action:** When calculating directional velocity towards a target in hot paths, prioritize calculating the normal vector directly instead of relying on angles and trigonometry.
