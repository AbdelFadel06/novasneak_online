from django.contrib import admin
from django.utils.html import format_html

from .models import Order, OrderItem, Product, ProductImage, StoreSettings


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 3
    fields = ("image", "order", "preview")
    readonly_fields = ("preview",)

    def preview(self, obj):
        if obj.pk and obj.image:
            return format_html('<img src="{}" style="height:60px;" />', obj.image.url)
        return "-"

    preview.short_description = "Apercu"


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("thumbnail", "brand", "name", "price", "active_toggle", "created_at")
    list_display_links = ("thumbnail", "name")
    list_filter = ("brand", "active")
    search_fields = ("brand", "name")
    inlines = [ProductImageInline]
    actions = ["make_active", "make_inactive"]

    def thumbnail(self, obj):
        first_image = obj.images.first()
        if first_image:
            return format_html('<img src="{}" style="height:40px;" />', first_image.image.url)
        return "-"

    thumbnail.short_description = ""

    def active_toggle(self, obj):
        from django.urls import reverse

        color = "#16a34a" if obj.active else "#dc2626"
        label = "Actif" if obj.active else "Inactif"
        url = reverse("admin:catalog_product_toggle_active", args=[obj.pk])
        return format_html(
            '<a href="{}" style="color:{};font-weight:bold;text-decoration:none;">{}</a>',
            url,
            color,
            label,
        )

    active_toggle.short_description = "Statut"

    def get_urls(self):
        from django.urls import path

        urls = super().get_urls()
        custom = [
            path(
                "<int:pk>/toggle-active/",
                self.admin_site.admin_view(self.toggle_active),
                name="catalog_product_toggle_active",
            ),
        ]
        return custom + urls

    def toggle_active(self, request, pk):
        from django.http import HttpResponseRedirect
        from django.urls import reverse

        product = Product.objects.get(pk=pk)
        product.active = not product.active
        product.save(update_fields=["active"])
        return HttpResponseRedirect(reverse("admin:catalog_product_changelist"))

    @admin.action(description="Activer les produits selectionnes")
    def make_active(self, request, queryset):
        queryset.update(active=True)

    @admin.action(description="Desactiver les produits selectionnes")
    def make_inactive(self, request, queryset):
        queryset.update(active=False)


@admin.register(StoreSettings)
class StoreSettingsAdmin(admin.ModelAdmin):
    fields = (
        "store_name",
        "whatsapp_number",
        "box_discount",
        "currency",
        "size_min",
        "size_max",
    )

    def has_add_permission(self, request):
        return not StoreSettings.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False

    def changelist_view(self, request, extra_context=None):
        from django.http import HttpResponseRedirect
        from django.urls import reverse

        settings_obj = StoreSettings.load()
        return HttpResponseRedirect(
            reverse("admin:catalog_storesettings_change", args=[settings_obj.pk])
        )


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    fields = ("product", "brand", "name", "size", "with_box", "quantity", "unit_price", "color_note")
    readonly_fields = fields
    can_delete = False

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ("id", "created_at", "total_display", "items_summary")
    readonly_fields = ("created_at", "total", "currency")
    inlines = [OrderItemInline]
    date_hierarchy = "created_at"

    def has_add_permission(self, request):
        # Orders are only ever created by the storefront checkout, never by hand.
        return False

    def total_display(self, obj):
        return f"{obj.total:,} {obj.currency}".replace(",", " ")

    total_display.short_description = "Total"

    def items_summary(self, obj):
        return ", ".join(f"{item.brand} {item.name} x{item.quantity}" for item in obj.items.all())

    items_summary.short_description = "Articles"
