from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import math
import random
import shutil
import subprocess

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "chalkboard-promo.mp4"
FRAMES = ROOT / "chalkboard_promo_frames"

W, H = 1920, 1080
FPS = 30
DURATION = 24


def font(size, bold=False):
    candidates = [
        "C:/Windows/Fonts/segoeuib.ttf" if bold else "C:/Windows/Fonts/segoeui.ttf",
        "C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf",
    ]
    for candidate in candidates:
        if Path(candidate).exists():
            return ImageFont.truetype(candidate, size)
    return ImageFont.load_default()


F = {
    "hero": font(78, True),
    "h1": font(48, True),
    "h2": font(32, True),
    "body": font(25),
    "small": font(20),
    "tiny": font(16),
}


def clamp(value, a=0, b=1):
    return max(a, min(b, value))


def ease(value):
    value = clamp(value)
    return 0.5 - 0.5 * math.cos(math.pi * value)


def lerp(a, b, t):
    return a + (b - a) * t


def stage_progress(t, start, end):
    return ease((t - start) / (end - start))


def rgba(hex_color, alpha):
    hex_color = hex_color.lstrip("#")
    return tuple(int(hex_color[i : i + 2], 16) for i in (0, 2, 4)) + (alpha,)


def rounded(draw, xy, r, fill, outline=None, width=1):
    draw.rounded_rectangle(xy, radius=r, fill=fill, outline=outline, width=width)


def draw_text(draw, xy, value, fill="#f8f1d0", f="body", anchor=None, align="left"):
    draw.text(xy, value, fill=fill, font=F[f], anchor=anchor, align=align)


def background(frame):
    img = Image.new("RGB", (W, H), "#10110e")
    pix = img.load()
    rng = random.Random(17)
    for _ in range(16000):
        x = rng.randrange(W)
        y = rng.randrange(H)
        base = pix[x, y]
        d = rng.randrange(-8, 10)
        pix[x, y] = tuple(max(0, min(255, c + d)) for c in base)
    draw = ImageDraw.Draw(img, "RGBA")
    for y in range(0, H, 54):
        draw.line((0, y, W, y), fill=(255, 255, 255, 8), width=1)
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow, "RGBA")
    gd.ellipse((-260, -260, 760, 520), fill=(42, 126, 107, 70))
    gd.ellipse((1320, 30, 2300, 900), fill=(214, 179, 95, 42))
    glow = glow.filter(ImageFilter.GaussianBlur(120))
    return Image.alpha_composite(img.convert("RGBA"), glow)


