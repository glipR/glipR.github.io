#!/usr/bin/env python3
"""
Random flag generator.

Reads usernames (one per line) from stdin or from a file and writes one
3:2 landscape flag per username as {username}.png.  The name is percent-
encoded (urllib.parse.quote) so the file name is a valid URL component:
"user 42" -> "user%2042.png", "foo/bar" -> "foo%2Fbar.png".

Flags are built from real vexillological vocabulary: striped / quartered /
diagonal fields, Nordic and centred crosses, saltires, hoist triangles and
bands, cantons, and charges such as discs, rings, stars, star rings,
crescents and suns. Colours are picked from a flag-like palette with a
minimum luminance contrast between neighbours, so results stay legible.

By default a flag is deterministic: the same username always produces the
same flag (handy for reruns). Pass --random for a fresh flag every time.

Usage:
    printf 'alice\nbob\n' | ./generate_flags.py
    ./generate_flags.py -o flags usernames.txt
    ./generate_flags.py --sheet preview.png < usernames.txt   # contact sheet
    ./generate_flags.py --random --seed mcpc26 -w 1200 usernames.txt

Requires: Pillow  (pip install Pillow)
"""

import argparse
import hashlib
import math
import os
import sys
from urllib.parse import quote

from PIL import Image, ImageDraw

SS = 4              # supersampling factor (rendered big, then downscaled)
MIN_CONTRAST = 62   # minimum luminance gap between touching colours

PALETTE = [
    (206, 17, 38),    # red
    (178, 34, 52),    # crimson
    (120, 20, 40),    # maroon
    (0, 57, 166),     # blue
    (0, 35, 102),     # navy
    (93, 173, 226),   # sky blue
    (0, 122, 61),     # green
    (0, 90, 45),      # dark green
    (102, 187, 58),   # lime
    (255, 205, 0),    # yellow
    (212, 175, 55),   # gold
    (243, 146, 55),   # orange
    (255, 255, 255),  # white
    (24, 24, 26),     # black
    (94, 53, 137),    # purple
    (0, 128, 128),    # teal
    (0, 163, 173),    # cyan
    (230, 120, 140),  # pink
    (120, 72, 40),    # brown
    (145, 150, 155),  # grey
]


# ---------------------------------------------------------------- colours

def luminance(c):
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]


def contrast(a, b):
    return abs(luminance(a) - luminance(b))


class Scheme:
    """Keeps a flag to a small, coherent, legible set of colours."""

    def __init__(self, rng):
        self.rng = rng
        self.used = []

    def pick(self, avoid=(), min_c=MIN_CONTRAST):
        avoid = [a for a in avoid if a is not None]
        ok = lambda c: all(c != a and contrast(c, a) >= min_c for a in avoid)

        reusable = [c for c in self.used if ok(c)]
        if reusable and self.rng.random() < 0.6:
            return self.rng.choice(reusable)

        pool = PALETTE[:]
        self.rng.shuffle(pool)
        for c in pool:
            if ok(c):
                self.used.append(c)
                return c
        # nothing clears the bar: take the most contrasting option available
        best = max(pool, key=lambda c: min([contrast(c, a) for a in avoid] or [255]))
        self.used.append(best)
        return best


def wchoice(rng, table):
    """table is [(weight, value), ...]"""
    r = rng.random() * sum(w for w, _ in table)
    for w, v in table:
        r -= w
        if r <= 0:
            return v
    return table[-1][1]


