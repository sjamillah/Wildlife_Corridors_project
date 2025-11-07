from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView, LoginView, LoginVerifyView, LogoutView, ProfileView,
    ChangePasswordView, HealthCheckView, SendOTPView, VerifyOTPView
)

urlpatterns = [
    path('send-otp/', SendOTPView.as_view(), name='send-otp'),
    path('verify-otp/', VerifyOTPView.as_view(), name='verify-otp'),
    
    path('register/', RegisterView.as_view(), name='register'),
    
    path('login/', LoginView.as_view(), name='login'),
    path('login/verify/', LoginVerifyView.as_view(), name='login-verify'),
    
    path('logout/', LogoutView.as_view(), name='logout'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('me/', ProfileView.as_view(), name='profile'),
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('health/', HealthCheckView.as_view(), name='health'),
]

