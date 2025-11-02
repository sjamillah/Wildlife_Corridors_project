from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SyncLogViewSet, SyncQueueViewSet, upload_offline_data

router = DefaultRouter()
router.register(r'logs', SyncLogViewSet, basename='sync-log')
router.register(r'queue', SyncQueueViewSet, basename='sync-queue')

urlpatterns = [
    path('', include(router.urls)),
    # Offline data upload endpoint for mobile apps
    path('upload/', upload_offline_data, name='upload-offline-data'),
]
