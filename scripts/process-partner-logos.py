import os
import json
from PIL import Image, ImageChops

def autocrop_image(im, bgcolor=(255, 255, 255)):
    if im.mode == 'RGBA':
        alpha = im.split()[-1]
        bbox = alpha.getbbox()
        if bbox:
            cropped = im.crop(bbox)
            # Vérifier si l'image a encore des marges blanches
            bg = Image.new('RGBA', cropped.size, (255, 255, 255, 255))
            diff = ImageChops.difference(cropped.convert('RGB'), bg.convert('RGB'))
            diff_box = diff.getbbox()
            if diff_box:
                m = 6
                w, h = cropped.size
                b = (max(0, diff_box[0]-m), max(0, diff_box[1]-m), min(w, diff_box[2]+m), min(h, diff_box[3]+m))
                return cropped.crop(b)
            return cropped

    im_rgb = im.convert('RGB')
    bg = Image.new('RGB', im_rgb.size, bgcolor)
    diff = ImageChops.difference(im_rgb, bg)
    bbox = diff.getbbox()
    if bbox:
        m = 10
        w, h = im.size
        box = (max(0, bbox[0]-m), max(0, bbox[1]-m), min(w, bbox[2]+m), min(h, bbox[3]+m))
        return im.crop(box)
    return im

src_dir = 'logo partenaire lou ame tay'
out_dirs = ['images/partenaires', 'public/images/partenaires']

for d in out_dirs:
    os.makedirs(d, exist_ok=True)

targets = [
    ('hotel-residence-lat-dior.jpg', 'hotel-lat-dior.png', 'Hôtel Résidence Lat-Dior'),
    ('logo officiel Anima Pizza.jpg', 'anima-pizza.png', 'Anima Pizzeria'),
    ('LOGO SAMS prestige.jpg', 'sams-prestige.png', "SAM'S Prestige"),
    ('logo yummyfood copy.jpg', 'yummy-food.png', 'Yummy Food'),
    ('LOGO.jpg', 'ko-shop.png', 'KO SHOP'),
    ('logo evish.jpg', 'evish-fish.png', 'Evish Fish'),
    ('Artboard 10 copy 2.png', 'evish-market.png', 'Evish Market'),
    ('refonte logotype Pixel print pplus 2024.jpg', 'pixel-print-plus.png', 'Pixel Print Plus'),
    ('REFONTE LOGO_LOGO H NOIR ACHAR GROUPE.jpg', 'achar-groupe.png', 'Achar Groupe'),
    ('Copie de logo-developpement-durable.png', 'developpement-durable.png', 'Éco-Restaurateur Durable')
]

Image.MAX_IMAGE_PIXELS = None

processed = []
for src_name, out_name, label in targets:
    src_path = os.path.join(src_dir, src_name)
    if not os.path.exists(src_path):
        print(f"FICHIER INTROUVABLE: {src_path}")
        continue
    try:
        with Image.open(src_path) as img:
            cropped = autocrop_image(img)
            # Redimensionner harmonieusement (hauteur max 80, largeur max 220)
            cropped.thumbnail((220, 80), Image.Resampling.LANCZOS)
            for out_dir in out_dirs:
                dest = os.path.join(out_dir, out_name)
                cropped.save(dest, 'PNG', optimize=True)
            print(f"OK: {label} -> {out_name} (dimensions: {cropped.size})")
            processed.append({
                'nom': label,
                'logo_url': f"images/partenaires/{out_name}"
            })
    except Exception as e:
        print(f"ERREUR pour {src_name}: {e}")

print("\n--- CONFIGURATION PARTENAIRES GÉNÉRÉE ---")
print(json.dumps(processed, indent=2, ensure_ascii=False))
