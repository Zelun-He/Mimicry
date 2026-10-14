# Swarm Formations — Milestone 3

## Player promise
Three apparently weak recruit cards should create a stronger battlefield
presence than one expensive direct-damage card, but not overwhelm an entire
five-slot combat turn without risk. A Goblin gang gains power by **living
together**. A Skeleton army gains resources by **dying and returning**.

## Source-of-truth design
- A *card* is an actual collectible with a unique immutable ID. It may be in
  draw, discard, hand or chain but never in multiple places.
- A *stack* is a visual/engine grouping of 1–3 **contiguous, identical**
  recruit cards. It occupies one chain slot, but all its physical card IDs
  remain in the saved chain.
- A *formation* resolves once and summons one body per stacked card, subject
  to **3-per-lane / 6-total**. The rest of a capped formation is discarded
  normally; no refunds, duplication, or unlimited spawning.
- Each chain is a maximum of **five tactical slots**, not five physical cards.
  Rituals use occupied slots, so 3 stacked Goblin recruits cannot instantly
  trigger Bloodbath on their own.
- A *permanent defender* is recruited/leveled normally and always persists
  between raids. A *temporary minion* is a different state collection, never
  levels up, dies freely, and is cleared at raid end.
- Players select one **summon lane** that applies to every summon/defense
  synergy card played that turn. This is deliberately simple for the first
  release; lane-per-card targeting can be considered later.
- Enemy retaliation targets a minion first, then permanent defenders, then
  the dungeon integrity. Minions make defensive positioning interesting.
- Goblins get Pack Tactics (+1 damage when 2+ are alive in their lane).
  Three total Goblins earn a little additional gold on minion kills.
- Skeleton minion deaths yield Bones (max 6). Bone Wall consumes up to 3;
  Rattle consumes 2 and revives one minion. Revived units cannot award Bones
  on the turn they are created; resurrection is always resource-negative.
- Per shop, one Goblin and one Skeleton option are generated with bounded RNG;
  choose one for 12 gold. Duplicates are allowed and desirable. Rare-card
  purchases remain a separate choice.
- Only the hand and available card draw are affected by deck growth; the
  eight-card hand and five-slot chain remain unchanged.

## Limits and forward work
The starting Forest encounters remain short: the design may benefit from
longer waves as minions and Bones become important. Future work could include
minion-targeting enemies, reactive Goblin rally cards, a Graveyard biome,
per-lane summons, and a discard/retention shop upgrade to assemble three
matching cards more consistently.

## Guardrails
No rituals from duplicate stacked symbols; no extra chain-link scaling for
physical cards inside the same formation; no purchase without actual gold;
no more than two paid cards per raid; no ghost minions in saves;
no Bones from permanent Skeleton deaths; no same-turn resurrection loops;
no minions surviving between raids.
