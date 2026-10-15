# Forest Edge: repaired visitor sprite atlas

## Symptom

The sword carried by the brown-haired Novice/Guard appeared severed, and a
floating sword sliver could appear beside the blue-clothed Wanderer/Archer.
The original 2172×724 PNG was sliced into five equal 434.4px-wide cells,
but the sword blade crossed the boundary between cells 3 and 4.

## Fix

`dist/assets/visitors.png` is now a **2410×724 RGBA PNG** containing five
independent, 482px-wide, complete original pixel-art characters.

* The exact **35×105 original sword-tip pixels** are removed from the
  Wanderer and attached to the Novice/Guard. No replacement illustration or
  invented pixels were introduced.
* Every frame is centered in its transparent cell, preserving the original
  character art and its frame aspect ratio.
* All visible boots end at source image row **713**. The Siege renderer uses
  `VISITOR_FOOT_ROWS=[713,713,713,713,713]` to place all characters on the
  same ground plane; the small grounded idle rotation stays intact.
* The 3-foe Forest Edge formation remains uniform, with no overlap.
* `dist/main.js` (the archived Classic mode) derives its rendered width
  from the new frame aspect ratio, so the visitors aren't stretched there.
* Fallback source width in `dist/siege/forest-renderer.js` is now 2410.

## Regeneration

The repo retains `scripts/repack-visitor-atlas.py` to reproduce the one-time
conversion from a **previous original 2172×724 source**. It requires Pillow:

```bash
python -m pip install Pillow
python scripts/repack-visitor-atlas.py path/to/original/visitors.png
```

It is intentionally idempotent on the resulting 2410×724 file. **Do not run
the generator against other PNG sizes**; it rejects unrecognized dimensions.

## Tests

`tests/novice-sword-atlas.test.js` verifies the actual decoded PNG alpha
channel (not just the filename), the five isolation bounds, absence of the
stray sword fragment on the Wanderer, the restored blade pixels in the
Novice frame, boot alignment, and formation hitboxes.

The existing visitor geometry, grounded idle-sway, and current raid tests
are also updated to use the corrected atlas dimensions.
