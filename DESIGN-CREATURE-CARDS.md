# Tier I creature cards — from the established sprite board

## Scope of Phase 2
The parchment-style Forest Edge battlefield is the baseline. Only the **cards
and their previews** are upgraded to carry monster identity. There is no
new rule, new deck, frame-rate loop, battle actor or save migration.

## Artwork provenance and implementation
Original art is reused from the previously created project asset
`a_high_resolution_game_asset_sheet_on_a_transparen.png`, not generated or
retrieved from stock sites. Five hero portraits were cropped from its **left
portrait column**: Goblin, Skeleton, Slime, Sporeling, King Mimic. Their name
plates, combat poses and captions were excluded.

All five are packed into `dist/siege/creature-portraits.png`, a **400×69
indexed PNG** arranged left-to-right in that exact order. It is **6.6 KB**
and loaded by card CSS only; it is never loaded by the battlefield canvas.
Do not add giant source-sheet images to the browser build.

Spider and Mimicling cards use the project's existing
`exotic-spider.svg` and `exotic-mimicling.svg`. Reusing this art instead of
inventing a new spider or chest maintains visual continuity.

## Card families
| Family | Face | Visual identity | Existing cards |
| --- | --- | --- | --- |
| Goblin | Original green dagger goblin | Rust red/amber strike sheen | Goblin Recruit, Pack Attack, Loot the Fallen |
| Skeleton | Original skull and shield | Ivory/steel marching sheen | Raise Skeleton, Bone March, Ossuary Wall, Rattle the Dead, Bone Tithe |
| Slime | Original emerald ooze | Teal gel squish | Slime Droplet, Gel Fusion |
| Spider | Existing spider illustration | Violet silk-web overlay | Spider Hatchling, Silken Prison |
| Mimicling | Existing baby mimic illustration | Ancient gold jaw glint | False Treasure, Family Dinner |
| Sporeling | Original red cap fungus | Warm spores | Spore Harvest, Symbiosis |
| King Mimic | Original crowned treasure chest | Gold royal glint | Royal Decree, Feast, Mirror Fang |

All other Fang/Shell/Bloom/Venom/Hunger actions keep their previous
individually illustrated `cardArt(type)` SVGs. This preserves differences
between spells without making every command look like a summon.

## Game-feel and readability
- School **symbol and rank** remain the first readable numbers on every card.
- Creature portrait occupies a slightly larger art window (98px).
- A small family label is *inside* the portrait. It never displaces the
  mechanic summary below.
- Goblin has a short slash; Skeleton has a pale march; Slime compresses;
  Spider shimmers with thread geometry; Mimicling and King Mimic flash gold;
  Sporeling has rising warm spores.
- These effects run **on hover or keyboard focus only**, not as ambient
  permanent loops. `prefers-reduced-motion` removes the movement.
- Inactive/illegal cards keep their face readable at reduced saturation.
- Opening eight-card hand preserves an eight-across layout on desktop and
  touch-friendly horizontal scrolling on narrow screens.
- The Quartermaster uses the **same** portrait renderer. Cards do not have
  two inconsistent art styles between purchase and combat.

## Files
- `dist/siege/creature-portraits.png`: five compact original sprite-board faces
- `dist/siege/creature-card-art.js`: pure card identity mapping and markup
- `dist/siege/creature-cards.css`: illustrated frames and accessible effects
- `dist/siege/forest-hand.js`: maps families onto existing card faces
- `dist/siege.js`: shared art renderer in the shop and hand
- `tests/creature-cards-ui.test.js`: art integrity and hand-rendering tests

## Non-goals / next steps
This pass does **not** implement Pack/Mob/Horde mechanical rewards or new
cards. Existing recruit stacking still uses the real `chainGroups` limit
of three matching physical cards per tactical slot. Future Phase 3 should
improve the visual transformation of linked creature stacks and only then
consider deeper tribal reward mechanics after playtesting.

## Manual review
Check the starting hand and Quartermaster at 1440px, 1100px, and 375px;
ensure that a rank/crest is readable over every portrait, that selected
creature cards still queue, that discard mode still works, and that
reduced-motion removes hover animation. Test Goblin and Skeleton cards
both in the hand and after purchase. Confirm no new actors appear on
the forest canvas.
