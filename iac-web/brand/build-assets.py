"""Rebuild pixel-derived Yrys assets. Run from iac-web after pnpm install.
python3 -m venv .brand-venv && .brand-venv/bin/pip install -r brand/requirements.txt
.brand-venv/bin/python brand/build-assets.py
"""
from pathlib import Path
from io import BytesIO
import json
from PIL import Image, ImageDraw, ImageFont
from fontTools.ttLib import TTFont
from fontTools.merge import Merger

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public'
BRAND = OUT / 'brand'
BRAND.mkdir(exist_ok=True)
BRAND_BLUE = '#3C82F6'
PAPER = '#F6F7F5'


def trim(image):
    return image.crop(image.getchannel('A').getbbox())


stacked_source = Image.open(ROOT / 'brand/source/yrys-logo-stacked.png').convert('RGBA')
# Approved visible-body ROI; excludes the isolated alpha=1 dot at y=49.
# Keep the supplied source byte-identical and all other trim rules unchanged.
horizontal = Image.open(ROOT / 'brand/source/yrys-logo-horizontal.png').convert('RGBA').crop((144, 70, 1831, 611))
stacked = trim(stacked_source)
# First connected band of nonempty alpha rows is the complete emblem; no tracing.
mark = trim(stacked_source.crop((0, 8, stacked_source.width, 720)))


def white(image):
    result = Image.new('RGBA', image.size, 'white')
    result.putalpha(image.getchannel('A'))
    return result


for name, source in [('horizontal', horizontal), ('stacked', stacked), ('mark', mark)]:
    for suffix, image in [('', source), ('-white', white(source))]:
        image.save(BRAND / f'yrys-{name}{suffix}.png', optimize=True)
        image.save(BRAND / f'yrys-{name}{suffix}.webp', lossless=True, exact=True)
        # Native source above retains every pixel; explicit 1x/2x display derivatives.
        height = {'horizontal': 32, 'stacked': 104, 'mark': 28}[name]
        for scale in [1, 2]:
            size = (round(image.width * height * scale / image.height), height * scale)
            image.resize(size, Image.Resampling.LANCZOS).save(BRAND / f'yrys-{name}{suffix}@{scale}x.png')


def tile(size, rounded=True):
    result = Image.new('RGBA', (size, size), BRAND_BLUE)
    # Full bleed blue for opaque Apple and maskable icons. Corners are drawn by OS.
    emblem = white(mark)
    emblem.thumbnail((round(size * .64), round(size * .64)), Image.Resampling.LANCZOS)
    result.alpha_composite(emblem, ((size-emblem.width)//2, (size-emblem.height)//2))
    if rounded:
        mask = Image.new('L', (size,size)); ImageDraw.Draw(mask).rounded_rectangle((0,0,size-1,size-1), radius=round(size*.18), fill=255)
        result.putalpha(mask)
    return result


for filename, size in [('favicon-16.png',16), ('favicon-32.png',32), ('favicon.png',256), ('apple-touch-icon.png',180), ('icon-192.png',192), ('icon-512.png',512), ('icon-maskable-512.png',512)]:
    tile(size, rounded=filename not in ['apple-touch-icon.png','icon-maskable-512.png']).save(OUT / filename)
tile(256, rounded=False).save(OUT / 'favicon.ico', sizes=[(16,16),(32,32),(48,48)])

# Use the exact installed Golos outlines. Merge subsets so Cyrillic, Kazakh and
# Latin in the same caption cannot fall back to a machine-specific font.
font_dir = ROOT / 'node_modules/@fontsource-variable/golos-text/files'
fonts = []
for subset in ['latin', 'cyrillic', 'cyrillic-ext']:
    font = TTFont(font_dir / f'golos-text-{subset}-wght-normal.woff2')
    from fontTools.varLib.instancer import instantiateVariableFont
    font = instantiateVariableFont(font, {'wght':600}, inplace=True)
    font.flavor = None
    target = BytesIO(); font.save(target); target.seek(0); fonts.append(target)
merged = Merger().merge(fonts)
font_bytes = BytesIO(); merged.save(font_bytes)
for lang, caption in [('ru','Подготовка к IELTS онлайн'), ('kk','IELTS-ке онлайн дайындық')]:
    canvas = Image.new('RGB',(1200,630),PAPER)
    logo = stacked.copy(); logo.thumbnail((400,360),Image.Resampling.LANCZOS)
    canvas.paste(logo,(92,(630-logo.height)//2),logo)
    draw=ImageDraw.Draw(canvas)
    # A single real text line, with room to breathe on the right.
    heading=ImageFont.truetype(BytesIO(font_bytes.getvalue()),30)
    domain=ImageFont.truetype(BytesIO(font_bytes.getvalue()),23)
    draw.text((490,265),caption,font=heading,fill='#17191C')
    draw.text((490,322),'ielts.yrys.academy',font=domain,fill='#5E6468')
    canvas.save(OUT / ('og-yrys.png' if lang=='ru' else 'og-yrys-kk.png'))

# BASE_URL is /app/ in vite.config.ts; preserve the application's deployment scope.
(OUT / 'manifest.webmanifest').write_text(json.dumps({
    'name':'Yrys Academy','short_name':'Yrys','start_url':'/app/','scope':'/app/',
    'display':'standalone','background_color':PAPER,'theme_color':BRAND_BLUE,
    'icons':[{'src':f'icon-{size}.png','sizes':f'{size}x{size}','type':'image/png'} for size in [192,512]] + [{'src':'icon-maskable-512.png','sizes':'512x512','type':'image/png','purpose':'maskable'}]
}, indent=2)+'\n')
