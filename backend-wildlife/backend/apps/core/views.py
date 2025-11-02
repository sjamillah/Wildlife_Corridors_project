"""
Core views including health check
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.db import connection
from django.core.cache import cache
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """
    Health check endpoint
    
    Checks:
    - Database connectivity
    - Cache connectivity
    - Basic system status
    """
    health_status = {
        'status': 'healthy',
        'database': 'unknown',
        'cache': 'unknown',
        'environment': settings.DEBUG and 'development' or 'production'
    }
    
    # Check database
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        health_status['database'] = 'healthy'
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        health_status['database'] = 'unhealthy'
        health_status['status'] = 'degraded'
    
    # Check cache
    try:
        cache.set('health_check', 'ok', 10)
        cache_value = cache.get('health_check')
        if cache_value == 'ok':
            health_status['cache'] = 'healthy'
        else:
            health_status['cache'] = 'degraded'
    except Exception as e:
        logger.error(f"Cache health check failed: {e}")
        health_status['cache'] = 'unhealthy'
    
    # Determine overall status
    if health_status['database'] == 'unhealthy':
        return Response(health_status, status=status.HTTP_503_SERVICE_UNAVAILABLE)
    
    return Response(health_status, status=status.HTTP_200_OK)

