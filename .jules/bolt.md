## 2024-05-24 - Math.hypot Optimization
**Learning:** Math.hypot is expensive when called in hot paths like O(N*M) game loop collision checks, due to square root and multiple argument handling.
**Action:** Replace Math.hypot with squared distance calculation (`dx*dx + dy*dy < radius*radius`) in critical collision paths for improved performance.
