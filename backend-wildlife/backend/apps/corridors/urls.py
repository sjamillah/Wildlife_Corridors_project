from __future__ import annotations

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import CorridorViewSet

router = DefaultRouter()
router.register(r"", CorridorViewSet, basename="corridor")

urlpatterns = [
    path("", include(router.urls)),
]

