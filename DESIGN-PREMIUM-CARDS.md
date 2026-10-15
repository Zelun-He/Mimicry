# Mimicry: Final Card Anatomy & Gameplay Typography

## Why this pass exists
Eight 228px cards with indistinguishable body copy and green "START"
ribbons read like templated inventory tiles. The stronger original
Forest Edge game should be supported by an equally strong, consistent
collectible-card language. This pass implements the shared final layout
without rewriting combat or inventing energy costs.

## One consistent card, multiple identities
From top to bottom:

1. **LINK RANK** in large serif numerals on the left, plus the **school
   crest** and optional true rarity on the right. Rank is a link *number*,
   never the cost. Hunger wildcard cards show ★ WILD.
2. **School or creature-family / ROLE** microheader.
3. **Name** on one or two larger lines.
4. **Framed original illustration**: original creature-sheet portrait for
   Goblin/Skeleton/Slime/Sporeling/King Mimic, the actual Spider/Mimicling
   SVG, or a distinct action illustration. Numeric Hunger cost is a small
   separate badge in this area.
5. **Primary effect** in bold, short text; **secondary condition** in a
   smaller subdued line. Current game mechanics are reflected honestly.
6. **Two keyword chips** for quick deck synergy scanning.
7. **Role strip** replacing the repetitive START. Its right side displays
   the current actual link reason only when a chain is being built; illegal
   followups say NO LINK.

The card surface remains a native HTML button. Clicking immediately queues
when legal; discard mode remains a deliberate toggle. Unplayable cards
remain legible and inspectable. Keyboard focus provides the same visible
information as hover. Reduced motion eliminates card animations.

## Per-class frame language
- Attack: russet angular trim
- Defense: heavier steel-blue rim
- Recovery: soft forest green
- Summon: antique bronze with full creature portrait
- Engine: aged moss accents
- Finisher: deeper berry/burnished rim
- Legendary: gold and ivory, extra inset filigree

School crests (Fang ◆, Shell ⬡, Bloom ✦, Venom ◇, Hunger ♛) are always in
the same upper-right location. Class/role styles supplement school, not
replace it; numbers/crest remain readable at a glance.

## Existing card catalog
| Card | Category / role | Keyword A | Keyword B |
| --- | --- | --- | --- |
| `strike` | STRIKE | ATTACK | FANG |
| `blood` | LINKER | ATTACK | CHAIN |
| `ambush` | LINKER | ATTACK | CHAIN |
| `execute` | FINISHER | ATTACK | EXECUTE |
| `frenzy` | ENGINE | TEAM | ATTACK |
| `fortify` | GUARD | ARMOR | DEFENSE |
| `guard` | GUARD | ARMOR | DEFENSE |
| `thorns` | COUNTER | ARMOR | COUNTER |
| `counter` | PAYOFF | ARMOR | ATTACK |
| `mend` | RECOVERY | HEAL | SINGLE |
| `roots` | CONTROL | WEAKEN | CONTROL |
| `regrow` | RECOVERY | HEAL | SINGLE |
| `symbiosis` | RECOVERY | HEAL | TEAM |
| `bite` | POISON | POISON | SETUP |
| `corrode` | CONTROL | ARMOR BREAK | POISON |
| `contagion` | SPREAD | POISON | SPREAD |
| `detonate` | FINISHER | POISON | PAYOFF |
| `decree` | COMMAND | HUNGER | TEAM |
| `feast` | FINISHER | HUNGER | ATTACK |
| `sacrifice` | FINISHER | SACRIFICE | ATTACK |
| `tithe` | PAYOFF | ARMOR | PAYOFF |
| `harvest` | PAYOFF | POISON | HEAL |
| `mirror` | LEGENDARY | HUNGER | COPY |
| `goblin-recruit` | SUMMON | GOBLIN | MOB |
| `skeleton-recruit` | SUMMON | SKELETON | BONE |
| `pack-attack` | PAYOFF | GOBLIN | SWARM |
| `loot-fallen` | ECONOMY | GOBLIN | GOLD |
| `bone-march` | PAYOFF | SKELETON | BONE |
| `bone-wall` | GUARD | SKELETON | ARMOR |
| `rattle-dead` | SUMMON | SKELETON | REVIVE |
| `spider-summon` | SUMMON | SPIDER | WEB |
| `silken-prison` | CONTROL | SPIDER | WEB |
| `slime-summon` | SUMMON | SLIME | SPLIT |
| `gel-fusion` | PAYOFF | SLIME | FUSION |
| `mimicling-summon` | SUMMON | MIMICLING | LURE |
| `family-dinner` | PAYOFF | MIMICLING | HUNGER |

## Contextual scan behavior
- **No queued card:** Only a card's unique role is printed in its bottom
  strip. No "START ×8" banners.
- **A queued card:** The right of the strip shows the actual suit/rank/sequence/
  Hunger/stack link or NO LINK. Link legality is unchanged.
- **Eligible combo prerequisite:** A bright COMBO READY marker appears when a
  valid visible condition is met (e.g., poison on target, enough Hunger,
  live Goblin for Pack Attack); this is a hint, not a guarantee of damage.
- **Hover/focus:** The full role/primary/secondary rule and exact link
  explanation appear in the stable inspector, not an oversized tooltip.
- **Discard mode:** Distinct bronze selection cues and "REDRAW" label;
  incompatible links are still discardable.

## Shop-specific UX
Rare command and tribal/creature offers now show the SAME full card face.
Choosing a different monster type changes portrait, category/rank, description,
keywords, role, rarity and Hunger price together. Duplicate long paragraphs
listing every option were removed. The Buy button and source shop currency
rules were not altered.

## Layout/QA
- Eight cards across a sufficiently wide desktop screen (>1320px).
- Horizontal 166px wide rail below 1320px; 163px on narrow mobile.
- All cards are 306px tall with a fixed 103px illustration.
- Text has strong hierarchy and bounded line counts; full mechanics are in
  the button's accessible name and the interactive inspector.
- Pixel assets keep their original framing; no new image requests.
- Native button semantics; focus-visible; reduced-motion supported.
- Run all existing 36-card and cross-save regression tests before release.

## Mechanics safety
No 1–5 LINK RANK has become an energy cost. No keyword or role changes a
combat calculation, rarity, buying price, monster trait, or save record.
The card description is presentational only; the original deterministic
Siege engine continues to own all effects.
