from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import api_view, permission_classes
from asgiref.sync import async_to_sync
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
import os
import sys
from pathlib import Path
import logging

from .ml_client import get_ml_client
from .models import Prediction
from .serializers import PredictionSerializer

logger = logging.getLogger(__name__)

class PredictionViewSet(viewsets.ModelViewSet):
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
        predictions = self.queryset.filter(created_by=request.user).order_by('-created_at')
        
        prediction_type = request.query_params.get('type', None)
        if prediction_type:
            predictions = predictions.filter(prediction_type=prediction_type)
        
        serializer = self.get_serializer(predictions, many=True)
        return Response(serializer.data)

def get_xgboost_predictor():
    try:
        from apps.predictions.xgboost_loader import get_xgboost_predictor as get_predictor
        return get_predictor()
    except Exception as e:
        logger.warning(f"XGBoost model not available: {e}")
        return None

@swagger_auto_schema(
    method='get',
    operation_summary="Get XGBoost habitat environment",
    operation_description="Get habitat suitability scores for a geographic area",
    manual_parameters=[
        openapi.Parameter('lat', openapi.IN_QUERY, description="Latitude", type=openapi.TYPE_NUMBER, required=True),
        openapi.Parameter('lon', openapi.IN_QUERY, description="Longitude", type=openapi.TYPE_NUMBER, required=True),
        openapi.Parameter('radius', openapi.IN_QUERY, description="Radius in meters", type=openapi.TYPE_INTEGER, default=50000),
        openapi.Parameter('species', openapi.IN_QUERY, description="Species (elephant or wildebeest)", type=openapi.TYPE_STRING, default='elephant'),
    ],
    tags=['ML Predictions']
)
@api_view(['GET'])
@permission_classes([AllowAny])
def xgboost_environment(request):
    try:
        lat = float(request.query_params.get('lat', -2.0))
        lon = float(request.query_params.get('lon', 35.5))
        radius = int(request.query_params.get('radius', 50000))
        species = request.query_params.get('species', 'elephant').lower()
        
        if os.getenv('DISABLE_LOCAL_ML', 'False').lower() == 'true':
            return Response({
                'available': False,
                'message': 'XGBoost models disabled (DISABLE_LOCAL_ML=True)',
                'habitat_score': 0.5,
                'features': {}
            })
        
        predictor = get_xgboost_predictor()
        
        if not predictor:
            return Response({
                'available': False,
                'message': 'XGBoost model not loaded',
                'habitat_score': 0.5,
                'features': {}
            })
        
        try:
            habitat_data = predictor.get_environment_data(lat, lon, radius, species)
            
            habitat_data['available'] = True
            habitat_data['model_info'] = {
                'model_type': 'XGBoost',
                'version': '1.0',
                'species': species,
                'model_loaded': predictor.models_loaded
            }
            
            return Response(habitat_data)
            
        except Exception as e:
            logger.error(f"Error calculating habitat score: {e}")
            return Response({
                'available': False,
                'error': str(e),
                'habitat_score': 0.5,
                'features': {}
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
    except ValueError as e:
        return Response(
            {'error': f'Invalid parameters: {e}'},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        logger.error(f"Error in xgboost_environment: {e}", exc_info=True)
        return Response(
            {'error': 'Failed to get habitat environment', 'detail': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@swagger_auto_schema(
    method='post',
    operation_summary="Predict habitat suitability",
    operation_description="Predict habitat suitability for specific coordinates",
    request_body=openapi.Schema(
        type=openapi.TYPE_OBJECT,
        properties={
            'lat': openapi.Schema(type=openapi.TYPE_NUMBER, description='Latitude'),
            'lon': openapi.Schema(type=openapi.TYPE_NUMBER, description='Longitude'),
            'species': openapi.Schema(type=openapi.TYPE_STRING, description='Species'),
        },
        required=['lat', 'lon', 'species']
    ),
    tags=['ML Predictions']
)
@api_view(['POST'])
@permission_classes([AllowAny])
def predict_habitat(request):
    try:
        lat = float(request.data.get('lat'))
        lon = float(request.data.get('lon'))
        species = request.data.get('species', 'elephant').lower()
        
        predictor = get_xgboost_predictor()
        
        if not predictor:
            return Response({
                'error': 'XGBoost model not available',
                'suitability': 'unknown'
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        
        result = predictor.predict_habitat(lat, lon, species)
        result['confidence'] = 0.85
        result['features_used'] = ['ndvi', 'elevation', 'water_distance', 'land_cover', 'slope', 'lat', 'lon']
        
        return Response(result)
        
    except (ValueError, KeyError) as e:
        return Response(
            {'error': f'Invalid input: {e}'},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        logger.error(f"Error predicting habitat: {e}", exc_info=True)
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

