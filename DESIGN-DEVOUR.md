# Devour & Assimilation — gameplay design

## Core decision
Devour costs **100 Hunger**, hits a focused target for **25 damage**, and
captures a trait **only on the killing blow**. Captured essence is never a
random permanent power increase. Its two offers are tied to the identity of
the defeated adventurer. The player chooses one (or explicitly skips).

## Why the mechanic exists
1. **A reason to care about enemies:** A Forager offers Bloom healing or an
   extra redraw; a Guard offers armor acceleration or damage mitigation.
2. **A reason to plan a kill:** Devour must finish its target, so damage
   sequencing, selecting the right lane and conserving Hunger matter.
3. **Build identity:** Three equipped traits are a hard limit. Replacements
   create meaningful pivots between economy, defense, chain power, and poison.
4. **No punishment for discovery:** Once an eligible kill happens, its choice
   pauses combat, remains visible on reload and cannot be bypassed by the
   Quartermaster.
5. **Deterministic logic:** Captured options depend on enemy archetype, not
   a hidden reroll. The same prey reliably enables the same two decisions.

## Balance rules and edge cases
- The starting hand remains 8 cards; chain length remains 5. The extra
  redraw from Wild Pockets is a separate charge, not an added card.
- Traits are passive while equipped. Replaced traits stop acting immediately.
- Hunger-discount effects cannot make a card cost less than zero.
- First-hit and first-poison effects reset once per turn; they never recurse.
- Paid Mimic mutations remain separate from devoured traits.
- If the player has both available traits from a prey type, another devour
  kills that foe but captures nothing new.
- A captured essence does not also grant ordinary kill Hunger: Hunger is reset
  to zero on Devour. Gold still drops from the defeated foe.
- Captured abilities cannot revive permanently fallen defenders.
- If the victim dies as the last invader, raid rewards become available
  **after** the captured decision is resolved.
- Version 6 saves validate the acquisition/replacement history and pending
  victim, then migrate old saves with an empty trait loadout.

## Next balance hypotheses to test
- **Capture frequency:** At 100 Hunger, Devour should be a deliberate
  finishing opportunity, not available on every enemy.
- **Slot pressure:** The fourth essence choice should be meaningfully harder
  than the first, without making an earlier choice feel like a permanent trap.
- **Farming:** Extra-gold traits must not remove the need to weigh card and
  monster upgrades against high-cost Mimic mutations.
- **Encounter diversity:** Treasure bait and later dungeon stages should
  allow more control over which archetype's trait a player can seek.
