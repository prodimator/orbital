# Orbital

Each run randomizes the star radius from 40 to 70 world units. Stellar gravity scales with radius squared, so the largest star pulls about 3.06× as strongly as the smallest at the same distance. Planetary orbit speeds remain prescribed; star size changes the ship's gravitational environment. The scene, collision radius and surface-proximity scoring all use the generated star radius.

Scoring: total = survival seconds + flying points. Within 100 world units of a planet or star surface, earn `20 × (1 - clearance / 100)²` flying points per second, capped at 20. Clearance includes the ship's collision radius. Only the nearest surface counts. Bonus stops on impact; all scoring pauses with the game. The HUD shows both components and the live bonus rate. Best combined score uses a separate storage key from the old survival-time record.

A 2D Three.js gravity survival prototype. Run `npm install`, then `npm run dev` and open the printed localhost URL. `npm test` runs physics tests; `npm run build` produces a static site in dist.

Click Launch flight. Left/right arrows rotate; up thrusts. Momentum persists. All planets and the star attract the ship. Impact or crossing the circular flight perimeter ends the run. Pause uses the on-screen button; switching away pauses automatically. Fly again generates a new system. Best survival time is saved in this browser where storage is available.

Physics lives in src/physics.js: fixed 120 Hz semi-implicit Euler integration, inverse-square acceleration, prescribed circular planetary orbits, and swept relative collision checks. Units are game-scaled; gravity is tuned for play rather than astronomy. THRUST, TURN and LIMIT are the main tuning constants. Camera and scene live in src/view.js, independent of physics, ready for a future ship-following camera. Asteroids and shooting are intentionally deferred.

Desktop keyboard and WebGL required. Fonts gracefully fall back if Google Fonts is unavailable. Dependencies are bundled locally by Vite.

Gravity tuning: `GRAVITY_STRENGTH` in src/physics.js scales both star and planet attraction (currently 2× the initial prototype). Planetary orbit speeds and ship thrust are independent, so increasing attraction makes coasting harder without increasing launch velocity to compensate. A seeded play-balance test checks unattended launches end within 12 seconds and immediate thrust remains effective in at least 95 of 100 sampled launches.

## GitHub Pages

The workflow in `.github/workflows/deploy.yml` tests, builds, and deploys pushes to main. In the GitHub repository, enable Settings > Pages > Source > GitHub Actions before running it. No personal access token or custom secret is needed by the workflow.

Production assets use `/orbital/`; local development stays at `/`. If the repository is renamed or you add a custom domain, update `base` in vite.config.js. Build with `npm run build`. To inspect the production build locally, run `npx vite preview` and open `/orbital/` on the displayed host.