def make_board_surface(w, h, strokes=None, guide=None, reveal=1):
    surface = Image.new("RGBA", (w, h), "#103c34")
    rng = random.Random(29)
    pix = surface.load()
    for _ in range(w * h // 20):
        x = rng.randrange(w)
        y = rng.randrange(h)
        r, g, b, a = pix[x, y]
        d = rng.randrange(-14, 14)
        pix[x, y] = (max(0, min(255, r + d)), max(0, min(255, g + d)), max(0, min(255, b + d)), a)
    d = ImageDraw.Draw(surface, "RGBA")
    for x in range(80, w, 150):
        d.line((x + rng.randrange(-4, 4), 0, x + rng.randrange(-4, 4), h), fill=(255, 255, 255, 14), width=1)
    for y in range(80, h, 120):
        d.line((0, y + rng.randrange(-3, 3), w, y + rng.randrange(-3, 3)), fill=(255, 255, 255, 12), width=1)

    if guide:
        draw_guide(d, w, h, guide)
    if strokes:
        for stroke in strokes:
            draw_chalk_path(surface, stroke["points"], stroke["color"], stroke.get("size", 15), min(reveal, stroke.get("reveal", 1)))
    return surface


def draw_guide(draw, w, h, kind):
    color = (244, 239, 214, 78)
    if kind == "letter":
        draw.line((w * 0.34, h * 0.76, w * 0.5, h * 0.2, w * 0.66, h * 0.76), fill=color, width=18, joint="curve")
        draw.line((w * 0.42, h * 0.55, w * 0.58, h * 0.55), fill=color, width=16)
        for y in (0.2, 0.55, 0.76):
            draw.ellipse((w * 0.49 - 10, h * y - 10, w * 0.49 + 10, h * y + 10), outline=(244, 239, 214, 96), width=4)
    if kind == "cat":
        draw.arc((w * 0.34, h * 0.3, w * 0.66, h * 0.72), 0, 360, fill=color, width=16)
        draw.line((w * 0.39, h * 0.36, w * 0.42, h * 0.18, w * 0.5, h * 0.32), fill=color, width=14)
        draw.line((w * 0.61, h * 0.36, w * 0.58, h * 0.18, w * 0.5, h * 0.32), fill=color, width=14)
        draw.ellipse((w * 0.43, h * 0.46, w * 0.46, h * 0.49), fill=color)
        draw.ellipse((w * 0.54, h * 0.46, w * 0.57, h * 0.49), fill=color)
        draw.arc((w * 0.45, h * 0.52, w * 0.55, h * 0.62), 20, 160, fill=color, width=8)


def partial_points(points, progress):
    if progress >= 1:
        return points
    total = 0
    lengths = []
    for a, b in zip(points, points[1:]):
        l = math.hypot(b[0] - a[0], b[1] - a[1])
        lengths.append(l)
        total += l
    target = total * clamp(progress)
    out = [points[0]]
    walked = 0
    for idx, l in enumerate(lengths):
        a, b = points[idx], points[idx + 1]
        if walked + l <= target:
            out.append(b)
            walked += l
        else:
            local = 0 if l == 0 else (target - walked) / l
            out.append((lerp(a[0], b[0], local), lerp(a[1], b[1], local)))
            break
    return out


def draw_chalk_path(img, points, color="#f3f0de", size=14, progress=1):
    pts = partial_points(points, progress)
    if len(pts) < 2:
        return
    overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay, "RGBA")
    rng = random.Random(len(points) * 43 + int(size * 11))
    for width, alpha, jitter_scale in [(int(size * 1.1), 96, 1.2), (int(size * 0.48), 185, 0.7)]:
        jittered = [(x + rng.uniform(-jitter_scale, jitter_scale), y + rng.uniform(-jitter_scale, jitter_scale)) for x, y in pts]
        d.line(jittered, fill=rgba(color, alpha), width=max(1, width), joint="curve")
    for a, b in zip(pts, pts[1:]):
        length = math.hypot(b[0] - a[0], b[1] - a[1])
        specks = max(2, min(18, int(length / 18)))
        for _ in range(specks):
            tt = rng.random()
            x = lerp(a[0], b[0], tt) + rng.uniform(-size * 0.7, size * 0.7)
            y = lerp(a[1], b[1], tt) + rng.uniform(-size * 0.7, size * 0.7)
            r = rng.uniform(1.0, 2.6)
            d.ellipse((x - r, y - r, x + r, y + r), fill=rgba(color, rng.randrange(25, 80)))
    img.alpha_composite(overlay)


