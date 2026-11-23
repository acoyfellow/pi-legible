import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

DOCS = Path(sys.argv[1])
WIDTH = 880
HOLD_MS = 2600
FADE_FRAMES = 8
FADE_MS = 45
BACKGROUND = (30, 30, 30)
LABELS = {"without": ("without pi-legible", (120, 120, 120)), "with": ("with pi-legible", (243, 128, 32))}
FONT_PATHS = ["/System/Library/Fonts/SFNSMono.ttf", "/System/Library/Fonts/Menlo.ttc"]


def font(size):
    for path in FONT_PATHS:
        if Path(path).exists():
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def scaled(name, height):
    image = Image.open(DOCS / f"{name}.png").convert("RGB")
    image = image.resize((WIDTH, round(image.height * WIDTH / image.width)), Image.LANCZOS)
    canvas = Image.new("RGB", (WIDTH, height), BACKGROUND)
    canvas.paste(image, (0, 0))
    return canvas


def labelled(image, name):
    text, color = LABELS[name]
    draw = ImageDraw.Draw(image)
    label_font = font(22)
    box = draw.textbbox((0, 0), text, font=label_font)
    x = WIDTH - (box[2] - box[0]) - 28
    y = image.height - (box[3] - box[1]) - 28
    draw.rounded_rectangle((x - 14, y - 10, x + box[2] - box[0] + 14, y + box[3] - box[1] + 14), radius=10, fill=(20, 20, 20), outline=color, width=2)
    draw.text((x, y), text, font=label_font, fill=color)
    return image


def side_by_side_height():
    heights = []
    for name in LABELS:
        image = Image.open(DOCS / f"{name}.png")
        heights.append(round(image.height * WIDTH / image.width))
    return max(heights)


height = side_by_side_height()
without = labelled(scaled("without", height), "without")
with_legible = labelled(scaled("with", height), "with")

frames = [without]
durations = [HOLD_MS]
for step in range(1, FADE_FRAMES):
    frames.append(Image.blend(without, with_legible, step / FADE_FRAMES))
    durations.append(FADE_MS)
frames.append(with_legible)
durations.append(HOLD_MS + 800)
for step in range(1, FADE_FRAMES):
    frames.append(Image.blend(with_legible, without, step / FADE_FRAMES))
    durations.append(FADE_MS)

palette_source = Image.new("RGB", (WIDTH, height * 2))
palette_source.paste(without, (0, 0))
palette_source.paste(with_legible, (0, height))
palette = palette_source.quantize(colors=128, method=Image.Quantize.MEDIANCUT)
quantized = [frame.quantize(palette=palette, dither=Image.Dither.NONE) for frame in frames]
quantized[0].save(DOCS / "hero.gif", save_all=True, append_images=quantized[1:], duration=durations, loop=0, optimize=True, disposal=1)

pad_height = max(Image.open(DOCS / f"{name}.png").height for name in LABELS)
for name in LABELS:
    image = Image.open(DOCS / f"{name}.png").convert("RGB")
    if image.height < pad_height:
        canvas = Image.new("RGB", (image.width, pad_height), BACKGROUND)
        canvas.paste(image, (0, 0))
        canvas.save(DOCS / f"{name}.png", optimize=True)

print((DOCS / "hero.gif").stat().st_size, "bytes", len(frames), "frames")
