from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AnimalViewSet

router = DefaultRouter()
router.register(r'', AnimalViewSet, basename='animal')

urlpatterns = [
    path('', include(router.urls)),
    # Note: live_status action is auto-registered by DRF router
    # Available at: /api/v1/animals/live_status/
]

