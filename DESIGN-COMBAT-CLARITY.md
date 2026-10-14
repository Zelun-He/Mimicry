# First Siege — Hand-First Combat Readability

## Problem found in the supplied screenshot
The outer `commands` container inherited a deprecated
`display:grid;grid-template-columns:repeat(4,1fr)` rule while its new
children already owned their own layout. This made the inner eight-card
hand 25% of the available width and visually collapsed the cards into
overlapping slivers. Empty queued-card placeholders were excessively tall.

## Desired hierarchy
At desktop width the player sees, in order:

1. Small raid/Hunger/health/resource status line.
2. Forest background with three legible, horizontal defender-vs-invader
   lanes. Clickable invaders focus attacks.
3. Compact King Mimic strip for Gnaw/Devour.
4. Small optional first-turn tutorial.
5. One-line targeting and summon lane controls.
6. Five **short** queued combo slots, always visibly distinct.
7. **One eight-card row**, with readable rank, symbol, art, name, and
   short effect. The hovered card explains its exact link in a thin strip.
8. Bottom controls: **Discard** (explicit toggle) and **Attack** (resolve).

Unlike the previous version, the large hand receives the full width
of the screen. At widths below 1200px it is a scrollable horizontal
rail, never an eight-column table of 30px cards.

## Interaction contract
- Clicking a legal card immediately queues it; Enter/Space on a focused
  card does exactly the same.
- Clicking a queued card undoes its last physical card.
- Discard is a separate toggle: while active, clicking a card redraws
  instead of queueing. After a successful redraw the mode turns off.
- Clicking an enemy focuses it and updates the existing target selection.
- Illegal cards remain readable, but clicks never mutate the chain.
- Hover/focus and touch pointer feedback preview the exact existing
  school, matching-number, ascending-number, or Hunger wild link.
- The game still has up to five tactical slots; duplicates stack up to
  three cards per recruit formation as before.
- All current actions, saves and original pixel assets are preserved.

## Constraints
- No gameplay, RNG or save changes.
- Avoid nonfunctional decoration or giant panels above the hand.
- Only the important part of an effect is printed on tiny card faces;
  the full rule is in the button's accessible name and preview bar.
- All statuses use text/symbols, not color alone.
- Motion is limited and optional under reduced-motion settings.

## QA checklist
- Desktop ~1440px: eight cards should be visible without overlap.
- Mid-size ~1000px: horizontal hand scroll, no crushed cards.
- Mobile 375px: hand scrolls, Attack and Discard remain visible, selected
  enemy accessible, chain cards not taller than the hand.
- Clicking a hand card, undoing, toggling Discard and attacking should
  all remain usable with a keyboard and pointer.
- Restore saved runs midbattle and after a reward shop.
- Verify first run, Swarm/Mob stack, Hunger, Gnaw, Devour, shop and
  save integrity remain unchanged.

Further manual browser screenshot/playtesting is still advisable before
release to ensure the scaling matches the target devices.
