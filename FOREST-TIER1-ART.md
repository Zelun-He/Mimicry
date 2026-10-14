# Tier I Forest Edge — Art & First-Run Design

## Core promise
A visually inviting, slightly unsettling pixel forest draws players toward
an impossible treasure chest. The first run should teach **play one card**,
**link compatible cards**, **stack duplicate recruits**, **choose a lane**,
and **make a killing Gnaw** without replacing player agency with modal steps.

## The forest is one tier, not five separate biomes

| Raid | Forest scene | Story beat | Visual motif |
|---|---|---|---|
| 1: Curious Villagers | Sunbreak Clearing | A peaceful trail conceals the chest | Warm sunlight, signpost, soft moss |
| 2: Forest Scouts | Fernway Trail | Adventurers are tracking the intruder | Deep emerald trees, wooden crossing |
| 3: Militia Patrol | Briar Hollow | Organized resistance pushes inward | Thorns, copper mushrooms, rust |
| 4: Treasure Hunters | Wispwood Grove | Greed and magic meet | Blue twilight and firefly glints |
| 5: The Watchman | The Old Watchgate | The forest's last stand | Old stone arch, torchlight, cold night |

All five scene assets are original editable SVGs built on the same 1152x420
pixel grid. The browser uses a single CSS background at a time (no spritesheet,
no third-party image downloads). Atmosphere uses color progression, path
details, foreground tree framing and ground objects, while dark overlays
protect gameplay legibility and contrast.

## Card system

- Five consistent schools: Fang (garnet), Shell (steel blue), Bloom (moss),
  Venom (violet), Hunger (old gold).
- Every card has an original vector-pixel illustration and a short flavor line.
  Symbols are deliberately reusable across a family, but the scene placement
  and textures are deterministic and distinct per card.
- A tall border encases a top school/rank bar, large illustration, family/kind
  chip, card name, mechanical description, lore, and two separate controls.
- The primary **PLAY CARD** or **STACK +1** button occupies the widest
  accessible click/tap area. The distinct ↻ discard button prevents misplays.
  The entire card face also queues the card, and keyboard Enter/Space works
  on a focused playable card.
- The linked-chain rail shows art thumbnails, slot numbers, +chain bonuses
  and formation multipliers. Duplicate recruits share one tactical slot.
- In the shop, rare and creature selections show an actual matching card
  illustration; changing a creature-family choice updates the preview.

## New-player feedback loop

1. The first view establishes the treasure-chest fantasy and scene name.
2. The non-blocking coach explains one current action at a time.
3. A successful link glows green in the chain rail, and stacked recruits show
   MOB/HORDE rather than silently occupying more slots.
4. Gnaw/Devour feedback suggests when the target can be captured.
5. The end-of-raid shop previews a new visual/card opportunity and lets the
   player plan for the next encounter.
6. The forest-route diamonds show the sense of progression toward the
   Watchgate without inventing extra missions or rewards.

## Constraints and manual acceptance checks

- Preserve all current game rules, saves, shops, and the five raid encounters.
- Keep all art local and editable, no remote fonts or rasterized screenshots.
- Check 320px, 375px, tablet and desktop: mobile hand scrolls horizontally
  while chain and battlefield remain visible.
- Check keyboard use of the card face, buttons, and tips toggle.
- Confirm readable text over each forest background.
- Verify reduced-motion operation and no infinite animation loop added.
- Browser playthrough: first-turn chain -> 3 recruit stack -> Gnaw capture ->
  Quartermaster card previews -> all five scenes -> save/reload.

This milestone focuses on **presentation and teachability**. Later development
should test retention, combo frequency, card balance and stronger enemy
counterplay separately rather than silently changing Tier 1 mechanics.
