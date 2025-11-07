from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RangerViewSet, RangerTeamViewSet, RangerTrackingViewSet,
    PatrolLogViewSet, PatrolRouteViewSet
)

router = DefaultRouter()
router.register(r'teams', RangerTeamViewSet)
router.register(r'rangers', RangerViewSet)
router.register(r'tracking', RangerTrackingViewSet)
router.register(r'logs', PatrolLogViewSet)
router.register(r'routes', PatrolRouteViewSet)

urlpatterns = [
    path('', include(router.urls)),
]

