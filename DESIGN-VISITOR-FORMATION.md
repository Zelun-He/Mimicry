# Forest Edge — original enemy atlas fidelity

## Observed problem
The screenshot shows a full-size Watchman next to two miniature Guards,
and horizontal distortion. Both errors came from rendering code rather
than the original art.

Previous rendering:
- `Watchman` / focused target: 136 × 197 canvas pixels.
- Other attackers: 86 × 131 canvas pixels.
- Same source visitor sprite frame: **434.4 × 724** original pixels.
- CSS force-sized the canvas with a maximum height of 540px and a mobile
  minimum height of 265–280px, then used `object-fit:fill` or
  `object-fit:cover`. This could break the intrinsic 960:420 scale.

## Current rule
- **One scale:** display frame height **205px** for all active enemies.
  Display width derives from source aspect ratio: `205 × (434.4 / 724)`,
  approximately **123px**. No independent horizontal or vertical stretch.
- **Stable squad layout:** 1 enemy centered at x688, two at x636/x787,
  three at x584/x722/x860. The group is ordered by original enemy lane.
  Selecting a different target never swaps or resizes any party member.
- **Visible feet alignment:** the original frames include different amounts
  of transparent space beneath each portrait. Real source foot positions
  are [700,676,676,675,706] within the 724px-high atlas. Each sprite's
  top Y is calculated so the **last visible foot pixel** lands on
  Y=328, regardless of the original character and padding.
- **Target focus:** a short gold ellipse around the selected unit's feet
  and a small gold triangle above the chosen unit. The full enemy nameplate
  and HP bar remain in the original panel; selectable enemy chips and
  canvas click regions use these same exact geometry rectangles.
- **Fallbacks:** no stretched tan rectangles while visitors.png loads.
- **Canvas:** 960×420 drawing surface has matching CSS aspect ratio at every
  viewport width. No max/min height distorts the horizontal or vertical
  proportions; neighboring cards remain below the scene.

## Scope
Presentation only. No changes to cards, equipment, enemies, AI,
attacks, targeting authority, Hunger, progression or v8 save data.

## Verification
`tests/visitor-sprite-geometry.test.js` checks the shipped 2172×724
PNG atlas, all five raids, source-frame and destination aspect ratios,
consistent physical sprite sizes, foot alignment, screen bounds, no
overlapping hitboxes, stable coordinates after changing focus, actual
canvas draw calls and click targeting, and CSS ratios.

Manual browser QA: check stage 1 and Watchman stage 5 at desktop and mobile
widths. All adventurers should be comparable size; the Watchman should
not become larger when selected. Focus should be visible without shifting
party positions. The original ragged Mimic remains unchanged.
