from django.core.exceptions import ValidationError
from django.db import models


class Product(models.Model):
    brand = models.CharField("Marque", max_length=100)
    name = models.CharField("Nom", max_length=200)
    price = models.PositiveIntegerField("Prix", help_text="Prix avec coffret")
    active = models.BooleanField("Actif", default=True)
    created_at = models.DateTimeField("Date de creation", auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "produit"
        verbose_name_plural = "produits"

    def __str__(self):
        return f"{self.brand} {self.name}"

    def save(self, *args, **kwargs):
        # Normalize casing so "ADIDAS" and "Adidas" don't become two
        # distinct filter options on the storefront.
        self.brand = self.brand.strip().title()
        super().save(*args, **kwargs)


class ProductImage(models.Model):
    product = models.ForeignKey(
        Product, related_name="images", on_delete=models.CASCADE, verbose_name="Produit"
    )
    image = models.ImageField("Image", upload_to="products/")
    order = models.PositiveIntegerField("Ordre d'affichage", default=0)

    class Meta:
        ordering = ["order", "id"]
        verbose_name = "image produit"
        verbose_name_plural = "images produit"

    def __str__(self):
        return f"Image #{self.order} - {self.product}"


class StoreSettings(models.Model):
    store_name = models.CharField("Nom de la boutique", max_length=100, default="NovaSneak")
    whatsapp_number = models.CharField(
        "Numero WhatsApp",
        max_length=20,
        help_text="Format international sans '+', ex: 2250700000000",
    )
    box_discount = models.PositiveIntegerField(
        "Remise sans coffret",
        default=1000,
        help_text="Remise appliquee si le client ne prend pas le coffret",
    )
    currency = models.CharField("Devise", max_length=10, default="FCFA")
    size_min = models.PositiveIntegerField("Pointure minimum", default=37)
    size_max = models.PositiveIntegerField("Pointure maximum", default=47)

    class Meta:
        verbose_name = "Parametres de la boutique"
        verbose_name_plural = "Parametres de la boutique"

    def __str__(self):
        return self.store_name

    def clean(self):
        if self.size_min > self.size_max:
            raise ValidationError("size_min doit etre inferieur ou egal a size_max.")

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        pass

    @classmethod
    def load(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj


class Order(models.Model):
    created_at = models.DateTimeField("Date de la commande", auto_now_add=True)
    total = models.PositiveIntegerField("Total")
    currency = models.CharField("Devise", max_length=10, default="FCFA")

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "commande"
        verbose_name_plural = "commandes"

    def __str__(self):
        return f"Commande #{self.pk} - {self.total} {self.currency}"


class OrderItem(models.Model):
    order = models.ForeignKey(
        Order, related_name="items", on_delete=models.CASCADE, verbose_name="Commande"
    )
    product = models.ForeignKey(
        Product,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="order_items",
        verbose_name="Produit",
    )
    brand = models.CharField("Marque", max_length=100)
    name = models.CharField("Nom", max_length=200)
    unit_price = models.PositiveIntegerField("Prix unitaire")
    size = models.PositiveIntegerField("Pointure")
    with_box = models.BooleanField("Avec coffret", default=True)
    quantity = models.PositiveIntegerField("Quantite", default=1)
    color_note = models.CharField("Couleur souhaitee", max_length=200, blank=True)

    class Meta:
        verbose_name = "article commande"
        verbose_name_plural = "articles commande"

    def __str__(self):
        return f"{self.brand} {self.name} x{self.quantity}"
