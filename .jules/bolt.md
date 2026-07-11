## 2026-07-11 - Performance Optimization for Canvas Game Loop
**Learning:** `Math.hypot` is computationally expensive because it performs square root calculations. In a game loop executing many O(N*M) checks (such as projectiles vs enemies), computing this on every frame impacts CPU time negatively.
**Action:** Replace `Math.hypot` distance computations with squared distance (`dx * dx + dy * dy`) and compare against the sum of squared radii to bypass square root operations completely.
