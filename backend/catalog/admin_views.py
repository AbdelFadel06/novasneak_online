from datetime import date, timedelta

from django.db.models import Count, Sum
from django.db.models.functions import TruncDate
from django.utils import timezone
from rest_framework import generics, permissions, status, viewsets
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Order, OrderItem, Product, ProductImage, StoreSettings
from .serializers import (
    OrderSerializer,
    ProductImageSerializer,
    ProductSerializer,
    StoreSettingsSerializer,
)


class ProductAdminViewSet(viewsets.ModelViewSet):
    """Full CRUD for products, including inactive ones. Staff-only."""

    queryset = Product.objects.all().prefetch_related("images")
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAdminUser]


class ProductImageUploadView(APIView):
    permission_classes = [permissions.IsAdminUser]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, product_id):
        product = Product.objects.filter(pk=product_id).first()
        if not product:
            return Response({"detail": "Produit introuvable."}, status=status.HTTP_404_NOT_FOUND)
        if "image" not in request.FILES:
            return Response({"detail": "Aucune image envoyee."}, status=status.HTTP_400_BAD_REQUEST)
        order = request.data.get("order") or product.images.count()
        image = ProductImage.objects.create(
            product=product, image=request.FILES["image"], order=order
        )
        return Response(ProductImageSerializer(image).data, status=status.HTTP_201_CREATED)


class ProductImageDetailView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def patch(self, request, image_id):
        image = ProductImage.objects.filter(pk=image_id).first()
        if not image:
            return Response({"detail": "Image introuvable."}, status=status.HTTP_404_NOT_FOUND)
        order = request.data.get("order")
        if order is not None:
            image.order = order
            image.save(update_fields=["order"])
        return Response(ProductImageSerializer(image).data)

    def delete(self, request, image_id):
        deleted, _ = ProductImage.objects.filter(pk=image_id).delete()
        if not deleted:
            return Response({"detail": "Image introuvable."}, status=status.HTTP_404_NOT_FOUND)
        return Response(status=status.HTTP_204_NO_CONTENT)


class StoreSettingsAdminView(generics.RetrieveUpdateAPIView):
    serializer_class = StoreSettingsSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_object(self):
        return StoreSettings.load()


class OrderAdminViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Order.objects.all().prefetch_related("items")
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAdminUser]


class StatsView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        today = timezone.localdate()
        orders_today = Order.objects.filter(created_at__date=today)
        all_orders = Order.objects.all()

        top_products = (
            OrderItem.objects.values("brand", "name")
            .annotate(total_quantity=Sum("quantity"))
            .order_by("-total_quantity")[:5]
        )

        start_param = request.query_params.get("start")
        end_param = request.query_params.get("end")

        if start_param and end_param:
            try:
                period_start = date.fromisoformat(start_param)
                period_end = date.fromisoformat(end_param)
            except ValueError:
                return Response(
                    {"detail": "Dates invalides, format attendu AAAA-MM-JJ."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if period_start > period_end:
                period_start, period_end = period_end, period_start
            # Cap the range so a mistaken multi-year span can't generate a
            # huge daily array.
            max_end = period_start + timedelta(days=365)
            if period_end > max_end:
                period_end = max_end
        else:
            try:
                days = int(request.query_params.get("days", 7))
            except ValueError:
                days = 7
            days = max(1, min(days, 90))
            period_end = today
            period_start = today - timedelta(days=days - 1)

        period_orders = Order.objects.filter(
            created_at__date__gte=period_start, created_at__date__lte=period_end
        )

        daily_rows = {
            row["day"]: row
            for row in (
                period_orders.annotate(day=TruncDate("created_at"))
                .values("day")
                .annotate(orders=Count("id"), revenue=Sum("total"))
            )
        }
        daily = []
        day = period_start
        while day <= period_end:
            row = daily_rows.get(day)
            daily.append(
                {
                    "date": day.isoformat(),
                    "orders": row["orders"] if row else 0,
                    "revenue": row["revenue"] if row else 0,
                }
            )
            day += timedelta(days=1)

        return Response(
            {
                "orders_total": all_orders.count(),
                "revenue_total": all_orders.aggregate(s=Sum("total"))["s"] or 0,
                "orders_today": orders_today.count(),
                "revenue_today": orders_today.aggregate(s=Sum("total"))["s"] or 0,
                "products_active": Product.objects.filter(active=True).count(),
                "products_total": Product.objects.count(),
                "top_products": list(top_products),
                "period": {
                    "start": period_start.isoformat(),
                    "end": period_end.isoformat(),
                    "days": len(daily),
                    "orders": period_orders.count(),
                    "revenue": period_orders.aggregate(s=Sum("total"))["s"] or 0,
                    "daily": daily,
                },
            }
        )
