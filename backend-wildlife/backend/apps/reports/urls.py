from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ReportViewSet, ReportCategoryViewSet, ReportTemplateViewSet

router = DefaultRouter()
router.register(r'reports', ReportViewSet, basename='report')
router.register(r'categories', ReportCategoryViewSet, basename='report-category')
router.register(r'templates', ReportTemplateViewSet, basename='report-template')

urlpatterns = router.urls

