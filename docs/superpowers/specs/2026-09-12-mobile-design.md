# Mobile play

Approved in conversation: Orbital becomes playable on phones in landscape. Four pieces —
an orientation gate, a zoomed follow camera, a touch input layer, and a compressed HUD.
Simulation is untouched: `physics.js`, `projectiles.js`, `asteroids.js` and `scoring.js` are
not modified, and the six existing test files serve as the regression check.

## Mobile mode

Two separate decisions, deliberately not conflated.

_Compact mode_ — the zoomed camera and the compressed HUD — is a layout decision, resolved from
`matchMedia('(pointer: coarse) and (hover: none)')` at load and re-evaluated whenever that query
changes. Viewport width is deliberately not part of the test: a tablet in landscape is wider
than many laptop windows, and gating on width would strand tablets in desktop mode. Device type
is deliberately not part of it either — iPadOS Safari reports itself as macOS, and
`navigator.userAgentData.mobile` exists only in Chromium, so both forms of user-agent sniffing
misidentify the very devices this work targets.

_Touch control visibility_ is an input decision, resolved by observation rather than prediction.
A capturing `pointerdown` listener shows the controls when `event.pointerType === 'touch'`; a
capturing `mousemove` listener hides them again. Nothing is inferred about the device, so
nothing can be inferred wrongly, and a hybrid machine gets the right interface in both of its
modes without being told which one it is in. Both transitions are idempotent class toggles.

Compact mode is deliberately _not_ driven by observed input: snapping camera zoom and HUD layout
mid-flight because a trackpad was brushed would be worse than an occasional wrong guess at load.

Both live in `src/mode.js`, which exports `resolveCompact({coarse, hoverless, override})` as a pure
function so the precedence is testable. `?touch=1` forces compact mode and the controls on for
desktop testing; `?touch=0` forces both off. Desktop behaviour is otherwise unchanged in every
respect. Keyboard listeners stay registered at all times, so a keyboard works on a tablet and
touch works on a touchscreen laptop.

## Orientation

Portrait is blocked. `matchMedia('(orientation: portrait)')` drives a full-screen rotate card
that calls the existing `pause()`, so simulation time and physics are held while the card is
up. Rotating to landscape hides the card and returns the player to the standard paused
overlay; the player resumes deliberately rather than being dropped back into flight.

The Start button additionally calls `requestLandscape()`, which requests fullscreen on the
document element and then `screen.orientation.lock('landscape')`. Both may reject or be
absent; both are wrapped so failure is silent and changes nothing. Android locks and never
shows the card again. iOS Safari implements neither API, so on iOS the rotate card is the
entire mechanism, not a fallback.

## Camera

`src/camera.js` is new and pure — no Three.js, no DOM, no module state:

    frame({shipX, shipY, width, height, zoom, hudPx, bound}) -> {halfW, halfH, cx, cy}

`halfH = 1020 / Math.min(1, width / height) / zoom`, `halfW = halfH * width / height`. The
leading `Math.min` preserves today's behaviour of widening the view when a desktop window is
taller than it is wide, and is inert in landscape.

The HUD occupies `hudPx` of screen width, so the _usable_ half-width is
`usableHalfW = halfW - offset` where `offset = hudPx * halfH / height` — half the panel width in
world units. Clamping applies to the usable area, not the whole frustum: the followed point is
clamped to `±(bound - usableHalfW)` horizontally and `±(bound - halfH)` vertically, locking to
`0` on any axis whose half-extent already meets or exceeds `bound`. The camera centre is then
`cx = focusX - offset`, `cy = focusY`.

Order matters. Clamping the frustum and subtracting the offset afterwards would discard the
offset precisely in the phone case, where `halfW` exceeds `bound` and the axis locks to zero.
Clamping the usable area instead keeps the panel over empty space outside the perimeter while
the playable region stays framed: at 844x390 with a 116px panel the world shifts right by half
the panel width (58px), and with the ship against the perimeter at `x = 900` the frustum's right
edge lands exactly on `bound`.

