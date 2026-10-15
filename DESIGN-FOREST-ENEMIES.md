# Tier I Forest Edge — Visitor variety

## Design thesis
Enemies should create specific tactical decisions, not become more exciting
merely by gaining HP and damage. Cards remain the main tool; encounter variety
nudges target selection, swarm positioning, armor and burst damage.

## Encounter curve
- Raid 1 — Curious Villagers: always Farmhand + Forager. Familiar tutorial.
- Raid 2 — Forest Scouts: Scouts, OR a Scout with Lantern Bearer, OR Poacher
  with Scout. The first glimpse of a specialist.
- Raid 3 — Militia Patrol: original Guards + Archer, OR a Guard with
  Herbalist + Archer, OR Sapper + Scout + Archer.
- Raid 4 — Treasure Hunters: original Rogue + Mage, OR Poacher + Mage,
  OR Rogue + Herbalist.
- Raid 5 — The Watchman: the original Watchman + two Guards, OR Watchman
  + Lantern Bearer + Guard. Boss remains the centerpiece.

One of these authored parties is chosen per raid when a new run begins;
choices persist in the run save. The original party is still the majority
default. First tutorial always uses the original pair.

## Role rules and responses
| Role | Ability | How to respond |
| --- | --- | --- |
| Lantern Bearer | +1 to every *other* living invader's attack | Target or Devour the support before resolving the turn |
| Herbalist | Heals the most wounded living foe by up to 3 after your team attacks | Finish wounded targets or remove the healer |
| Poacher | +2 against disposable summoned monsters only | Move vulnerable swarms, defend with veterans |
| Sapper | +2 against any defender who currently has armor | Diversify defense; armor still blocks normally |

No hard immunities, unavoidable full-party wipes, hidden RNG critical hits,
or currency loss. All effects use existing deterministic turn resolution.

## Gameplay UI
- Each specialist appears as a named selectable target with a distinctive
  Unicode school icon, role subtitle, tooltip and visible HP.
- The existing enemy intent plate explicitly describes its next action.
- A selected enemy stays the same size as its companions and gets only the
  existing selection ring.
- Reuses proportional original five-frame visitor atlas; **no new sprite
  actors or externally fetched artwork**.

## Saving and compatibility
- v8 saves now include `encounterPlan`, one authored option index per raid.
- Previously stored v2–v8 saves without this array are treated as canonical.
- The restore validator verifies the specific selected party and its enemy
  IDs/names/maximum HP and verifies essence provenance from each party.
- The chapter is still five raids; prices and card power are unchanged.

## QA focus
- Run multiple fresh seeded starts and verify both canonical and variants.
- Confirm new roles activate at most their described bonuses and stop upon
  death; healer must be alive after the player's actions to mend.
- Confirm target buttons accurately preview the role and click-to-focus.
- Confirm Gnaw/Devour can absorb a specialist and restore its provenance.
- Check old saves made before this patch still load unchanged.
- Manually inspect all parties at 375px and 1440px without overlapping art.
