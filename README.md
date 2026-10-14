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

## First Siege 0.10 — New Creature Families

Three additional summon families join Goblins and Skeletons **without adding
another dungeon biome, another currency, or new permanent defender classes**.

| Family | Summon | Tactic | Inherent behavior |
|---|---|---|---|
| **Spider** | Spider Hatchling (Venom 1) | Silken Prison (Venom 2) | Web reduces one enemy's next attack by 2 per stack (max 3); Spider hits inflict 1 poison while prey is webbed |
| **Slime** | Slime Droplet (Bloom 1) | Gel Fusion (Bloom 2) | A Slime surviving a hit can split into a Tiny Slime once per turn, respecting the 3-per-lane / 6-total cap |
| **Mimicling** | False Treasure (Hunger wild) | Family Dinner (Hunger wild) | Summoning can lure the strongest outsider into its lane once per turn; each Mimicling's first hit each turn generates up to 5 Hunger |

**Gel Fusion** consumes two summoned Slimes in the selected lane to create one
Giant Ooze (10 HP, 5 attack); the Giant Ooze cannot divide. **Family Dinner**
orders all active Mimiclings to attack, but does not re-trigger their once-per-
turn Hunger payout. Mimicling kills are ordinary kills; they cannot capture
enemy essences without Gnaw or Devour.

**New Quartermaster offer:** Creature Menagerie, **15 gold** for one card,
chosen from three visible options (one Spider, one Slime, one Mimicling).
Initially these are recruit cards; after obtaining a family recruit, subsequent
shops can offer its tactic card. This complements, rather than replaces, the
existing rare-card and Goblin/Skeleton tribal shops.

The game still begins with **8 cards in hand**, plays **5 chain slots**, and
permits **6 active minions (3 per lane)**. The new creature types share these
limits with Goblins and Skeletons. Spiders, Slimes, and Mimiclings have unique
local 16-bit-style SVG pixel-art portraits under `dist/siege/`, reused by the
battlefield and bestiary.

Version 8 local saves use `mimicry-siege-v8`, migrating earlier v2–v7 saves.
Purchase ledgers, Web stacks, moved enemy lanes, and summon behavior persist.
See `tests/creatures.test.js` and `DESIGN-CREATURES.md`.

## First Siege 0.11 — Forest Edge art and first-run onboarding

The five existing Tier 1 raids now play against five original pixel-art
backgrounds: **Sunbreak Clearing, Fernway Trail, Briar Hollow, Wispwood Grove,
and the Old Watchgate**. These are five *locations in the same Forest tier*,
not five new dungeon difficulty tiers. They follow the real raid index and
require no additional combat state or save migration.

The First Siege command hand now uses a coherent tall-card treatment influenced
by dark fantasy collectible card games: ornate school-specific frames, a large
original SVG illustration for each of the 36 current cards, suit/rank labels,
plain-English effect text, a flavor line and clearly separated play/discard
controls. Queued chain slots keep their art and show link/stack status.
The Quartermaster also previews the exact card that will be purchased.

A non-blocking guide provides context through the player's first choices:
playing a command, linking two commands, selecting lanes, and discovering
Hunger/Gnaw. Players can hide hints, which is stored independently of the
combat save. A five-stop progress trail and environmental story copy give
each raid a clear sense of place. The eight-card hand, five tactical chain
slots, shops, summons, card IDs and encounter balance are unchanged.

All assets are local and editable: five background SVGs in
`dist/siege/scenes/`, illustrated card rendering in `dist/siege/card-art.js`,
stage/tip copy in `dist/siege/tier1.js`, and responsive styling in
`dist/siege/tier1.css`. No remote images, fonts, videos, or trackers are
required. Reduced-motion preferences are respected.

See `FOREST-TIER1-ART.md` and `tests/tier1-art.test.js`.

## First Siege 0.12 — Card Feel & Link Clarity

Command cards now expose their **school crest** and **rank badge** prominently,
with five distinct animated hover/focus identities: Fang (slash), Shell (shield
reflection), Bloom (pollen), Venom (bubbles) and Hunger (gold sigil). Cards that
cannot legally link are clearly dimmed, but their effects stay readable.

The UI follows the existing actual card-engine rules rather than inventing new
ones. A card can link by the **same school**, **same rank**, **rank rising by
exactly one**, or via a **Hunger wild bridge**. When multiple rules apply, the
display prioritizes wild, sequence, rank, then school. Consecutive matching
recruits stack into a single tactical slot (maximum three) and display a
separate **FORMATION STACK** indicator. A complete five-slot chain can still
accept additional duplicate recruits into an unfinished stack.

**Live link inspector:** Hover, keyboard focus, or tap a card to preview its
legal status, exact connection reason, chain bonus and projected slot count.
The queue updates with school-tinted link badges, connector sparks, and a brief
selected-card animation. Hover/focus inspection never spends cards or changes
save state. The card face is an inspection surface; **Play** and **Discard**
remain separate actions to prevent accidental taps. Keyboard access is
preserved through focusable card groups and native buttons.

No changes to deck counts, card IDs, link legality, combat resolution, gold,
Hunger, raid progression, or version-8 saves. Added locally hosted stylesheet
`dist/siege/link-effects.css`, pure UI rules in
`dist/siege/link-feedback.js` and tests in
`tests/card-link-feedback.test.js`. CSS respects reduced-motion and touch
input. See `DESIGN-CARD-LINKS.md`.

## First Siege 0.13 — Hand-First Combat Interface

The previous Siege presentation accidentally inherited an old four-column
`.commands` parent grid. This squeezed the entire eight-card hand into
a quarter-width cell, producing unreadable slivers and giant blank queue
areas. First Siege now uses a compact, readable combat loop inspired by
the clarity of tactical hands such as Demon's Hand, with original Mimicry
art, creatures and rules intact:

1. Read the invaders in **three compact horizontal lanes** at the top.
   Click an enemy to select your focus (or leave Auto: weakest).
2. **Click any legal card** in the eight-card hand to queue it. The visible
   five-slot combo strip shows category, rank, link type and Mob/Horde stacks;
   click a queued card to undo. Invalid cards are dimmed, but readable.
3. Tap **DISCARD** to enter discard mode, then click the exact card to redraw
   (up to the current redraw allowance). Cancel the mode any time.
4. Tap **ATTACK** to resolve the queued commands and battlefield turn.
   King Mimic's Gnaw, Devour, Hunger and stolen traits remain available.
5. Deeper information (creature codex, veteran roster, combat journal)
   sits in expandable sections below combat, rather than crowding the hand.

The same five category crests and numerical links are retained. Hover/focus
still previews link legality and bonus. Cards are real buttons, so keyboard
Enter/Space and a single tap activate the same action. The mobile hand
scrolls sideways instead of becoming a squeezed multi-column grid.

This is a **UI reorganization**, not a new card game or a change to enemy
AI, card IDs, damage, saves, loot or shop math. There is no new save
version. Implementation: `dist/siege/combat-ui.js` (renderers),
`dist/siege/combat-clarity.css` (responsive layout), and
`tests/combat-clarity.test.js`.
