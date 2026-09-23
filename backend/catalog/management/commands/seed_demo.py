import io

from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand
from PIL import Image, ImageDraw, ImageFont

from catalog.models import Product, ProductImage, StoreSettings

DEMO_PRODUCTS = [
    ("Nike", "Air Force 1 '07", 45000, "#f5f5f0"),
    ("Nike", "Air Max 90", 52000, "#e8e4d8"),
    ("Adidas", "Samba OG", 39000, "#eeeeee"),
    ("Adidas", "Ultraboost Light", 68000, "#dedede"),
    ("New Balance", "550", 47000, "#f0ede4"),
    ("Puma", "Suede Classic", 33000, "#e6e6e6"),
    ("Jordan", "Air Jordan 1 Mid", 62000, "#f2efe9"),
    ("Converse", "Chuck 70", 29000, "#ece9e3"),
]


def make_placeholder(brand, name, bg_hex):
    img = Image.new("RGB", (800, 800), bg_hex)
    draw = ImageDraw.Draw(img)
    text = f"{brand}\n{name}"
    try:
        font = ImageFont.load_default(size=36)
    except TypeError:
        font = ImageFont.load_default()
    draw.multiline_text((60, 360), text, fill="#111111", font=font, spacing=10)
    buffer = io.BytesIO()
    img.save(buffer, format="JPEG", quality=85)
    buffer.seek(0)
    return buffer


class Command(BaseCommand):
    help = "Seed demo products and store settings for local development."

    def handle(self, *args, **options):
        settings_obj = StoreSettings.load()
        if not settings_obj.whatsapp_number:
            settings_obj.whatsapp_number = "2250700000000"
            settings_obj.save()
        self.stdout.write(self.style.SUCCESS(f"StoreSettings ready: {settings_obj}"))

        created_count = 0
        for brand, name, price, bg_hex in DEMO_PRODUCTS:
            product, created = Product.objects.get_or_create(
                brand=brand, name=name, defaults={"price": price, "active": True}
            )
            if created:
                created_count += 1
                buffer = make_placeholder(brand, name, bg_hex)
                image_file = ContentFile(buffer.read(), name=f"{brand}-{name}.jpg".replace(" ", "_"))
                ProductImage.objects.create(product=product, image=image_file, order=0)

        self.stdout.write(self.style.SUCCESS(f"Created {created_count} demo products."))
