from django.conf import settings
from django.contrib import admin
from django.urls import include, path, re_path
from django.views.static import serve as serve_static
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

# django.conf.urls.static.static() is a DEBUG-only no-op internally, even
# without the usual "if settings.DEBUG" guard around it — so media is
# served directly via the underlying view here to also work in production.
urlpatterns += [
    re_path(
        r"^%s(?P<path>.*)$" % settings.MEDIA_URL.lstrip("/"),
        serve_static,
        {"document_root": settings.MEDIA_ROOT},
    ),
]
