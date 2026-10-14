# Creature Families — First Siege 0.10

This iteration is deliberately limited to **three playable new families**:
Spiders, Slimes, Mimiclings. Treasure bait, deeper dungeons, Rats, Wraiths,
Kobolds, and Living Armor remain separate potential features.

## Spider / Webweaver
- Summons one Spider (4 HP / 2 attack), respecting the global minion limit.
- Each Spider summoned adds one Web to the first living enemy in its lane;
  an enemy has at most three Webs.
- On that enemy's next retaliation, Web weakens its attack by 2 per stack
  (maximum 6); afterward exactly one Web decays. This works when breaching
  the throne as well as when hitting a defender.
- A Spider hitting still-webbed prey adds one poison if the target survives.
- *Silken Prison* adds two Web and orders active Spiders to attack once again.
  Extra attacks cannot create extra cards, Bones, or limitless Web stacks.

## Slime / Mitosis
- A Slime Droplet has 6 HP and 2 attack. If damaged by a hostile attack
  and still alive, it tries to split into one Tiny Slime (3 HP / 1 attack).
- Each parent may split only once per game turn. A Tiny Slime never splits.
  No split is created if the lane has three minions or the army has six.
- *Gel Fusion* consumes two living Tiny Slimes / Droplets in the chosen lane,
  creating one Giant Ooze (10 HP / 5 attack). It produces no Bones, XP, or
  extra kill rewards. Giant Oozes never split.
- Fusion requires a real two-minion investment; a single Slime cannot become
  a Giant Ooze through repeated no-op cards.

## Mimicling / False Treasure
- A summoned Mimicling has 5 HP and 2 attack.
- The first Mimicling summoned in a given game turn attracts the living
  outside-lane invader with the greatest attack (then most HP) into the
  chosen lane. Other Mimiclings summoned that turn cannot lure again.
- A Mimicling gains at most 5 Hunger from its first damaging hit each turn.
  *Family Dinner* causes every living Mimicling to strike once more, but
  cannot repeatedly farm Hunger from the same creature that turn.
- Hunger gain is clamped to 100. Mimicling kills award ordinary bounty and
  never trigger a Devour/assimilation choice.

## Acquisition and balance
- Existing Goblin / Skeleton cards remain in the 28-card founding deck.
  New families begin as **discoverable shop cards**, ensuring early play
  isn't flooded with too many unrelated mechanics.
- The Creature Menagerie gives one choice of Spider, Slime, or Mimicling
  for 15 gold per post-raid visit. Owned families can draw a tactic card
  in a later shop; duplicates remain possible and stack.
- Each raid can sell at most one rare, one tribal, and one exotic command.
  Up to 12 command additions are supported across four shop opportunities.
- Web is a status, Slimes use summon slots, Mimiclings use Hunger. There is
  no new resource bar or separate inventory system.
- All minions clear on raid completion; old player saves migrate to v8
  without changing gold, permanent defenders, or purchased cards.
- Intended next validation: playtest the five existing raids and tune
  gold availability, Web potency, and swarm reliability.
