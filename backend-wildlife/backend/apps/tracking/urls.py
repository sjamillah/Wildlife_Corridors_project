from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TrackingViewSet, ObservationViewSet, live_tracking, analyze_behavior, behavior_summary

tracking_router = DefaultRouter()
tracking_router.register(r'', TrackingViewSet, basename='tracking')

observation_router = DefaultRouter()
observation_router.register(r'', ObservationViewSet, basename='observation')

urlpatterns = [
    path('live_tracking/', live_tracking, name='live_tracking'),
    path('behavior/analyze/', analyze_behavior, name='analyze-behavior'),
    path('behavior/summary/', behavior_summary, name='behavior-summary'),
    path('observations/', include(observation_router.urls)),
    path('', include(tracking_router.urls)),
]