`bound` is `LIMIT + 60`. `zoom` is `2.2` in compact mode and `1` otherwise, where the function
reproduces today's framing in [view.js](../../../src/view.js). At 2.2 on a 844x390 viewport the
ship renders about 11px, `halfW` is 1002 against a bound of 960, so horizontal panning does not
engage on a phone and the perimeter ring stays framed on both sides; only vertical follow is
active. Narrower aspects such as a 4:3 tablet pan on both axes and the clamp handles it.

`view.js` keeps a symmetric frustum and moves `camera.position`. `draw()` gains an `elapsed`
argument and lerps the camera toward its target by `1 - Math.exp(-elapsed / 0.12)` so smoothing
does not vary with frame rate. `resize()` and `draw()` both route through `frame()`; the current
`extent = 1020/Math.min(1,aspect)` expression moves into it.

## Touch controls

`src/touch.js` wires a `<div id="touch">` overlay carrying `touch-action: none`. The overlay is
built once at startup and held at `display: none` until a touch is observed, so it is inert on
desktop yet costs no construction latency on first contact. Pointer events are used throughout,
with one tracked `pointerId` per control so two thumbs work simultaneously. Buttons act on
`pointerdown`, never on a synthesized click, because click latency is felt on the fire button.

Left zone: a floating heading stick whose origin is wherever the thumb lands. `stickVector()`
converts pointer position to a direction and a deflection clamped to `[0, 1]`; deflection under
`0.25` is treated as centred and produces no steering.

Right zone: THRUST and FIRE, stacked for one thumb, both hold-to-activate, setting `input.up`
and `input.shoot`. `input.up` doubles as liftoff exactly as the keyboard does.

Steering resolves in the frame loop rather than in the event handler, because it needs the
current `ship.angle`:

    steerToward(current, target, deadzone) -> {left, right}

The difference is wrapped into `±PI`; a difference above `deadzone` sets `left`, below
`-deadzone` sets `right`, otherwise neither. That sign convention matches
`p.angle += (left - right) * TURN * dt` in `physics.js`, so the ship turns at its own rate
toward the aimed heading and snap-aiming remains impossible. Both helpers are exported for
direct unit testing.

Held inputs clear whenever the run pauses, ends, or the rotate card appears, reusing the
existing `clear()` in `main.js`.

## Layout

The viewport meta gains `viewport-fit=cover, user-scalable=no`. Layout uses `100dvh` and
`env(safe-area-inset-*)` so the notch and home indicator do not overlap controls. CSS sets
`-webkit-user-select: none` and `-webkit-touch-callout: none` to suppress long-press selection
and double-tap zoom.

In compact mode the telemetry aside compresses to a top-left block carrying total score, the
close-pass bonus rate, the laser heat meter and the flight status line. Flight time, personal
best, velocity and gravity are removed from flight; the end-of-run card already reports score
breakdown and flight time, and gains personal best. The header reduces to the brand mark and
the pause button, and the bottom-right system label is hidden.

The footer keyboard legend follows the controls rather than compact mode — it is hidden once a
touch is observed and restored on mouse movement, so a touchscreen laptop never shows a legend
for keys the player is not using. For the same reason the launch note reads "TAP THRUST TO LIFT
OFF" while touch controls are visible and names the up arrow otherwise.

## Testing

`test/camera.test.js` covers clamping at each boundary, the locked-axis case where the half
extent exceeds the bound, the HUD offset surviving a locked axis, the ship-at-perimeter case
where `cx + halfW` equals `bound`, zoom scaling, and that `zoom: 1` with `hudPx: 0`
reproduces the current desktop framing in both landscape and portrait window shapes.

`test/mode.test.js` covers `resolveCompact` precedence: both media conditions true engages it,
either one false does not, and an explicit `override` of `true` or `false` wins over both.

`test/touch.test.js` covers `steerToward` across the `±PI` wrap — a target of `+3.0` against a
current of `-3.0` must turn right, not left — the deadzone, exact alignment, and `stickVector`
deflection clamping beyond the stick radius.

Pointer wiring, the orientation gate and fullscreen are not unit testable here and are verified
by hand: `npm run dev -- --host` against a real phone in both orientations, `?touch=1` on
desktop, and a touchscreen laptop alternating between finger and mouse to confirm the controls
and keyboard legend swap without the camera or HUD shifting. `npm run build` must stay clean.
