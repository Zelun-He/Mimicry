#!/usr/bin/env python3
"""Repair the original Forest Edge visitor sprite sheet without redrawing art.

The novice's sword crosses the Wanderer/Novice source-frame boundary.
Separate the tip, reattach it to the novice, and center all five sprites
in identical 482 x 724 transparent cells.

Requires: pip install pillow
Usage: python scripts/repack-visitor-atlas.py [dist/assets/visitors.png]
"""
from pathlib import Path
from sys import argv
from PIL import Image, ImageDraw

SOURCE_SIZE = (2172, 724)
CELL_W = 482
TARGET_SIZE = (CELL_W * 5, 724)
FOOT_ROW = 713
BORDER_X = (0, 434, 869, 1303, 1738, 2172)


def repack(source_path: Path) -> Image.Image:
    source = Image.open(source_path).convert("RGBA")
    if source.size == TARGET_SIZE:
        return source   # Already repacked; safely idempotent.
    if source.size != SOURCE_SIZE:
        raise ValueError(f"Unexpected original atlas dimensions: {source.size}")

    sprites = [source.crop((BORDER_X[i], 0, BORDER_X[i+1], 724))
               for i in range(5)]

    # Exact original pixels: this 35x105 blade segment belongs to novice #4.
    sword_tip = sprites[2].crop((399, 267, 434, 372))
    wanderer = sprites[2].copy()
    ImageDraw.Draw(wanderer).rectangle((399, 267, 433, 371),
                                       fill=(0, 0, 0, 0))
    sprites[2] = wanderer

    novice = Image.new("RGBA", (520, 724), (0, 0, 0, 0))
    novice.alpha_composite(sprites[3], (45, 0))
    novice.alpha_composite(sword_tip, (10, 267))
    sprites[3] = novice

    packed = Image.new("RGBA", TARGET_SIZE, (0, 0, 0, 0))
    for i, sprite in enumerate(sprites):
        bbox = sprite.getchannel("A").getbbox()
        if bbox is None:
            raise ValueError(f"Original visitor #{i} is empty")
        cropped = sprite.crop(bbox)
        if cropped.width > CELL_W:
            raise ValueError(f"Visitor #{i} exceeds {CELL_W}px")
        x = i * CELL_W + (CELL_W - cropped.width) // 2
        y = FOOT_ROW + 1 - cropped.height
        packed.alpha_composite(cropped, (x, y))

    for i in range(5):
        bbox = packed.crop((i * CELL_W, 0, (i + 1) * CELL_W, 724)).getchannel("A").getbbox()
        if bbox is None or bbox[3] - 1 != FOOT_ROW:
            raise AssertionError(f"Incorrect foot alignment for visitor #{i}: {bbox}")
    return packed


if __name__ == "__main__":
    path = Path(argv[1]) if len(argv) > 1 else (
        Path(__file__).resolve().parents[1] / "dist/assets/visitors.png"
    )
    result = repack(path)
    result.save(path, format="PNG", optimize=True)
    print(f"Repacked {path}: {result.width} x {result.height}; novice sword restored")
