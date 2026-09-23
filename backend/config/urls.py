from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from rest_framework_simplejwt.views import TokenRefreshView

from catalog.auth_views import StaffTokenObtainPairView

urlpatterns = [
    # Not "admin/": that path is reserved for the Next.js custom admin panel
    # once both apps sit behind the same domain/reverse proxy in production.
    path("django-admin/", admin.site.urls),
    path("api/auth/login/", StaffTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/", include("catalog.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
