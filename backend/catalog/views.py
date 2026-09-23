import django_filters
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Product, StoreSettings
from .serializers import OrderCreateSerializer, ProductSerializer, StoreSettingsSerializer


class BrandInFilter(django_filters.BaseInFilter, django_filters.CharFilter):
    pass


class ProductFilter(django_filters.FilterSet):
    brand = BrandInFilter(field_name="brand", lookup_expr="in")
    price_max = django_filters.NumberFilter(field_name="price", lookup_expr="lte")

    class Meta:
        model = Product
        fields = ["brand", "price_max"]


class ProductListView(generics.ListAPIView):
    queryset = Product.objects.filter(active=True).prefetch_related("images")
    serializer_class = ProductSerializer
    filterset_class = ProductFilter


class ProductDetailView(generics.RetrieveAPIView):
    queryset = Product.objects.filter(active=True).prefetch_related("images")
    serializer_class = ProductSerializer


class StoreSettingsView(generics.RetrieveAPIView):
    serializer_class = StoreSettingsSerializer

    def get_object(self):
        return StoreSettings.load()


class OrderCreateView(APIView):
    """Logs a checkout attempt (cart contents) before the client redirects to
    WhatsApp, so the admin has an order history even though the actual sale
    is closed over WhatsApp, not through this API."""

    authentication_classes = []

    def post(self, request):
        serializer = OrderCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = serializer.save()
        return Response({"id": order.id}, status=status.HTTP_201_CREATED)
