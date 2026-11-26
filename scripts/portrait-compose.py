"""
portrait-compose.py: put a cut-out portrait onto the site's own background.

The About page's photo is not the raw headshot: its pale wall made it look
pasted onto a dark page. This takes a cut-out (transparent background, made
by portrait-cutout.swift with Apple's on-device Vision framework, so the
photo never leaves the machine) and composites it onto ink-1, the page's
exact background colour, with a slight grade towards the site's palette and
the shoulders faded into the ground. No glow or rim light behind the head:
it read as a halo. Every
edge pixel is the page colour, so the image has no visible frame.

    swift scripts/portrait-cutout.swift assets/harsh-rastogi-headshot.png /tmp/cutout.png
    python3 scripts/portrait-compose.py /tmp/cutout.png assets/harsh-rastogi-portrait.webp
"""
import sys
from PIL import Image, ImageFilter, ImageEnhance, ImageChops, ImageDraw

src = Image.open(sys.argv[1]).convert("RGBA")           # the cut-out, 720x720
out_path, W, H = sys.argv[2], 720, 900                  # 4:5, the shape the page shows

def hexrgb(h): h = h.lstrip("#"); return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))
INK1, INK2, INK3 = hexrgb("101112"), hexrgb("17181a"), hexrgb("1f2023")

# ---- ground: the page's own background, plain
ground = Image.new("RGB", (W, H), INK1)                 # the page's own background


# ---- subject: a little larger, anchored to the bottom edge
scale = 1.22
sub = src.resize((int(720 * scale), int(720 * scale)), Image.LANCZOS)
sx, sy = (W - sub.width) // 2 + 6, H - sub.height

# defringe: pull the alpha in a pixel and soften it, so no pale wall shows at the edge
a = sub.getchannel("A").filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.8))

# grade: slightly less saturated, a touch cooler and darker, so it sits in the palette
rgb = sub.convert("RGB")
rgb = ImageEnhance.Color(rgb).enhance(0.86)
rgb = ImageEnhance.Contrast(rgb).enhance(1.04)
r, g, b = rgb.split()
r = r.point(lambda v: int(v * 0.97)); b = b.point(lambda v: min(255, int(v * 1.03 + 2)))
rgb = Image.merge("RGB", (r, g, b))
rgb = ImageEnhance.Brightness(rgb).enhance(0.95)


# fade the shoulders into the ground over the bottom of the frame
fade = Image.linear_gradient("L").resize((sub.width, sub.height)).point(
    lambda v: 255 if v < 150 else int(255 * max(0.0, 1 - (v - 150) / 105) ** 1.4))
a = ImageChops.multiply(a, fade)

canvas = ground.copy()
canvas.paste(rgb, (sx, sy), a)

# a soft vignette so the edges settle into the page
vig = Image.radial_gradient("L").resize((int(W * 1.5), int(H * 1.5))).crop(
    (int(W * 0.25), int(H * 0.25), int(W * 1.25), int(H * 1.25))).point(lambda v: int(min(255, max(0, (v - 120) * 1.4)) * 0.55))
canvas = Image.composite(Image.new("RGB", (W, H), INK1), canvas, vig)

canvas.save(out_path, "WEBP", quality=84, method=6)
print(out_path, canvas.size)
