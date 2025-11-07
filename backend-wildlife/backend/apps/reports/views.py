from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Avg, Q
from django.utils import timezone
from datetime import timedelta
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
import logging

from .models import Report, ReportCategory, ReportTemplate
from .serializers import (
    ReportSerializer, ReportCategorySerializer, 
    ReportTemplateSerializer, GenerateReportSerializer
)
from apps.animals.models import Animal
from apps.tracking.models import Tracking
from apps.corridors.models import Corridor
from apps.core.models import ConflictZone

logger = logging.getLogger(__name__)

class ReportCategoryViewSet(viewsets.ModelViewSet):
    queryset = ReportCategory.objects.all()
    serializer_class = ReportCategorySerializer
    permission_classes = [IsAuthenticated]
    
    @swagger_auto_schema(tags=['Reports'])
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
    
    @swagger_auto_schema(tags=['Reports'])
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)
    
    @swagger_auto_schema(tags=['Reports'])
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)
    
    @swagger_auto_schema(tags=['Reports'])
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)
    
    @swagger_auto_schema(tags=['Reports'])
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)
    
    @swagger_auto_schema(tags=['Reports'])
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)

class ReportTemplateViewSet(viewsets.ModelViewSet):
    queryset = ReportTemplate.objects.all()
    serializer_class = ReportTemplateSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['template_type', 'category', 'is_active']
    
    @swagger_auto_schema(tags=['Reports'])
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
    
    @swagger_auto_schema(tags=['Reports'])
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)
    
    @swagger_auto_schema(tags=['Reports'])
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)
    
    @swagger_auto_schema(tags=['Reports'])
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)
    
    @swagger_auto_schema(tags=['Reports'])
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)
    
    @swagger_auto_schema(tags=['Reports'])
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)

