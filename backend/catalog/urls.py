from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .admin_views import (
    OrderAdminViewSet,
    ProductAdminViewSet,
    ProductImageDetailView,
    ProductImageUploadView,
    StatsView,
    StoreSettingsAdminView,
)
from .views import (
    OrderCreateView,
    ProductDetailView,
    ProductListView,
    StoreSettingsView,
)

admin_router = DefaultRouter()
admin_router.register("products", ProductAdminViewSet, basename="admin-product")
admin_router.register("orders", OrderAdminViewSet, basename="admin-order")

urlpatterns = [
    path("products/", ProductListView.as_view(), name="product-list"),
    path("products/<int:pk>/", ProductDetailView.as_view(), name="product-detail"),
    path("settings/", StoreSettingsView.as_view(), name="store-settings"),
    path("orders/", OrderCreateView.as_view(), name="order-create"),
    path("admin/settings/", StoreSettingsAdminView.as_view(), name="admin-settings"),
    path("admin/stats/", StatsView.as_view(), name="admin-stats"),
    path(
        "admin/products/<int:product_id>/images/",
        ProductImageUploadView.as_view(),
        name="admin-product-image-upload",
    ),
    path(
        "admin/images/<int:image_id>/",
        ProductImageDetailView.as_view(),
        name="admin-product-image-detail",
    ),
    path("admin/", include(admin_router.urls)),
]
