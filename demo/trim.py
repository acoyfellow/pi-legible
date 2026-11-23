import sys
from PIL import Image

PADDING = 48
THRESHOLD = 12
LEFT_EDGE = 8


def last_content_row(image):
    background = image.getpixel((image.width // 2, image.height - 4))
    pixels = image.load()
    for y in range(image.height - 1, -1, -1):
        for x in range(LEFT_EDGE, image.width, 3):
            if sum(abs(a - b) for a, b in zip(pixels[x, y][:3], background[:3])) > THRESHOLD:
                return y
    return image.height - 1


for path in sys.argv[1:]:
    image = Image.open(path).convert("RGB")
    bottom = min(image.height, last_content_row(image) + PADDING)
    image.crop((LEFT_EDGE, 0, image.width, bottom)).save(path, optimize=True)
    print(path, image.width, bottom)
