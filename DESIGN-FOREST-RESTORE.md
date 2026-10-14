# Forest Edge Battle Restoration — Design Contract

## Why
The early prototype had the right visual and cognitive hierarchy. The later
card/dashboard interface buried the characters, enlarged empty boxes, and
squeezed every card into unreadable slivers. The fix is not a fifth CSS skin:
return to the working prototype's **own markup, stylesheet and sprite sheets**
and integrate our newer tactical systems into that layout.

## What is real and reused
- Original 960×420 pixel-art forest canvas with original `assets/forest.png`.
- Big, animated ragged Mimic from `assets/mimic.png` (2×2 sprite sheet).
- Distinct adventurers from `assets/visitors.png` (5-wide atlas).
- Original chapter header and five-node route progression.
- Original dark, translucent combat identity/health/intent plates.
- Original parchment combo builder, five low-profile slots, projected
  effect categories and large discard/attack controls.
- Original full-width, eight-card hand (with added illustrations, number/suit
  crests and our card kinds).

## Adaptations for Siege
- One main foe remains large; other adventurers share the background as
  small secondary visitors. A short target row lets the player choose any
  living foe or Auto without losing the original composition.
- Permanent ally sprites and disposable summons are visible in the forest.
  A compact roster line tells the player which lane their defenders occupy.
  Full unit movement and the creature codex live in an optional panel.
- The original mimicking attack sprite fires **once per queued card** in
  actual queue order; the active chain slot flashes and its name is written
  into the battle caption. Damage/death/attack events from the simulation
  trigger additional sprite reactions.
- Final HP and damage numbers are computed from the actual engine's
  resulting state, never invented per-card numbers. The table labels
  preview stats as base power/effects, not exact final damage.
- Queued Mob/Horde cards occupy one tactical slot, showing ×2/×3.
  Defenders, Spider/Slime/Mimicling mechanics and full six-offer shop remain.
- A real click or native keyboard activation queues each card. Discard uses
  a deliberate toggle; the prominent Play Chain/End Turn action remains.
- Resource strip reports Gold, Hunger, Bones and owned traits.
- Save key `mimicry-siege-v8` and underlying game data do not change.

## Navigation
- `/` (index.html) and `/siege.html`: identical upgraded First Siege.
- `/classic.html`: preserved original stand-alone prototype using
  `main.js` and `engine.js` with its own `mimics-hand-forest-v1` save.

## Performance and accessibility
- Reuse local pixel assets rather than re-requesting or inventing art.
- A single 30 FPS requestAnimationFrame draw loop; no accumulating animation
  timers. Requests are skipped when document is hidden.
- Reduced-motion still shows every effect/result without lingering animation.
- Exact tab/action semantics for native buttons; health and link reasons
  remain text-based, not color-only.
- Hand scrolls horizontally at narrower screens; avoid squeezing all eight
  into less than 110px each.
- Keep optional advanced mechanics below the action surface.
- Animated outcomes and shops appear in a readable fixed modal; modal
  does not block the normal hand during a turn.

## Manual acceptance
Open both / and /siege.html. Verify the Mimic/visitor art is the original
forest composition; queue, undo, discard, focus a second foe, change summon
lane, attack through 5 chain slots, save/reload, win raid, buy cards and
choose reinforcements; check 375px and 1440px. Automated engine and smoke
tests supplement but do not replace browser visual QA.
