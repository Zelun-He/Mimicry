# Mimicry — The Mimic's Hand: Forest Edge

A standalone, single-player browser card battler. Stage one follows Splinter, a ragged treasure-chest mimic, through four poorly equipped visitors and the Village Watchman boss. Original generated forest, mimic pose atlas, and visitor sprite strip are bundled locally. Relic Rush is a separate project.

Serve `dist/` with any static HTTP server. `npm start` (or `npm run dev`) serves it locally at http://localhost:5173. Node.js 20+ is needed for development and tests; the hosted game needs no server backend. `npm test` runs the card engine tests.

## Rules

Each encounter uses a shuffled 32-card deck: four suits, ranks 1–8. Draw eight and select up to five in order. Adjacent cards link if they share a suit, have equal rank, or rise by exactly one rank. Every consecutive link adds ×0.25 to that card's damage; a broken link resets its multiplier to ×1. Reorder the selected cards with the arrows.

- Fang: rank +3 damage.
- Shell: rounded-up half-rank damage, plus rank +2 temporary armor.
- Bloom: rounded-up half-rank damage and healing.
- Venom: rounded-up half-rank damage and two poison stacks.

Relics enhance individual suits or increase the link bonus. Multipliers affect damage, not armor/healing/poison. Enemy intent is shown before attacking. Poison damages the enemy before its retaliation, then loses one stack. Armor lasts one enemy attack. If direct damage or poison defeats the enemy, it cannot retaliate. Two discards per battle replace your selected cards without advancing the turn. Used cards enter the discard pile, which reshuffles when the draw pile runs out.

Victories grant gold, heal 10 health, and offer two available relics or 15 extra healing. Boss victory completes the first stage; deeper stages are not implemented. Gold is a run score, not yet a shop currency. Defeat permits a fresh run. The first encounter has a curated opening hand to teach chaining; subsequent encounters are shuffled.

Progress saves to browser local storage, including the current deck, selection, health, and encounter. Browser/device-specific; clearing browser data erases it. Bad saves fall back to a new run. There are no accounts, payments, multiplayer, or analytics.

The engine is independent from presentation in `dist/engine.js`. `dist/main.js` handles input, save state, previews, attack feedback, and canvas animation. `dist/style.css` is responsive, with a horizontally scrollable card hand on narrow screens. Reduced-motion preference limits animation. Optional synthesized sound is off by default.

Artwork was generated specifically for this prototype. Sprite poses and effects are lightweight rather than complete frame-by-frame animation. This game is original and is not affiliated with League of Legends, Pokémon, Riot Games, Nintendo, or Game Freak.

## Mimicry 0.2 — The First Siege (persistent-army prototype)

Open `/siege.html` from the same `npm start` server (or click **PLAY FIRST SIEGE** in the original game). This is an additional prototype mode, not a replacement for Forest Edge.

- Deploy a persistent army of Goblin, Slime, Skeleton, and Sporeling across three lanes.
- Choose a tactical order each turn. Living defenders automatically attack invaders in their lanes; surviving enemies retaliate, and undefended lanes lose dungeon integrity.
- Monster HP, XP, levels, kills, and deaths persist across five raids. Fallen monsters cannot be healed by resting.
- Win raids to rest, train a surviving monster, or recruit a new one (up to five living defenders).
- King Mimic gains Hunger from defeated adventurers and can use Devour at 100 Hunger.
- Sprite sheets from the First Siege animation pack drive idle, attack, damage, and death states. `dist/siege/animations.json` describes the 64×64 frames.
- First Siege saves separately to browser localStorage under `mimicry-siege-v2`.

This is a playable mechanics prototype. More elaborate dungeon construction and final sprite artwork remain future work.

## Command Chain 0.4 — Rituals & Targeting

Select a specific invader in **Command focus** to direct damaging command cards toward it; otherwise the weakest invader is targeted. Focus resets after each turn. Monster auto-attacks still follow their lane rules.

