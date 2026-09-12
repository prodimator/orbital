# Orbital survival

Approved in conversation: a top-down Three.js survival game with 2–4 randomized planets on circular prescribed orbits, inverse-square gravity acting on a freely moving ship, left/right rotation and up thrust. Launch above a random planet with inherited velocity. Collisions or leaving the outer boundary end the run. Score is simulation survival time; best persists locally. Start/restart and pause controls accompany a full-system orthographic camera. Camera remains independent for future ship tracking. Asteroids and weapons are outside this iteration.

Simulation uses a 120 Hz fixed step and swept relative-motion collisions. Rendering reads simulation state. Blur pauses play and clears held keys. Random planet orbits are separated. Automated tests cover force, inertia, launch clearance, impacts and timestep consistency. Build and browser smoke verification complete the prototype.