class ReportViewSet(viewsets.ModelViewSet):
    queryset = Report.objects.all()
    serializer_class = ReportSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['status', 'format', 'category', 'template']
    search_fields = ['title', 'description']
    ordering = ['-created_at']
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Report.objects.all()
        return Report.objects.filter(generated_by=user)
    
    @swagger_auto_schema(tags=['Reports'])
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
    
    @swagger_auto_schema(tags=['Reports'])
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)
    
    @swagger_auto_schema(tags=['Reports'])
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)
    
    @swagger_auto_schema(tags=['Reports'])
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)
    
    @swagger_auto_schema(tags=['Reports'])
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)
    
    @swagger_auto_schema(tags=['Reports'])
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)
    
    @swagger_auto_schema(
        method='post',
        operation_summary="Generate new report",
        operation_description="Generate a conservation report from template or custom parameters",
        request_body=GenerateReportSerializer,
        tags=['Reports']
    )
    @action(detail=False, methods=['post'])
    def generate(self, request):
        serializer = GenerateReportSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        data = serializer.validated_data
        
        try:
            report = Report.objects.create(
                title=data['title'],
                description=data.get('description', ''),
                template_id=data.get('template_id'),
                category_id=data.get('category_id'),
                date_from=data.get('date_from'),
                date_to=data.get('date_to'),
                species_filter=data.get('species_filter', ''),
                animal_id=data.get('animal_id'),
                corridor_id=data.get('corridor_id'),
                format=data.get('format', 'json'),
                status='generating',
                generated_by=request.user
            )
            
            report_data = self._generate_report_data(report)
            
            report.data = report_data['data']
            report.summary = report_data['summary']
            report.charts = report_data['charts']
            report.status = 'completed'
            report.generated_at = timezone.now()
            report.save()
            
            logger.info(f"Report generated: {report.title} by {request.user.email}")
            
            return Response(
                ReportSerializer(report).data,
                status=status.HTTP_201_CREATED
            )
        
        except Exception as e:
            logger.error(f"Report generation failed: {e}", exc_info=True)
            if 'report' in locals():
                report.status = 'failed'
                report.error_message = str(e)
                report.save()
            
            return Response(
                {'error': 'Report generation failed', 'detail': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @swagger_auto_schema(
        method='get',
        operation_summary="Download report",
        operation_description="Download generated report file (PDF/Excel/JSON)",
        tags=['Reports']
    )
    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        report = self.get_object()
        
        if report.status != 'completed':
            return Response(
                {'error': 'Report not ready', 'status': report.status},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if report.format == 'json':
            return Response({
                'title': report.title,
                'generated_at': report.generated_at,
                'data': report.data,
                'summary': report.summary,
                'charts': report.charts
            })
        
        if report.file_url:
            return Response({
                'download_url': report.file_url,
                'file_size': report.file_size,
                'format': report.format
            })
        
        return Response(
            {'error': 'File not available'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    @swagger_auto_schema(
        method='get',
        operation_summary="Report statistics",
        operation_description="Get aggregated statistics across all reports",
        tags=['Reports']
    )
    @action(detail=False, methods=['get'])
    def stats(self, request):
        total_reports = Report.objects.count()
        completed_reports = Report.objects.filter(status='completed').count()
        failed_reports = Report.objects.filter(status='failed').count()
        
        by_category = Report.objects.values('category__name').annotate(
            count=Count('id')
        ).order_by('-count')
        
        by_template = Report.objects.filter(template__isnull=False).values(
            'template__template_type'
        ).annotate(count=Count('id')).order_by('-count')
        
        last_7_days = timezone.now() - timedelta(days=7)
        recent_count = Report.objects.filter(created_at__gte=last_7_days).count()
        
        return Response({
            'total_reports': total_reports,
            'completed': completed_reports,
            'failed': failed_reports,
            'pending': total_reports - completed_reports - failed_reports,
            'by_category': list(by_category),
            'by_template_type': list(by_template),
            'last_7_days': recent_count,
        })
    
    @swagger_auto_schema(
        method='get',
        operation_summary="Report trends",
        operation_description="Get time-series analytics for report generation",
        manual_parameters=[
            openapi.Parameter('days', openapi.IN_QUERY, description="Number of days to analyze", type=openapi.TYPE_INTEGER, default=30)
        ],
        tags=['Reports']
    )
    @action(detail=False, methods=['get'])
    def trends(self, request):
        days = int(request.query_params.get('days', 30))
        start_date = timezone.now() - timedelta(days=days)
        
        reports_by_date = Report.objects.filter(
            created_at__gte=start_date
        ).extra(
            select={'date': 'DATE(created_at)'}
        ).values('date').annotate(
            count=Count('id'),
            completed=Count('id', filter=Q(status='completed'))
        ).order_by('date')
        
        status_trends = Report.objects.filter(
            created_at__gte=start_date
        ).values('status').annotate(count=Count('id'))
        
        return Response({
            'period_days': days,
            'start_date': start_date,
            'reports_by_date': list(reports_by_date),
            'status_distribution': list(status_trends),
        })
    
    def _generate_report_data(self, report):
        tracking_query = Tracking.objects.all()
        
        if report.date_from:
            tracking_query = tracking_query.filter(timestamp__gte=report.date_from)
        if report.date_to:
            tracking_query = tracking_query.filter(timestamp__lte=report.date_to)
        if report.species_filter:
            tracking_query = tracking_query.filter(animal__species__iexact=report.species_filter)
        if report.animal:
            tracking_query = tracking_query.filter(animal=report.animal)
        
        movement_stats = {
            'total_points': tracking_query.count(),
            'unique_animals': tracking_query.values('animal').distinct().count(),
            'avg_speed_kmh': tracking_query.aggregate(Avg('speed_kmh'))['speed_kmh__avg'] or 0,
            'behavior_distribution': list(
                tracking_query.values('activity_type').annotate(count=Count('id'))
            ),
        }
        
        corridor_stats = {}
        if report.corridor:
            corridor_stats = {
                'corridor_name': report.corridor.name,
                'optimization_score': report.corridor.optimization_score,
                'points_in_corridor': 0,  # Would calculate based on spatial query
            }
        else:
            corridor_stats = {
                'total_corridors': Corridor.objects.count(),
                'active_corridors': Corridor.objects.filter(status='active').count(),
                'avg_optimization_score': Corridor.objects.aggregate(
                    Avg('optimization_score')
                )['optimization_score__avg'] or 0,
            }
        
        conflict_stats = {
            'total_zones': ConflictZone.objects.count(),
            'active_zones': ConflictZone.objects.filter(is_active=True).count(),
            'high_risk_zones': ConflictZone.objects.filter(risk_level='high').count(),
        }
        
        species_stats = list(
            Animal.objects.values('species').annotate(
                count=Count('id'),
                active_count=Count('id', filter=Q(status='active'))
            )
        )
        
        summary = {
            'total_animals_monitored': Animal.objects.filter(status='active').count(),
            'total_gps_points': movement_stats['total_points'],
            'avg_movement_speed': round(movement_stats['avg_speed_kmh'], 2),
            'corridors_optimized': corridor_stats.get('total_corridors', 0),
            'conflict_zones_monitored': conflict_stats['active_zones'],
            'report_period': {
                'from': report.date_from.isoformat() if report.date_from else None,
                'to': report.date_to.isoformat() if report.date_to else None,
            }
        }
        
        charts = {
            'behavior_distribution': {
                'type': 'pie',
                'data': movement_stats['behavior_distribution'],
                'title': 'Animal Behavior Distribution'
            },
            'species_distribution': {
                'type': 'bar',
                'data': species_stats,
                'title': 'Species Distribution'
            },
            'movement_timeline': {
                'type': 'line',
                'data': [],  # Would populate with time-series data
                'title': 'Movement Activity Over Time'
            }
        }
        
        return {
            'data': {
                'movement': movement_stats,
                'corridors': corridor_stats,
                'conflicts': conflict_stats,
                'species': species_stats,
            },
            'summary': summary,
            'charts': charts,
        }

class ReportViewSet(viewsets.ModelViewSet):
    queryset = Report.objects.all()
    serializer_class = ReportSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['status', 'format', 'category', 'template']
    search_fields = ['title', 'description']
    ordering = ['-created_at']
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Report.objects.all()
        return Report.objects.filter(generated_by=user)
    
    @swagger_auto_schema(tags=['Reports'])
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
    
    @swagger_auto_schema(tags=['Reports'])
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)
    
    @swagger_auto_schema(tags=['Reports'])
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)
    
    @swagger_auto_schema(tags=['Reports'])
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)
    
    @swagger_auto_schema(tags=['Reports'])
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)
    
    @swagger_auto_schema(tags=['Reports'])
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)
    
    @swagger_auto_schema(
        method='post',
        operation_summary="Generate new report",
        operation_description="Generate a conservation report from template or custom parameters",
        request_body=GenerateReportSerializer,
        tags=['Reports']
    )
    @action(detail=False, methods=['post'])
    def generate(self, request):
        serializer = GenerateReportSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        data = serializer.validated_data
        
        try:
            report = Report.objects.create(
                title=data['title'],
                description=data.get('description', ''),
                template_id=data.get('template_id'),
                category_id=data.get('category_id'),
                date_from=data.get('date_from'),
                date_to=data.get('date_to'),
                species_filter=data.get('species_filter', ''),
                animal_id=data.get('animal_id'),
                corridor_id=data.get('corridor_id'),
                format=data.get('format', 'json'),
                status='generating',
                generated_by=request.user
            )
            
            report_data = self._generate_report_data(report)
            
            report.data = report_data['data']
            report.summary = report_data['summary']
            report.charts = report_data['charts']
            report.status = 'completed'
            report.generated_at = timezone.now()
            report.save()
            
            logger.info(f"Report generated: {report.title} by {request.user.email}")
            
            return Response(
                ReportSerializer(report).data,
                status=status.HTTP_201_CREATED
            )
        
        except Exception as e:
            logger.error(f"Report generation failed: {e}", exc_info=True)
            if 'report' in locals():
                report.status = 'failed'
                report.error_message = str(e)
                report.save()
            
            return Response(
                {'error': 'Report generation failed', 'detail': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @swagger_auto_schema(
        method='get',
        operation_summary="Download report",
        operation_description="Download generated report file (PDF/Excel/JSON)",
        tags=['Reports']
    )
    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        report = self.get_object()
        
        if report.status != 'completed':
            return Response(
                {'error': 'Report not ready', 'status': report.status},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if report.format == 'json':
            return Response({
                'title': report.title,
                'generated_at': report.generated_at,
                'data': report.data,
                'summary': report.summary,
                'charts': report.charts
            })
        
        if report.file_url:
            return Response({
                'download_url': report.file_url,
                'file_size': report.file_size,
                'format': report.format
            })
        
        return Response(
            {'error': 'File not available'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    @swagger_auto_schema(
        method='get',
        operation_summary="Report statistics",
        operation_description="Get aggregated statistics across all reports",
        tags=['Reports']
    )
    @action(detail=False, methods=['get'])
    def stats(self, request):
        queryset = self.get_queryset()
        
        total_reports = queryset.count()
        completed_reports = queryset.filter(status='completed').count()
        failed_reports = queryset.filter(status='failed').count()
        
        by_category = queryset.values('category__name').annotate(
            count=Count('id')
        ).order_by('-count')
        
        by_template = queryset.filter(template__isnull=False).values(
            'template__template_type'
        ).annotate(count=Count('id')).order_by('-count')
        
        last_7_days = timezone.now() - timedelta(days=7)
        recent_count = queryset.filter(created_at__gte=last_7_days).count()
        
        return Response({
            'total_reports': total_reports,
            'completed': completed_reports,
            'failed': failed_reports,
            'pending': total_reports - completed_reports - failed_reports,
            'by_category': list(by_category),
            'by_template_type': list(by_template),
            'last_7_days': recent_count,
        })
    
    @swagger_auto_schema(
        method='get',
        operation_summary="Report trends",
        operation_description="Get time-series analytics for report generation",
        manual_parameters=[
            openapi.Parameter('days', openapi.IN_QUERY, description="Number of days to analyze", type=openapi.TYPE_INTEGER, default=30)
        ],
        tags=['Reports']
    )
    @action(detail=False, methods=['get'])
    def trends(self, request):
        days = int(request.query_params.get('days', 30))
        start_date = timezone.now() - timedelta(days=days)
        
        queryset = self.get_queryset()
        
        reports_by_date = queryset.filter(
            created_at__gte=start_date
        ).extra(
            select={'date': 'DATE(created_at)'}
        ).values('date').annotate(
            count=Count('id'),
            completed=Count('id', filter=Q(status='completed'))
        ).order_by('date')
        
        status_trends = queryset.filter(
            created_at__gte=start_date
        ).values('status').annotate(count=Count('id'))
        
        return Response({
            'period_days': days,
            'start_date': start_date,
            'reports_by_date': list(reports_by_date),
            'status_distribution': list(status_trends),
        })
    
    def _generate_report_data(self, report):
        tracking_query = Tracking.objects.all()
        
        if report.date_from:
            tracking_query = tracking_query.filter(timestamp__gte=report.date_from)
        if report.date_to:
            tracking_query = tracking_query.filter(timestamp__lte=report.date_to)
        if report.species_filter:
            tracking_query = tracking_query.filter(animal__species__iexact=report.species_filter)
        if report.animal:
            tracking_query = tracking_query.filter(animal=report.animal)
        
        movement_stats = {
            'total_points': tracking_query.count(),
            'unique_animals': tracking_query.values('animal').distinct().count(),
            'avg_speed_kmh': tracking_query.aggregate(Avg('speed_kmh'))['speed_kmh__avg'] or 0,
            'behavior_distribution': list(
                tracking_query.values('activity_type').annotate(count=Count('id'))
            ),
        }
        
        corridor_stats = {}
        if report.corridor:
            corridor_stats = {
                'corridor_name': report.corridor.name,
                'optimization_score': report.corridor.optimization_score,
                'corridor_status': report.corridor.status,
            }
        else:
            corridor_stats = {
                'total_corridors': Corridor.objects.count(),
                'active_corridors': Corridor.objects.filter(status='active').count(),
                'avg_optimization_score': Corridor.objects.aggregate(
                    Avg('optimization_score')
                )['optimization_score__avg'] or 0,
            }
        
        conflict_stats = {
            'total_zones': ConflictZone.objects.count(),
            'active_zones': ConflictZone.objects.filter(is_active=True).count(),
            'high_risk_zones': ConflictZone.objects.filter(risk_level='high').count(),
            'medium_risk_zones': ConflictZone.objects.filter(risk_level='medium').count(),
        }
        
        species_stats = list(
            Animal.objects.values('species').annotate(
                count=Count('id'),
                active_count=Count('id', filter=Q(status='active'))
            )
        )
        
        summary = {
            'total_animals_monitored': Animal.objects.filter(status='active').count(),
            'total_gps_points': movement_stats['total_points'],
            'avg_movement_speed': round(movement_stats['avg_speed_kmh'], 2),
            'corridors_optimized': corridor_stats.get('total_corridors', 0),
            'conflict_zones_monitored': conflict_stats['active_zones'],
            'report_period': {
                'from': report.date_from.isoformat() if report.date_from else None,
                'to': report.date_to.isoformat() if report.date_to else None,
            }
        }
        
        charts = {
            'behavior_distribution': {
                'type': 'pie',
                'data': movement_stats['behavior_distribution'],
                'title': 'Animal Behavior Distribution'
            },
            'species_distribution': {
                'type': 'bar',
                'data': species_stats,
                'title': 'Species Distribution'
            },
            'movement_timeline': {
                'type': 'line',
                'data': [],
                'title': 'Movement Activity Over Time'
            },
            'corridor_effectiveness': {
                'type': 'gauge',
                'data': corridor_stats,
                'title': 'Corridor Optimization Scores'
            }
        }
        
        return {
            'data': {
                'movement': movement_stats,
                'corridors': corridor_stats,
                'conflicts': conflict_stats,
                'species': species_stats,
            },
            'summary': summary,
            'charts': charts,
        }