def sample_bg(img, box):
    """Colours actually underneath a bounding box, so a charge can contrast."""
    x0, y0, x1, y1 = [int(v) for v in box]
    x0, y0 = max(x0, 0), max(y0, 0)
    x1, y1 = min(x1, img.width - 1), min(y1, img.height - 1)
    seen = []
    for i in range(5):
        for j in range(5):
            px = img.getpixel((x0 + (x1 - x0) * i // 4, y0 + (y1 - y0) * j // 4))
            if px not in seen:
                seen.append(px)
    return seen


# ------------------------------------------------------------------ fields

def field_plain(img, d, w, h, sch, rng):
    d.rectangle([0, 0, w, h], fill=sch.pick())
    return {"kind": "plain", "bands": 1}


def field_horizontal(img, d, w, h, sch, rng):
    n = wchoice(rng, [(3, 2), (6, 3), (2, 4), (2, 5)])
    if n == 3 and rng.random() < 0.3:
        weights = [1, 2, 1]                      # Spain-style wide middle band
    else:
        weights = [1] * n
    total = sum(weights)
    y, prev = 0, None
    for i, wt in enumerate(weights):
        c = sch.pick(avoid=[prev])
        y2 = round(h * sum(weights[:i + 1]) / total)
        d.rectangle([0, y, w, y2], fill=c)
        y, prev = y2, c
    return {"kind": "horizontal", "bands": n}


def field_vertical(img, d, w, h, sch, rng):
    n = rng.choice([2, 3, 3])
    weights = [1, 2, 1] if (n == 3 and rng.random() < 0.25) else [1] * n
    total = sum(weights)
    x, prev = 0, None
    for i, wt in enumerate(weights):
        c = sch.pick(avoid=[prev])
        x2 = round(w * sum(weights[:i + 1]) / total)
        d.rectangle([x, 0, x2, h], fill=c)
        x, prev = x2, c
    return {"kind": "vertical", "bands": n}


def field_diagonal(img, d, w, h, sch, rng):
    a = sch.pick()
    b = sch.pick(avoid=[a])
    d.rectangle([0, 0, w, h], fill=a)
    if rng.random() < 0.5:
        d.polygon([(0, h), (w, h), (w, 0)], fill=b)
    else:
        d.polygon([(0, 0), (w, 0), (w, h)], fill=b)
    return {"kind": "diagonal", "bands": 2}


def field_quarters(img, d, w, h, sch, rng):
    a = sch.pick()
    b = sch.pick(avoid=[a])
    d.rectangle([0, 0, w // 2, h // 2], fill=a)
    d.rectangle([w // 2, 0, w, h // 2], fill=b)
    d.rectangle([0, h // 2, w // 2, h], fill=b)
    d.rectangle([w // 2, h // 2, w, h], fill=a)
    return {"kind": "quarters", "bands": 2}


FIELDS = [
    (34, field_horizontal),
    (20, field_vertical),
    (16, field_plain),
    (10, field_diagonal),
    (6, field_quarters),
]


# ---------------------------------------------------------------- overlays
# An overlay returns a dict which may contain:
#   blocks_centre : True  -> don't put a charge in the middle
#   focus         : (cx, cy, r) -> a good spot for a small charge

def overlay_none(img, d, w, h, sch, rng):
    return {}


def _bar(d, box, colour, fim=None, fim_pad=0):
    if fim is not None:
        d.rectangle([box[0] - fim_pad, box[1] - fim_pad,
                     box[2] + fim_pad, box[3] + fim_pad], fill=fim)
    d.rectangle(box, fill=colour)


def overlay_nordic_cross(img, d, w, h, sch, rng):
    cx = w * rng.choice([0.34, 0.36, 0.38])
    t = h * rng.choice([0.16, 0.18, 0.20])
    bg = sample_bg(img, (0, 0, w, h))
    colour = sch.pick(avoid=bg)
    fim, pad = (None, 0)
    if rng.random() < 0.35:
        fim = sch.pick(avoid=bg + [colour])
        pad = t * 0.22
    _bar(d, [cx - t / 2, 0, cx + t / 2, h], colour, fim, pad)
    _bar(d, [0, h / 2 - t / 2, w, h / 2 + t / 2], colour, fim, pad)
    return {"blocks_centre": True}


def overlay_centre_cross(img, d, w, h, sch, rng):
    t = h * rng.choice([0.18, 0.22, 0.26])
    bg = sample_bg(img, (0, 0, w, h))
    colour = sch.pick(avoid=bg)
    _bar(d, [w / 2 - t / 2, 0, w / 2 + t / 2, h], colour)
    _bar(d, [0, h / 2 - t / 2, w, h / 2 + t / 2], colour)
    return {"blocks_centre": True}


def overlay_saltire(img, d, w, h, sch, rng):
    bg = sample_bg(img, (0, 0, w, h))
    colour = sch.pick(avoid=bg)
    t = int(h * rng.choice([0.14, 0.18, 0.22]))
    if rng.random() < 0.4:
        fim = sch.pick(avoid=bg + [colour])
        d.line([(0, 0), (w, h)], fill=fim, width=int(t * 1.5))
        d.line([(0, h), (w, 0)], fill=fim, width=int(t * 1.5))
    d.line([(0, 0), (w, h)], fill=colour, width=t)
    d.line([(0, h), (w, 0)], fill=colour, width=t)
    return {"blocks_centre": True}


def overlay_hoist_triangle(img, d, w, h, sch, rng):
    frac = rng.choice([0.30, 0.36, 0.42])
    bg = sample_bg(img, (0, 0, w * frac, h))
    colour = sch.pick(avoid=bg)
    d.polygon([(0, 0), (w * frac, h / 2), (0, h)], fill=colour)
    return {"focus": (w * frac * 0.33, h / 2, h * 0.16)}


def overlay_hoist_band(img, d, w, h, sch, rng):
    frac = rng.choice([0.25, 1 / 3.0])
    bg = sample_bg(img, (0, 0, w * frac, h))
    colour = sch.pick(avoid=bg)
    d.rectangle([0, 0, w * frac, h], fill=colour)
    return {"focus": (w * frac / 2, h / 2, h * 0.15)}


def overlay_canton(img, d, w, h, sch, rng):
    cw, ch = w * rng.choice([0.38, 0.44, 0.5]), h * 0.5
    bg = sample_bg(img, (0, 0, cw, ch))
    colour = sch.pick(avoid=bg)
    d.rectangle([0, 0, cw, ch], fill=colour)
    return {"focus": (cw / 2, ch / 2, min(cw, ch) * 0.3)}


def overlay_border(img, d, w, h, sch, rng):
    bg = sample_bg(img, (0, 0, w, h))
    colour = sch.pick(avoid=bg)
    t = int(h * rng.choice([0.05, 0.07]))
    d.rectangle([t // 2, t // 2, w - t // 2, h - t // 2], outline=colour, width=t)
    return {}


def overlay_chevron(img, d, w, h, sch, rng):
    """A chevron: a wedge from the hoist with the field showing through it."""
    depth = w * rng.choice([0.34, 0.44])
    t = h * rng.choice([0.16, 0.20])
    bg = sample_bg(img, (0, 0, depth, h))
    colour = sch.pick(avoid=bg)
    saved = img.crop((0, 0, w, h))
    d.polygon([(0, 0), (depth, h / 2), (0, h)], fill=colour)
    mask = Image.new("L", (w, h), 0)
    k = 1 + (h / 2.0) / depth                       # keeps the arms even
    ImageDraw.Draw(mask).polygon(
        [(-w, t * k), (depth - t * k, h / 2), (-w, h - t * k)], fill=255)
    img.paste(saved, (0, 0), mask)
    return {}



def overlay_table(field, rng):
    """Crosses need a quiet field; busy fields only take hoist devices."""
    kind, bands = field.get("kind", "plain"), field.get("bands", 1)
    table = [(30, overlay_none), (13, overlay_hoist_triangle), (6, overlay_border)]
    if kind not in ("quarters", "diagonal"):
        table.append((9, overlay_canton))
    if kind not in ("vertical", "quarters"):
        table.append((10, overlay_hoist_band))
    if kind in ("plain", "horizontal", "vertical") and bands <= 2:
        weight = 1.0 if kind == "plain" else 0.35
        table += [(11 * weight, overlay_nordic_cross),
                  (8 * weight, overlay_centre_cross),
                  (7 * weight, overlay_saltire)]
    if kind in ("plain", "horizontal"):
        table.append((6, overlay_chevron))
    return table


# ----------------------------------------------------------------- charges

def star_points(cx, cy, r, points=5, inner=0.382, rot=-90.0):
    pts = []
    for i in range(points * 2):
        rad = r if i % 2 == 0 else r * inner
        a = math.radians(rot + i * 180.0 / points)
        pts.append((cx + rad * math.cos(a), cy + rad * math.sin(a)))
    return pts


def _punch(img, box, shape_box, kind="ellipse"):
    """Restore the original background inside shape_box (used for rings/crescents)."""
    x0, y0 = int(box[0]), int(box[1])
    bg = img.crop((x0, y0, int(box[2]), int(box[3])))
    mask = Image.new("L", bg.size, 0)
    md = ImageDraw.Draw(mask)
    rel = [shape_box[0] - x0, shape_box[1] - y0, shape_box[2] - x0, shape_box[3] - y0]
    getattr(md, kind)(rel, fill=255)
    return bg, mask, (x0, y0)


def charge_disc(img, d, cx, cy, r, colour, sch, rng, bg):
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=colour)


def charge_ring(img, d, cx, cy, r, colour, sch, rng, bg):
    box = (cx - r, cy - r, cx + r, cy + r)
    inner = r * rng.choice([0.52, 0.62, 0.7])
    saved = img.crop((int(box[0]), int(box[1]), int(box[2]), int(box[3])))
    d.ellipse(box, fill=colour)
    mask = Image.new("L", saved.size, 0)
    ImageDraw.Draw(mask).ellipse([r - inner, r - inner, r + inner, r + inner], fill=255)
    img.paste(saved, (int(box[0]), int(box[1])), mask)


def charge_star(img, d, cx, cy, r, colour, sch, rng, bg):
    n = wchoice(rng, [(6, 5), (2, 6), (1, 7), (1, 8)])
    d.polygon(star_points(cx, cy, r, n, 0.45 if n > 5 else 0.382), fill=colour)


def charge_star_row(img, d, cx, cy, r, colour, sch, rng, bg):
    n = rng.choice([2, 3, 3, 5])
    step = r * 1.1
    span = step * (n - 1)
    for i in range(n):
        d.polygon(star_points(cx - span / 2 + i * step, cy, r * 0.45), fill=colour)


def charge_star_ring(img, d, cx, cy, r, colour, sch, rng, bg):
    n = rng.choice([5, 6, 8, 12])
    for i in range(n):
        a = math.radians(-90 + i * 360.0 / n)
        d.polygon(star_points(cx + r * 0.78 * math.cos(a),
                              cy + r * 0.78 * math.sin(a), r * 0.24), fill=colour)


def charge_crescent(img, d, cx, cy, r, colour, sch, rng, bg):
    box = (cx - r, cy - r, cx + r, cy + r)
    saved = img.crop((int(box[0]), int(box[1]), int(box[2]), int(box[3])))
    d.ellipse(box, fill=colour)
    off, shrink = r * 0.34, 0.86
    mask = Image.new("L", saved.size, 0)
    ImageDraw.Draw(mask).ellipse(
        [r + off - r * shrink, r - r * shrink, r + off + r * shrink, r + r * shrink],
        fill=255)
    img.paste(saved, (int(box[0]), int(box[1])), mask)
    if rng.random() < 0.7:
        d.polygon(star_points(cx + r * 0.62, cy, r * 0.34), fill=colour)


def charge_sun(img, d, cx, cy, r, colour, sch, rng, bg):
    n = rng.choice([8, 12, 16])
    for i in range(n):
        a = math.radians(i * 360.0 / n)
        b = math.radians(i * 360.0 / n + 180.0 / n * 0.55)
        c = math.radians(i * 360.0 / n - 180.0 / n * 0.55)
        d.polygon([(cx + r * 1.45 * math.cos(a), cy + r * 1.45 * math.sin(a)),
                   (cx + r * 0.85 * math.cos(b), cy + r * 0.85 * math.sin(b)),
                   (cx + r * 0.85 * math.cos(c), cy + r * 0.85 * math.sin(c))],
                  fill=colour)
    d.ellipse([cx - r * 0.9, cy - r * 0.9, cx + r * 0.9, cy + r * 0.9], fill=colour)


def charge_triangle(img, d, cx, cy, r, colour, sch, rng, bg):
    pts = [(cx + r * math.cos(math.radians(-90 + i * 120)),
            cy + r * math.sin(math.radians(-90 + i * 120))) for i in range(3)]
    d.polygon(pts, fill=colour)


CHARGES = [
    (16, charge_disc),
    (8, charge_ring),
    (22, charge_star),
    (9, charge_star_row),
    (7, charge_star_ring),
    (10, charge_crescent),
    (8, charge_sun),
    (5, charge_triangle),
]


def add_charge(img, d, cx, cy, r, sch, rng):
    charge = wchoice(rng, CHARGES)
    pad = r * 1.6
    bg = sample_bg(img, (cx - pad, cy - pad, cx + pad, cy + pad))
    colour = sch.pick(avoid=bg)
    charge(img, d, cx, cy, r, colour, sch, rng, bg)


# ------------------------------------------------------------------- flag

def make_flag(rng, width, height):
    w, h = width * SS, height * SS
    img = Image.new("RGB", (w, h), (255, 255, 255))
    d = ImageDraw.Draw(img)
    sch = Scheme(rng)

    field = wchoice(rng, FIELDS)(img, d, w, h, sch, rng) or {}
    info = wchoice(rng, overlay_table(field, rng))(img, d, w, h, sch, rng) or {}

    focus = info.get("focus")
    if focus and rng.random() < 0.75:
        add_charge(img, d, focus[0], focus[1], focus[2], sch, rng)
        if not info.get("blocks_centre") and rng.random() < 0.15:
            add_charge(img, d, w * 0.68, h / 2, h * 0.2, sch, rng)
    elif not info.get("blocks_centre"):
        bare = field.get("kind") == "plain" and not info      # nothing drawn yet
        if bare or rng.random() < 0.62:
            add_charge(img, d, w / 2, h / 2,
                       h * rng.choice([0.20, 0.26, 0.30]), sch, rng)

    return img.resize((width, height), Image.LANCZOS)


def seed_for(name, salt):
    digest = hashlib.sha256((salt + "\x00" + name).encode("utf-8")).hexdigest()
    return int(digest, 16)


def safe_filename(name):
    """Percent-encode the username so the file name is a valid URL component."""
    return (quote(name, safe="") or "flag") + ".png"


def contact_sheet(images, cols=4):
    if not images:
        return None
    fw, fh = images[0].size
    pad = max(fw // 24, 4)
    rows = (len(images) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * (fw + pad) + pad, rows * (fh + pad) + pad),
                      (235, 235, 238))
    for i, im in enumerate(images):
        x = pad + (i % cols) * (fw + pad)
        y = pad + (i // cols) * (fh + pad)
        sheet.paste(im, (x, y))
    return sheet


# -------------------------------------------------------------------- CLI

def main(argv=None):
    p = argparse.ArgumentParser(
        description="Generate a random 3:2 flag per username as {username}.png",
        formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("input", nargs="?", default="-",
                   help="file with one username per line (default: stdin)")
    p.add_argument("-o", "--out", default="flags",
                   help="output directory (default: flags)")
    p.add_argument("-w", "--width", type=int, default=900,
                   help="flag width in px; height is 2/3 of it (default: 900)")
    p.add_argument("--seed", default="",
                   help="salt for deterministic generation; change it to reroll everyone")
    p.add_argument("--random", action="store_true",
                   help="ignore usernames when seeding: different flags every run")
    p.add_argument("--sheet", metavar="PNG",
                   help="also write a contact sheet of every flag generated")
    p.add_argument("-f", "--force", action="store_true",
                   help="overwrite existing files (default: skip them)")
    p.add_argument("-q", "--quiet", action="store_true", help="only report problems")
    args = p.parse_args(argv)

    import random

    if args.width < 30:
        p.error("--width must be at least 30")
    height = round(args.width * 2 / 3)

    stream = sys.stdin if args.input == "-" else open(args.input, encoding="utf-8")
    with stream as fh:
        names, seen = [], set()
        for line in fh:
            name = line.strip()
            if not name or name.startswith("#") or name in seen:
                continue
            seen.add(name)
            names.append(name)

    if not names:
        print("no usernames on input", file=sys.stderr)
        return 1

    os.makedirs(args.out, exist_ok=True)
    sysrand = random.SystemRandom()
    images, written = [], 0

    for name in names:
        path = os.path.join(args.out, safe_filename(name))
        if os.path.exists(path) and not args.force:
            if not args.quiet:
                print("skip (exists) %s" % path)
            continue
        rng = random.Random(sysrand.getrandbits(128) if args.random
                            else seed_for(name, args.seed))
        flag = make_flag(rng, args.width, height)
        flag.save(path)
        written += 1
        if args.sheet:
            images.append(flag)
        if not args.quiet:
            print("%s -> %s" % (name, path))

    if args.sheet and images:
        sheet = contact_sheet(images)
        sheet.save(args.sheet)
        if not args.quiet:
            print("contact sheet -> %s" % args.sheet)

    if not args.quiet:
        print("%d flag(s) written to %s/" % (written, args.out.rstrip("/")))
    return 0


if __name__ == "__main__":
    sys.exit(main())