Contiguous three-card school patterns trigger rituals after their third card resolves. Overlapping patterns can each trigger once: Fang–Fang–Fang = Bloodbath (Goblin follow-up); Shell–Shell–Fang = Counteroffensive (armor damage); Bloom–Venom–Venom = Toxic Garden (poison and Sporeling heal); Bloom–Shell–Shell = Living Wall (team armor); Venom–Venom–Venom = Plague (teamwide poison). Hunger wild cards can link chains but do not substitute in rituals. See `tests/rituals.test.js` for deterministic examples.

## First Siege 0.6 — Gold & Quartermaster

**Playable at `/siege.html`.** Survive a raid to earn **5 gold per defeated invader**
plus a raid-clear bonus (8 gold on the first raid, growing by 3 each successive raid).
Each of the four between-raid shop visits features three limited offers: a targeted
**command enhancement** (12 gold; +2 base power per level, at most twice), targeted
**defender training** (14 gold; +2 attack and +4 maximum HP, at most twice), and a
random available **King Mimic mutation**:

- Iron Fangs (18 gold): +2 damage to Fang strikes and executions.
- Stolen Plating (18 gold): +5 maximum dungeon integrity and +5 restoration.
- Royal Satchel (24 gold): draw 9 cards instead of 8 (chain limit stays 5).
- Hunger Siphon (22 gold): +5 Hunger per kill.

You can save gold between raids. Choose one **free reinforcement** (rest, train,
or recruit) when ready to leave the shop and start the next raid. Purchases,
card levels, monster training, gold, mutations, and shop stock persist in
`mimicry-siege-v4` local browser saves. Existing v2/v3 saves migrate to v4.
The original Forest Edge game remains unchanged. See `tests/shop.test.js`.

## First Siege 0.7 — Rare commands

A new **rare command** offer now appears in each post-raid Quartermaster shop, alongside
card enhancement, defender training and a King Mimic mutation. Unlike a power upgrade,
this purchase **adds a new card to the draw pile** and guarantees its first appearance
in the following raid's opening hand. The starter deck remains 24 cards, opening hand
remains 8 cards, and maximum chain is still 5.

Four possible shop-only designs:

- **Sacrificial Strike** (Fang 4, rare, 18 gold): sacrifices up to 25% HP from the
  healthiest eligible defender (never lethal), then deals damage boosted by HP spent.
- **Bone Tithe** (Shell 3, rare, 19 gold): converts up to 6 allied armor into damage
  at 2 damage per point. Without armor, the card does nothing.
- **Spore Harvest** (Bloom 4, rare, 21 gold): consumes poison from the focused enemy
  to heal every surviving defender for 3 per stack.
- **Mirror Fang** (Hunger wild, legendary, 26 gold): spends 20 Hunger to repeat the
  previous simple command at half power, **without recursive copies or duplicate
  rituals**. Only strike, armor, heal, teamheal, poison, and weaken are repeatable.

Purchased cards retain stable IDs and purchase-raid records across saves and shuffles.
Saves now use browser key `mimicry-siege-v5`; v2, v3, and v4 saves migrate.
See `ROADMAP.md` for the sequenced plan and `tests/rare-cards.test.js`
for effect/purchase/migration regression tests.

## First Siege 0.8 — Devour & Assimilation

The King Mimic can **aim both feeding attacks using Command focus & Devour target**, shared with normal command chains. **Gnaw** costs 20 Hunger and deals **8 damage**; **Devour** costs 100 Hunger and deals **25 damage**. Either attack resolves immediately before the turn ends. Gnaw permits high-skill first-stage captures, while Devour is a more reliable but costly finisher.

- A **nonlethal feeding attack** deals its damage and spends Hunger but grants no trait.
- **Only a killing Gnaw or Devour** captures the enemy's essence. Other monster, poison,
  and command kills still grant gold/Hunger but cannot capture essence.
- Each named adventurer archetype offers **two fixed traits**. Choose one,
  or let the essence fade. The captured decision briefly blocks combat/shop
  actions; it also persists if you save and close the browser mid-choice.
