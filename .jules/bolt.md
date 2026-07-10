## 2024-07-10 - Avoid Math.hypot in hot collision loops
**Learning:** In a vanilla HTML5 Canvas game like this one, using `Math.hypot` inside frequent O(N*M) collision checks (e.g. `enemies` vs `projectiles`) creates a massive performance bottleneck due to the cost of calculating square roots hundreds of thousands of times per frame.
**Action:** When performing circle collision detection (checking distance between objects), always use squared distance (`dx*dx + dy*dy < radius*radius`) instead of taking the square root. Avoid `Math.hypot` in critical hot paths.
