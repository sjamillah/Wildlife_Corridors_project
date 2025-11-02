from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.views.static import serve
from django.utils import timezone
from django.shortcuts import render
from rest_framework import permissions
from rest_framework.decorators import api_view, renderer_classes
from rest_framework.response import Response
from rest_framework.renderers import JSONRenderer, TemplateHTMLRenderer
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from apps.animals.views import AnimalViewSet


@api_view(['GET'])
@renderer_classes([TemplateHTMLRenderer, JSONRenderer])
def api_root(request):
    """
    Wildlife Tracking Platform API Root
    
    Welcome to the Wildlife Tracking Platform API!
    """
    data = {
        'service': 'Wildlife Conservation Platform',
        'tagline': 'Real-time wildlife tracking and AI-powered conservation management',
        'version': 'v1.0.0',
        'status': 'operational',
        'timestamp': timezone.now().isoformat(),
        
        'documentation': {
            'swagger_ui': request.build_absolute_uri('/api/docs/'),
            'redoc': request.build_absolute_uri('/api/redoc/'),
            'readme': 'See backend/README.md for complete documentation'
        },
        
        'endpoints': {
            '1_authentication': '/api/v1/auth/',
            '2_animals': '/api/v1/animals/',
            '3_tracking': '/api/v1/tracking/',
            '4_predictions': '/api/v1/predictions/',
            '5_corridors': '/api/v1/corridors/',
            '6_synchronization': '/api/v1/sync/',
            'live_status': '/api/animals/live_status/',
            'admin': '/admin/',
            'health': '/health/'
        },
        
        'features': [
            'Multi-species GPS tracking',
            'AI-powered movement predictions',
            'Wildlife corridor optimization',
            'Real-time behavioral analysis',
            'Offline data synchronization'
        ],
        
        'ml_models': ['HMM', 'BBMM', 'XGBoost', 'LSTM', 'Reinforcement Learning'],
        
        'environment': {
            'mode': 'development' if settings.DEBUG else 'production',
            'database': 'PostgreSQL (Supabase)',
            'cache': 'Database Cache'
        }
    }
    
    # Return HTML for browsers, JSON for API clients
    if request.accepted_renderer.format == 'html':
        return Response({
            'service': 'Wildlife Conservation Platform',
            'version': 'v1.0.0',
            'status': 'OPERATIONAL',
            'timestamp': timezone.now().strftime('%Y-%m-%d %H:%M:%S UTC'),
            'features': data['features'],
            'environment': 'Development' if settings.DEBUG else 'Production',
            'database': 'PostgreSQL (Supabase)',
            'cache': 'Database',
        }, template_name='api_root.html')
    
    return Response(data)

schema_view = get_schema_view(
    openapi.Info(
        title="Wildlife Tracking Platform API",
        default_version='v1',
        description="""
        ## Wildlife Conservation Platform
        
        Real-time wildlife tracking and AI-powered conservation management system.
        
        ### Key Features
        - Multi-species GPS tracking
        - AI-powered movement predictions
        - Wildlife corridor optimization
        - Real-time behavioral analysis
        - Offline data synchronization
        
        ### Authentication
        Most endpoints require JWT authentication. Obtain tokens via the Authentication endpoints.
        Click "Authorize" button and enter: Bearer {your_access_token}
        
        ### ML Pipeline
        The system uses 5 integrated ML models: HMM → BBMM → XGBoost → LSTM → RL
        
        ### Endpoint Categories (Workflow Order)
        1. **Authentication** - User registration, login, and session management
        2. **Animals** - Wildlife animal registration and management
        3. **Tracking** - GPS data collection and real-time monitoring
        4. **Predictions** - ML predictions based on tracking data
        5. **Corridors** - Wildlife corridor optimization using predictions
        6. **Synchronization** - Offline data sync for field operations
        """,
        contact=openapi.Contact(email="contact@wildlife-tracker.com"),
        license=openapi.License(name="MIT License"),
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
    authentication_classes=[],
)

urlpatterns = [
    # Root API endpoint
    path('', api_root, name='api-root'),
    
    # Admin and health
    path('admin/', admin.site.urls),
    path('health/', include('apps.core.urls')),
    
    # API Documentation
    path('api/docs/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('api/redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
    
    # API v1 routes (ordered by workflow)
    path('api/v1/auth/', include('apps.authentication.urls')),           # 1. Authentication
    path('api/v1/animals/', include('apps.animals.urls')),               # 2. Animals
    path('api/v1/tracking/', include('apps.tracking.urls')),             # 3. Tracking (includes live_tracking)
    path('api/v1/predictions/', include('apps.predictions.urls')),       # 4. Predictions
    path('api/v1/corridors/', include('apps.corridors.urls')),           # 5. Corridors
    path('api/v1/sync/', include('apps.sync.urls')),                     # 6. Synchronization
    
    # Special endpoints (direct access without v1)
    path('api/animals/live_status/', AnimalViewSet.as_view({'get': 'live_status'}), name='api-animals-live-status'),
]

# Development-only: Serve media and static files
if settings.DEBUG:
    urlpatterns += [
        # Media files (user uploads: images, documents, etc.)
        re_path(
            r'^media/(?P<path>.*)$',
            serve,
            {'document_root': settings.MEDIA_ROOT},
            name='media-files'
        ),
        # Static files (CSS, JS, admin assets)
        re_path(
            r'^static/(?P<path>.*)$',
            serve,
            {'document_root': settings.STATIC_ROOT} if settings.STATIC_ROOT else {'document_root': settings.BASE_DIR / 'static'},
            name='static-files'
        ),
    ]