- **Three equipped traits maximum.** To acquire a fourth, the player must
  deliberately replace exactly one existing trait. No duplicates, free extra
  slots, or implicit replacement. Shop-bought Mimic mutations use a separate
  system and are not overwritten.
- Both options are shown up front, with visible existing trait slots and
  descriptions. A trait owned already cannot be selected again.
- No gold cost for capture; the cost is the **20- or 100-Hunger commitment**, choosing
  a viable finishing blow, and an increasingly difficult opportunity cost.
- The final enemy of a raid can be devoured. The capture choice resolves before
  the Quartermaster or victory panel becomes interactive.

**Sources of traits:** Farmhand (breach defense / gold), Forager (Bloom healing
/ redraw), Scout (opening chain power / between-raid integrity), Guard (Shell
armor / first-hit mitigation), Archer (first Fang attack / Venom application),
Rogue (kill gold / weakened-target execution), Mage (Venom potency / discounted
Hunger commands), Watchman (long-chain autoattack / start-of-raid armor).

Unlike flat stat upgrades, these abilities change resource management and
encourage choosing different prey. The Watchman's traits are late-run trophies
in the five-raid prototype, intended for reuse once we add more dungeon floors.

**Save format:** Version 6 under `mimicry-siege-v6`, migrating existing
v2–v5 saves. The assimilation history records prey, raid, trait, and any
replaced ability so the three-slot limit can be validated after reload.
See `tests/assimilation.test.js` for deterministic scenarios.

## First Siege 0.9 — Tribal Cards & Swarm Formations

The First Siege now has **summonable Goblin and Skeleton formations** in addition
to its persistent defender army. New runs include two **Goblin Recruit** and
two **Raise Skeleton** cards as fixed founding cards, retaining the **8-card
hand** and **5-slot chain**. Previously saved runs automatically receive these
four founding cards in the draw pile after migration.

**Stacking:** Consecutive identical recruit cards automatically form a stack
of **up to three per tactical chain slot**. Each physical card is still consumed
once; a 3-recruit horde summons 3 individual minions, but does **not** provide
three chain boosts or three separate ritual symbols. Removing a queued recruit
peels one card off the stack. Four recruits form stacks of 3+1, rather than
an unlimited bundle.

**Temporary lane army:** Choose a summon lane before resolving the chain.
Summoned minions fight immediately and then attack once automatically each
turn. They intercept enemy attacks before veteran defenders, but have no XP.
Capacity is **6 minions total / 3 per lane**; surplus summon requests fizzle
without creating phantom units or breaking deck conservation. Minions disappear
after each raid, while veteran HP, levels, and deaths still persist.

**Goblins — Scavenger:** Summoned Goblins fighting together (2+ in one lane)
gain +1 attack. A three-Goblin gang can earn +1 gold when its minion scores a
kill. The shop can offer **Goblin Recruit**, **Pack Attack** (immediate extra
mob strike), or **Loot the Fallen** (once-per-turn +3 gold with an active Goblin).

**Skeletons — Bonebound:** Every normal summoned Skeleton that dies leaves
one **Bone** (6 maximum). **Bone March** orders extra Skeleton attacks,
**Ossuary Wall** converts up to 3 Bones into lane armor, and **Rattle the
Dead** spends 2 Bones to raise a Skeleton. A resurrected Skeleton cannot
generate a Bone if it dies during its creation turn, preventing same-turn
resource loops. Bones do not carry into the next raid.

**Quartermaster:** The new **Tribal Recruitment** offer presents one random
Goblin command and one random Skeleton command for **12 gold**; buy one per
shop. The previous rare-card offer still appears separately. Purchases use
stable identities `p0..` and preserve the acquisition ledger, even if a
player buys both a rare and a tribal card in the same shop visit.

**Save format:** Version 7 under `mimicry-siege-v7`; v2–v6 saves migrate.
The engine validates founding cards, purchased cards, stack-slot counts,
minion stats/limits, resource caps and lane selection. See
`tests/swarm.test.js` and `DESIGN-SWARM.md`.
