# Mimicry — gameplay development roadmap

The existing Forest Edge and First Siege prototypes remain playable. Each item
below should be a distinct GitHub branch and pull request, with deterministic
combat tests, save migration, and a manual browser playtest before release.

- [x] **01 — Rare cards & Quartermaster acquisition** (`feature/rare-card-shop`).
  Add rule-changing commands, visible rarity and prices, and durable purchased
  deck entries. Keep the 8-card opening hand / 5-card chain limit.
- [ ] **02 — Devour & assimilation.** Enemy archetypes offer two distinct traits;
  the King Mimic can carry at most three at once and choose replacements.
- [ ] **03 — Monster evolution paths.** Each species has two meaningful branches;
  evolution changes its card affinities or behavior instead of just increasing stats.
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
