from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.conf import settings
from asgiref.sync import async_to_sync
from drf_yasg.utils import swagger_auto_schema
from apps.predictions.ml_client import get_ml_client
from .models import Corridor
from .serializers import CorridorSerializer, CorridorOptimizationSerializer
import httpx


class CorridorViewSet(viewsets.ModelViewSet):
    """
    Wildlife Corridors
    
    Manage wildlife corridors and run RL-based optimization.
    """
    queryset = Corridor.objects.all()
    serializer_class = CorridorSerializer
    filterset_fields = ['species', 'status']
    search_fields = ['name', 'description']
    ordering = ['-created_at']
    
    @swagger_auto_schema(tags=['Corridors'])
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
    
    @swagger_auto_schema(tags=['Corridors'])
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)
    
    @swagger_auto_schema(tags=['Corridors'])
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)
    
    @swagger_auto_schema(tags=['Corridors'])
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)
    
    @swagger_auto_schema(tags=['Corridors'])
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)
    
    @swagger_auto_schema(tags=['Corridors'])
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)
    
    @swagger_auto_schema(
        method='post',
        operation_summary="Optimize corridor with RL",
        tags=['Corridors']
    )
    @action(detail=False, methods=['post'])
    def optimize(self, request):
        """Optimize wildlife corridor using ML service"""
        serializer = CorridorOptimizationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            # Call ML service for corridor optimization
            ml_client = get_ml_client()
            sp = serializer.validated_data['start_point']
            ep = serializer.validated_data['end_point']
            ml_data = async_to_sync(ml_client.predict_corridor)(
                species=serializer.validated_data['species'],
                start_lat=sp['lat'],
                start_lon=sp['lon'],
                steps=serializer.validated_data.get('steps', 50),
                algorithm='ppo'
            )
            
            # Save corridor
            corridor = Corridor.objects.create(
                name=f"Corridor {serializer.validated_data['species']}",
                description=f"Optimized corridor for {serializer.validated_data['species']}",
                species=serializer.validated_data['species'],
                status='active',
                start_point=serializer.validated_data['start_point'],
                end_point=serializer.validated_data['end_point'],
                path=ml_data.get('path'),
                optimization_score=ml_data.get('summary', {}).get('average_corridor_quality'),
                optimization_data=ml_data,
                created_by=request.user
            )
            
            return Response(CorridorSerializer(corridor).data, status=status.HTTP_201_CREATED)
        
        except (httpx.HTTPError, Exception) as e:
            return Response(
                {'error': f'ML service error: {str(e)}'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

