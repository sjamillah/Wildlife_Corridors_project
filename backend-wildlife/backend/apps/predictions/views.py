"""
Prediction Views
DRF views for prediction endpoints and ML service integration
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from asgiref.sync import async_to_sync
from drf_yasg.utils import swagger_auto_schema
import logging

from .ml_client import get_ml_client
from .models import Prediction
from .serializers import PredictionSerializer

logger = logging.getLogger(__name__)


class PredictionViewSet(viewsets.ModelViewSet):
    """
    ML Predictions
    
    Store and manage machine learning prediction results.
    """
    queryset = Prediction.objects.all()
    serializer_class = PredictionSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['animal', 'prediction_type', 'created_by']
    search_fields = ['animal__name', 'animal__species']
    ordering = ['-created_at']
    
    @swagger_auto_schema(tags=['Predictions'])
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
    
    @swagger_auto_schema(tags=['Predictions'])
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)
    
    @swagger_auto_schema(tags=['Predictions'])
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)
    
    @swagger_auto_schema(tags=['Predictions'])
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)
    
    @swagger_auto_schema(tags=['Predictions'])
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)
    
    @swagger_auto_schema(tags=['Predictions'])
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)
    
    @swagger_auto_schema(
        method='post',
        operation_summary="Generate corridor prediction",
        tags=['Predictions']
    )
    @action(detail=False, methods=['post'])
    def corridor(self, request):
        """Run RL corridor prediction and save to predictions table."""
        data = request.data
        required = ['species', 'start_lat', 'start_lon']
        for k in required:
            if k not in data:
                return Response({'error': f'{k} is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            ml_client = get_ml_client()
            ml_data = async_to_sync(ml_client.predict_corridor)(
                species=data['species'],
                start_lat=float(data['start_lat']),
                start_lon=float(data['start_lon']),
                steps=int(data.get('steps', 50)),
                algorithm=str(data.get('algorithm', 'ppo')),
            )

            prediction = Prediction.objects.create(
                prediction_type='corridor',
                input_data=data,
                results=ml_data,
                confidence=ml_data.get('summary', {}).get('average_corridor_quality', 0.0),
                animal_id=data.get('animal_id'),
                created_by=request.user
            )

            return Response(PredictionSerializer(prediction).data, status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.error(f"Corridor prediction error: {e}")
            return Response({'error': str(e)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    @swagger_auto_schema(
        method='get',
        operation_summary="Prediction history",
        tags=['Predictions']
    )
    @action(detail=False, methods=['get'])
    def history(self, request):
        """
        Get prediction history for current user.
        
        GET /api/predictions/history/
        """
        predictions = self.queryset.filter(created_by=request.user).order_by('-created_at')
        
        # Optional filtering by type
        prediction_type = request.query_params.get('type', None)
        if prediction_type:
            predictions = predictions.filter(prediction_type=prediction_type)
        
        serializer = self.get_serializer(predictions, many=True)
        return Response(serializer.data)
