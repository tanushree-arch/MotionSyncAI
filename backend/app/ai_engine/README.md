# AI Engine

Future modules for the movement-analysis pipeline will live here.

Planned implementation order:
1. Camera/frame input and pose landmark extraction (MediaPipe Pose Landmarker).
2. Landmark smoothing and visibility checks.
3. Pose classification for a defined set of supported exercises.
4. Pose-specific joint-angle and alignment rules.
5. Feedback generation with confidence and safety limits.

Do not treat raw landmark coordinates alone as proof that a pose is correct. Analysis needs pose-specific rules, visibility handling, and testing across different bodies, camera angles, and lighting.