def paste_shadow(base, box, radius=32, alpha=120):
    shadow = Image.new("RGBA", base.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(shadow, "RGBA")
    d.rounded_rectangle(box, radius=18, fill=(0, 0, 0, alpha))
    shadow = shadow.filter(ImageFilter.GaussianBlur(radius))
    base.alpha_composite(shadow)


def draw_board(base, x, y, w, h, strokes=None, guide=None, reveal=1, scale=1):
    x, y, w, h = int(x), int(y), int(w), int(h)
    paste_shadow(base, (x - 28, y - 20, x + w + 28, y + h + 90), 34, 150)
    d = ImageDraw.Draw(base, "RGBA")
    frame = 28
    d.rounded_rectangle((x - frame, y - frame, x + w + frame, y + h + frame), radius=18, fill="#6d4324")
    d.rounded_rectangle((x - 4, y - 4, x + w + 4, y + h + 4), radius=8, fill="#11241f")
    surface = make_board_surface(w, h, strokes=strokes, guide=guide, reveal=reveal)
    base.alpha_composite(surface, (x, y))
    d.rounded_rectangle((x - 42, y + h + 18, x + w + 42, y + h + 48), radius=10, fill="#8c5e31")
    draw_chalk_stick(d, x + 90, y + h + 30, "#f3f0de", 0)
    draw_chalk_stick(d, x + 178, y + h + 29, "#f8d56b", -4)
    draw_chalk_stick(d, x + 264, y + h + 31, "#76a9fa", 4)
    draw_chalk_box(d, x + w - 270, y + h + 26)
    rounded(d, (x + w - 120, y + h + 18, x + w - 30, y + h + 50), 12, "#2b2923")


def draw_chalk_stick(draw, cx, cy, color, angle=0, length=92):
    # Axis-aligned capsule; the shadow/tilt is enough for promo scale.
    draw.rounded_rectangle((cx - length / 2 + 3, cy - 8 + 5, cx + length / 2 + 3, cy + 8 + 5), radius=8, fill=(0, 0, 0, 60))
    draw.rounded_rectangle((cx - length / 2, cy - 8, cx + length / 2, cy + 8), radius=8, fill=color)
    draw.line((cx - length / 2 + 8, cy - 4, cx + length / 2 - 8, cy - 4), fill=(255, 255, 255, 100), width=2)


def draw_chalk_box(draw, x, y):
    rounded(draw, (x, y - 22, x + 134, y + 30), 12, "#d4b86c", "#f3dfa0", 2)
    rounded(draw, (x + 18, y - 10, x + 116, y + 18), 7, "#2e250c")
    draw_text(draw, (x + 67, y + 4), "CHALK", "#fff5bc", "tiny", anchor="mm")
    for i, color in enumerate(["#f3f0de", "#f8d56b", "#76a9fa"]):
        draw_chalk_stick(draw, x + 38 + i * 28, y - 24, color, length=46)


def topbar(base, t):
    d = ImageDraw.Draw(base, "RGBA")
    rounded(d, (54, 42, W - 54, 126), 18, (24, 25, 20, 210), (238, 224, 170, 50))
    rounded(d, (80, 62, 126, 108), 10, "#0e4a3d", "#9ad7c1", 2)
    d.line((91, 96, 116, 70), fill="#f3f0de", width=4)
    draw_text(d, (148, 58), "Chalkboard", "#fff7d3", "h2")
    draw_text(d, (150, 94), "3D chalk sketching for kids, classrooms, and ideas", "#aeb8a1", "small")
    tools = ["✎", "╱", "↗", "▭", "○", "⌫"]
    for i, tool in enumerate(tools):
        x = 650 + i * 58
        active = i == 0
        rounded(d, (x, 62, x + 42, 104), 9, (215, 194, 122, 48 if active else 12), (215, 194, 122, 120 if active else 42))
        draw_text(d, (x + 21, 83), tool, "#fff7d3", "small", anchor="mm")
    rounded(d, (1134, 62, 1266, 104), 10, (246, 242, 232, 16), (215, 194, 122, 46))
    draw_text(d, (1200, 83), "Boards", "#fff7d3", "small", anchor="mm")
    rounded(d, (1286, 62, 1444, 104), 10, (246, 242, 232, 16), (215, 194, 122, 46))
    draw_text(d, (1365, 83), "Guides", "#fff7d3", "small", anchor="mm")
    rounded(d, (1570, 62, 1816, 104), 12, "#d7c27a", None)
    draw_text(d, (1693, 83), "Export PNG", "#15130c", "small", anchor="mm")


def callout(base, t, title, body="", x=None, y=None):
    d = ImageDraw.Draw(base, "RGBA")
    bar_h = 96
    top = H - bar_h - 28
    rounded(d, (W // 2 - 520, top, W // 2 + 520, top + bar_h), 18, (19, 20, 17, 230), (215, 194, 122, 60))
    draw_text(d, (W // 2, top + 32), title, "#fff7d3", "h2", anchor="mm")
    if body:
        draw_text(d, (W // 2, top + 66), body, "#d2d4c4", "small", anchor="mm")


def draw_cursor(base, x, y):
    d = ImageDraw.Draw(base, "RGBA")
    d.polygon([(x, y), (x + 22, y + 66), (x + 36, y + 42), (x + 64, y + 42)], fill=(255, 255, 255, 245), outline=(20, 20, 16, 220))


def draw_palette(base, progress):
    if progress <= 0:
        return
    d = ImageDraw.Draw(base, "RGBA")
    y = int(884 + (1 - progress) * 180)
    x = 555
    rounded(d, (x, y, x + 810, y + 150), 18, (20, 21, 18, 235), (215, 194, 122, 65))
    draw_text(d, (x + 28, y + 22), "Chalk Box", "#fff7d3", "h2")
    colors = ["#f3f0de", "#f8d56b", "#f2a65a", "#e86f61", "#f5a3b7", "#a78bfa", "#76a9fa", "#5fd4e8", "#9bd5c3", "#8fd16a"]
    for i, color in enumerate(colors):
        cx = x + 42 + i * 72
        draw_chalk_stick(d, cx, y + 94, color, length=56)


def overview_scene(base, progress):
    d = ImageDraw.Draw(base, "RGBA")
    base.alpha_composite(Image.new("RGBA", (W, H), (0, 0, 0, int(90 * progress))))
    draw_text(d, (W // 2, 168), "Zoom out. Pick a board.", "#fff7d3", "h1", anchor="mm")
    boards = [
        (-570, -118, 0.92, "#f3f0de"),
        (0, -140, 1.0, "#76a9fa"),
        (570, -118, 0.92, "#f8d56b"),
        (-310, 210, 0.86, "#f5a3b7"),
        (310, 210, 0.86, "#9bd5c3"),
    ]
    for idx, (ox, oy, depth, color) in enumerate(boards):
        local = clamp((progress - idx * 0.06) / 0.72)
        s = depth * (0.66 + 0.18 * ease(local))
        bw, bh = int(286 * s), int(161 * s)
        x = W // 2 + int(ox * s) - bw // 2
        y = 418 + int(oy * s) - bh // 2
        strokes = [{"points": [(70, 100), (145, 72), (245, 122), (300, 86)], "color": color, "size": 10}]
        draw_board(base, x, y, bw, bh, strokes=strokes, reveal=1)
        draw_text(d, (x + bw // 2, y + bh + 72), f"Board {idx + 1}", "#fff7d3", "small", anchor="mm")


def draw_intro(base, t):
    d = ImageDraw.Draw(base, "RGBA")
    topbar(base, t)
    p = stage_progress(t, 0.2, 1.5)
    draw_board(base, 348, int(236 - 40 * (1 - p)), 1224, 688)
    draw_text(d, (W // 2, 404), "A realistic 3D chalkboard", "#fff7d3", "hero", anchor="mm")
    draw_text(d, (W // 2, 492), "Sketch, teach, trace, and explore.", "#d7d5c2", "h2", anchor="mm")


def draw_live_chalk(base, t):
    topbar(base, t)
    progress = stage_progress(t, 3.2, 6.2)
    strokes = [
        {"points": [(240, 490), (365, 210), (500, 490)], "color": "#f3f0de", "size": 20, "reveal": progress},
        {"points": [(300, 372), (438, 372)], "color": "#f3f0de", "size": 18, "reveal": max(0, progress - 0.45) / 0.55},
        {"points": [(690, 455), (815, 265), (960, 455), (1080, 260)], "color": "#76a9fa", "size": 18, "reveal": max(0, progress - 0.22) / 0.78},
    ]
    draw_board(base, 348, 210, 1224, 688, strokes=strokes, guide="letter", reveal=1)
    callout(base, t, "Live chalk drawing", "Dusty strokes, shapes, arrows, and eraser.")
    cx = lerp(480, 1200, progress)
    cy = 610 + math.sin(progress * math.pi * 2) * 50
    draw_cursor(base, int(cx), int(cy))


def draw_guides(base, t):
    topbar(base, t)
    p = stage_progress(t, 7.0, 9.5)
    strokes = [{"points": [(480, 520), (610, 350), (770, 520), (900, 380), (1040, 520)], "color": "#f8d56b", "size": 16, "reveal": p}]
    draw_board(base, 348, 210, 1224, 688, strokes=strokes, guide="cat", reveal=1)
    d = ImageDraw.Draw(base, "RGBA")
    rounded(d, (1248, 184, 1600, 430), 18, (20, 21, 18, 230), (215, 194, 122, 65))
    draw_text(d, (1280, 216), "Guide Library", "#fff7d3", "h2")
    for i, name in enumerate(["Letters", "Animals", "Nature", "Shapes"]):
        rounded(d, (1280, 270 + i * 38, 1538, 302 + i * 38), 8, (215, 194, 122, 40 if i == 1 else 16), (215, 194, 122, 50))
        draw_text(d, (1300, 275 + i * 38), name, "#e8dfbf", "small")
    callout(base, t, "Transparent tracing guides", "Letters, animals, nature, and shapes.")


def draw_box(base, t):
    topbar(base, t)
    p = stage_progress(t, 10.0, 12.5)
    strokes = [{"points": [(300, 420), (490, 250), (680, 420), (860, 300), (1040, 418)], "color": "#e86f61", "size": 17, "reveal": 1}]
    draw_board(base, 348, 210, 1224, 688, strokes=strokes, reveal=1)
    draw_palette(base, p)
    callout(base, t, "Open the chalk box", "Pick real-looking colored chalk sticks.")
    draw_cursor(base, int(1348 - 340 * p), int(910 - 110 * p))


def draw_boards(base, t):
    topbar(base, t)
    overview_scene(base, stage_progress(t, 13.0, 15.7))
    callout(base, t, "Multiple boards", "Add, browse, and jump between boards.")


def draw_persist_clear(base, t):
    topbar(base, t)
    p = stage_progress(t, 16.0, 18.8)
    strokes = [] if p > 0.62 else [{"points": [(330, 480), (530, 285), (740, 480), (930, 335)], "color": "#9bd5c3", "size": 18, "reveal": 1}]
    draw_board(base, 348, 210, 1224, 688, strokes=strokes, reveal=1)
    d = ImageDraw.Draw(base, "RGBA")
    rounded(d, (1290, 64, 1340, 114), 10, (232, 111, 97, 48), (232, 111, 97, 140))
    draw_text(d, (1315, 89), "⌧", "#ffc9bf", "small", anchor="mm")
    if p > 0.45:
        rounded(d, (690, 410, 1230, 560), 18, (20, 21, 18, 240), (232, 111, 97, 95))
        draw_text(d, (960, 448), "Clear chalk from all boards?", "#fff7d3", "h2", anchor="mm")
        rounded(d, (790, 498, 930, 538), 10, (246, 242, 232, 24), (215, 194, 122, 60))
        rounded(d, (980, 498, 1118, 538), 10, "#d7c27a")
        draw_text(d, (860, 518), "Cancel", "#d7d5c2", "small", anchor="mm")
        draw_text(d, (1049, 518), "Clear", "#15130c", "small", anchor="mm")
    callout(base, t, "Autosave + clear all", "Local persistence with a protected wipe action.")


def draw_outro(base, t):
    d = ImageDraw.Draw(base, "RGBA")
    p = stage_progress(t, 19.8, 22.0)
    draw_board(base, 470, 195, 980, 552, strokes=[{"points": [(220, 350), (430, 180), (650, 350), (780, 220)], "color": "#f8d56b", "size": 20}], reveal=1)
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, int(120 * p)))
    base.alpha_composite(overlay)
    draw_text(d, (W // 2, 414), "Chalkboard", "#fff7d3", "hero", anchor="mm")
    draw_text(d, (W // 2, 512), "A playful 3D drawing space.", "#d7d5c2", "h2", anchor="mm")
    rounded(d, (760, 604, 1160, 666), 16, "#d7c27a")
    draw_text(d, (960, 635), "Draw. Guide. Explore.", "#15130c", "h2", anchor="mm")


def draw_frame(frame):
    t = frame / FPS
    base = background(frame)
    if t < 3.0:
        draw_intro(base, t)
    elif t < 6.8:
        draw_live_chalk(base, t)
    elif t < 9.8:
        draw_guides(base, t)
    elif t < 12.8:
        draw_box(base, t)
    elif t < 15.9:
        draw_boards(base, t)
    elif t < 19.6:
        draw_persist_clear(base, t)
    else:
        draw_outro(base, t)

    d = ImageDraw.Draw(base, "RGBA")
    d.rectangle((0, H - 8, int(W * frame / (FPS * DURATION)), H), fill="#d7c27a")
    return base.convert("RGB")


def main():
    if FRAMES.exists():
        shutil.rmtree(FRAMES)
    FRAMES.mkdir(parents=True, exist_ok=True)

    total = FPS * DURATION
    for i in range(total):
        draw_frame(i).save(FRAMES / f"frame_{i:04d}.jpg", quality=92)
        if i % 60 == 0:
            print(f"rendered {i}/{total}")

    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-framerate",
            str(FPS),
            "-i",
            str(FRAMES / "frame_%04d.jpg"),
            "-f",
            "lavfi",
            "-i",
            "anullsrc=channel_layout=stereo:sample_rate=44100",
            "-shortest",
            "-c:v",
            "libx264",
            "-preset",
            "medium",
            "-crf",
            "18",
            "-pix_fmt",
            "yuv420p",
            "-c:a",
            "aac",
            "-b:a",
            "128k",
            "-movflags",
            "+faststart",
            str(OUT),
        ],
        check=True,
    )
    print(OUT)


if __name__ == "__main__":
    main()
