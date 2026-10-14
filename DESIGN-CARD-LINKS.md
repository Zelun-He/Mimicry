# Card Feel & Link Clarity — Interface Contract

This slice adapts the approved visual card-state specification, with the
existing chain engine as the **only authority** for move legality.

## Category and number placement
- Top-left: school symbol (◆ Fang, ⬡ Shell, ✦ Bloom, ◇ Venom, ♛ Hunger).
- Top-right: rank on a highly contrasted plaque. Hunger specials use ★.
- Card body: same 36 local art illustrations and effect text as Forest Edge.
- Link hint strip: a short symbol + reason, not color alone.
- Card controls: an explicit Play/Stack button and a separate ↻ Discard button.

## The legal link decision
Given previous card A and candidate B, first defer to
`canQueueCard(deck,id)`. Among valid links, show the most informative match:

1. **Stack** if B is a matching summon next to A and that formation has room
   for one of its three recruit cards; consumes no additional tactical slot.
2. **Wild** if either card's school is Hunger.
3. **Sequence** if B's number is A's number + 1.
4. **Rank** if B's number equals A's number.
5. **Suit** if their schools match.
6. **Mismatch** if there is no legal connection.
7. **Chain full** if playing B would occupy a sixth tactical slot.

No different damage multipliers are assigned to different link types at this
stage. The displayed multiplier is read from `analyzeChain`. If a stacked
recruit is already 3 cards deep, the next copy starts a new tactical slot
instead of silently extending the same formation.

## Motion by school
- Fang: one fast diagonal slash on hover/focus.
- Shell: hexagonal shield reflection that settles after one short pulse.
- Bloom: soft rising pollen dots.
- Venom: drifting toxic bubbles.
- Hunger: a slow, engraved golden sigil.
- Queued cards: school-tinted snap/flash and links between tactical slots.
- Stacks: x2 and x3 badges for Mob and Horde.

Motion is contained to cards and small link surfaces: no screen-wide flashes,
sounds, network requests, or long-running JavaScript animation loops.
`prefers-reduced-motion:reduce` turns off CSS animation/transition and
preserves the exact same link information as labels.

## Input and accessibility
- Desktop pointer hover highlights the card and updates the next-link preview
  bar without triggering a game action.
- Keyboard Tab reaches each card's focusable group, Play and Discard controls.
  Focus and Enter/Space on the **card face** show the inspector only. The
  native Play control performs the queue action.
- Touch down on the card face previews the link. Tap **Play** to commit.
  Disabled cards remain readable, with an explanation available on inspection.
- Selected/queued cards leave the hand, display their link reason in the
  queue rail and have an accessible Remove action.
- Previewing never mutates deck, queues, RNG, shop state, or browser save.

## Verification
Tests cover suit/rank/sequence/wild precedence, 1–3-card recruit stacks,
remaining capacity at the five-slot limit, unavailable and mismatched cards,
queue badges per tactical slot, deterministic bonus calculation, and all-pairs
consistency with the engine. Browser bootstrap tests cover preview and actual
queue click separately.

### Deferred gameplay questions
There is no numeric reward distinction between link types yet. Evaluate actual
playtesting data before adding e.g. sequence-specific momentum or matching-rank
precision bonuses; changing them now would invalidate current balancing.
