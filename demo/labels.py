import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

OUT = Path(sys.argv[1])
WIDTH = int(sys.argv[2])
HEIGHT = int(sys.argv[3])
BACKGROUND = (30, 30, 30)
LABELS = {"without": ("without pi-legible", (138, 138, 138)), "with": ("with pi-legible", (243, 128, 32))}
FONT_PATHS = ["/System/Library/Fonts/SFNSMono.ttf", "/System/Library/Fonts/Menlo.ttc"]


def font(size):
    for path in FONT_PATHS:
        if Path(path).exists():
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


label_font = font(26)
for name, (text, color) in LABELS.items():
    image = Image.new("RGB", (WIDTH, HEIGHT), BACKGROUND)
    draw = ImageDraw.Draw(image)
    box = draw.textbbox((0, 0), text, font=label_font)
    draw.text((24, (HEIGHT - (box[3] - box[1])) // 2 - box[1]), text, font=label_font, fill=color)
    image.save(OUT / f"label-{name}.png")
