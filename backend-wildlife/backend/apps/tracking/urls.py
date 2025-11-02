from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TrackingViewSet, ObservationViewSet, live_tracking

# Create separate routers to avoid conflicts
tracking_router = DefaultRouter()
tracking_router.register(r'', TrackingViewSet, basename='tracking')

observation_router = DefaultRouter()
observation_router.register(r'', ObservationViewSet, basename='observation')

urlpatterns = [
    # Real-time tracking endpoint (must come before router URLs)
    path('live_tracking/', live_tracking, name='live_tracking'),
    
    # Observation endpoints
    path('observations/', include(observation_router.urls)),
    
    # Tracking endpoints (at root)
    path('', include(tracking_router.urls)),
]

