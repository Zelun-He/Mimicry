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
