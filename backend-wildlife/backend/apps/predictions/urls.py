from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PredictionViewSet, xgboost_environment, predict_habitat

router = DefaultRouter()
router.register(r'', PredictionViewSet, basename='prediction')

urlpatterns = [
    path('', include(router.urls)),
    path('xgboost/environment/', xgboost_environment, name='xgboost-environment'),
    path('xgboost/predict/', predict_habitat, name='xgboost-predict'),
]
