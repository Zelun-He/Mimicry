# Mimicry — gameplay development roadmap

The existing Forest Edge and First Siege prototypes remain playable. Each item
below should be a distinct GitHub branch and pull request, with deterministic
combat tests, save migration, and a manual browser playtest before release.

- [x] **01 — Rare cards & Quartermaster acquisition** (`feature/rare-card-shop`).
  Add rule-changing commands, visible rarity and prices, and durable purchased
  deck entries. Keep the 8-card opening hand / 5-card chain limit.
- [x] **02 — Devour & assimilation** (`feature/devour-assimilation`). Enemy archetypes offer two distinct traits;
  the King Mimic can carry at most three at once and choose replacements.
- [x] **03 — Tribal Cards & Swarm Formations** (`feature/tribal-swarm-formations`).
  Stack duplicate Goblin or Skeleton recruits into one chain slot, command up to
  six disposable lane minions, spend Bones on undead tactics, and recruit tribe
  cards using gold. Permanent defenders still level and die independently.
- [x] **03b — New Creature Families** (`feature/spiders-slimes-mimiclings`).
  Add purchasable Spiders (Webweaver), Slimes (Mitosis/Fusion), and Mimiclings
  (False Treasure/Hunger), with local pixel-art portraits and shared summon caps.
- [x] **03c — Tier 1 Forest Edge presentation** (`feature/tier1-forest-polish`).
  Five distinct pixel-painted forest scenes, 36 original illustrated card faces,
  a clearer chain queue, premium shop card previews, and a non-blocking first-turn
  guide. This pass changes presentation, not combat balance or collectible IDs.
- [ ] **04 — Treasure bait and invasion control.** Choose between visible risk/reward
  lures before raids; enemy types and rewards vary accordingly.
- [ ] **05 — Counterplay-driven enemy abilities.** Bards, thieves, paladins,
  witch-hunters and mimic-hunters pressure different strategies without hard immunities.
- [ ] **06 — Higher-tier hands and rituals.** Pair, triple resonance, five-rank
  straight, five-of-a-school, and rare, discoverable finisher patterns; capped
  repetition and chain-resolution tests.
- [ ] **07 — Dungeon biomes and bosses.** Expand the forest into two additional
  environments with distinct enemies and bosses, with explicit difficulty pacing.
- [ ] **08 — Events and meaningful choices.** Treasure rooms, cursed bargains,
  traps, merchant negotiations and opt-in high-risk encounters.
- [ ] **09 — Run recap & discovery.** Track highest-damage chain, mutations,
  creature casualties, encounters and unlocked combinations for shareable recaps.
- [ ] **10 — Balance, accessibility & release polish.** Seeded simulation runs,
  animation clarity, mobile UX, keyboard controls and reduced-motion support.

Design constraints:
* Player decisions should change how combat works, not only increase damage.
* Gold purchases are optional; the player must always be able to proceed.
* New cards must not grant free infinite energy, repeated rituals or duplicate kills.
* Save validation must preserve deck identity, rarity ownership and upgrade limits.
* Content should be added in small, measurable slices instead of giant card dumps.
