from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ConflictZoneViewSet, WildlifeAlertViewSet

conflict_zone_router = DefaultRouter()
conflict_zone_router.register(r'', ConflictZoneViewSet, basename='conflict-zone')

alert_router = DefaultRouter()
alert_router.register(r'alerts', WildlifeAlertViewSet, basename='alert')

urlpatterns = [
    path('', include(conflict_zone_router.urls)),
    path('', include(alert_router.urls)),
]
