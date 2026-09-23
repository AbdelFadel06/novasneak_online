from rest_framework import serializers

from .models import Order, OrderItem, Product, ProductImage, StoreSettings


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ["id", "image", "order"]


class ProductSerializer(serializers.ModelSerializer):
    images = ProductImageSerializer(many=True, read_only=True)

    class Meta:
        model = Product
        fields = ["id", "brand", "name", "price", "active", "created_at", "images"]


class StoreSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = StoreSettings
        fields = [
            "store_name",
            "whatsapp_number",
            "box_discount",
            "currency",
            "size_min",
            "size_max",
        ]


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = [
            "id",
            "product",
            "brand",
            "name",
            "unit_price",
            "size",
            "with_box",
            "quantity",
            "color_note",
        ]


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = ["id", "created_at", "total", "currency", "items"]


class OrderItemInputSerializer(serializers.Serializer):
    product_id = serializers.IntegerField(required=False, allow_null=True)
    brand = serializers.CharField(max_length=100)
    name = serializers.CharField(max_length=200)
    unit_price = serializers.IntegerField(min_value=0)
    size = serializers.IntegerField()
    with_box = serializers.BooleanField()
    quantity = serializers.IntegerField(min_value=1)
    color_note = serializers.CharField(max_length=200, required=False, allow_blank=True)


class OrderCreateSerializer(serializers.Serializer):
    items = OrderItemInputSerializer(many=True, allow_empty=False)

    def create(self, validated_data):
        items_data = validated_data["items"]
        total = sum(item["unit_price"] * item["quantity"] for item in items_data)
        order = Order.objects.create(total=total, currency=StoreSettings.load().currency)
        for item in items_data:
            product = None
            product_id = item.get("product_id")
            if product_id:
                product = Product.objects.filter(pk=product_id).first()
            OrderItem.objects.create(
                order=order,
                product=product,
                # Prefer the live product's normalized brand/name over
                # whatever casing the client happened to send, so order
                # history stays consistent with the catalogue.
                brand=product.brand if product else item["brand"],
                name=product.name if product else item["name"],
                unit_price=item["unit_price"],
                size=item["size"],
                with_box=item["with_box"],
                quantity=item["quantity"],
                color_note=item.get("color_note", ""),
            )
        return order
