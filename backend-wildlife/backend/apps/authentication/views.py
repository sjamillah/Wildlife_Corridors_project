from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.utils import timezone
from django.core.cache import cache
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
import random
import logging
from .models import User, UserSession, OTPVerification
from .serializers import (
    UserSerializer, RegisterSerializer, LoginSerializer,
    ChangePasswordSerializer, OTPSerializer, SendOTPSerializer,
    VerifyOTPSerializer
)

logger = logging.getLogger(__name__)


class SendOTPView(APIView):
    """
    Send OTP
    
    Send one-time password for verification purposes.
    """
    permission_classes = [permissions.AllowAny]
    
    @swagger_auto_schema(
        operation_summary="Send OTP code",
        operation_description="Generate and send OTP code to user's phone",
        request_body=SendOTPSerializer,
        tags=['Authentication']
    )
    
    def post(self, request):
        serializer = SendOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        phone = serializer.validated_data['phone']
        purpose = serializer.validated_data['purpose']
        
        # Generate 4-digit OTP
        otp_code = str(random.randint(1000, 9999))
        
        # Store OTP in database
        otp_verification = OTPVerification.objects.create(
            phone=phone,
            otp_code=otp_code,
            purpose=purpose,
            expires_at=timezone.now() + timezone.timedelta(minutes=2)
        )
        
        # In production, send SMS here
        # For now, we'll log it (remove in production)
        logger.info(f"OTP for {phone} ({purpose}): {otp_code}")
        
        return Response({
            'message': 'OTP sent successfully',
            'otp_id': otp_verification.id,
            'expires_in': 120  # 2 minutes
        })


class VerifyOTPView(APIView):
    """
    Verify OTP
    
    Verify one-time password and complete authentication process.
    """
    permission_classes = [permissions.AllowAny]
    
    @swagger_auto_schema(
        operation_summary="Verify OTP code",
        operation_description="Verify OTP and complete registration or login",
        request_body=VerifyOTPSerializer,
        tags=['Authentication']
    )
    
    def post(self, request):
        serializer = VerifyOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        phone = serializer.validated_data['phone']
        otp_code = serializer.validated_data['otp_code']
        purpose = serializer.validated_data['purpose']
        
        try:
            otp_verification = OTPVerification.objects.get(
                phone=phone,
                otp_code=otp_code,
                purpose=purpose,
                is_verified=False
            )
            
            # Check if OTP is expired
            if otp_verification.is_expired():
                return Response(
                    {'error': 'OTP has expired'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Check attempts
            if otp_verification.attempts >= 3:
                return Response(
                    {'error': 'Too many failed attempts'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Mark as verified
            otp_verification.is_verified = True
            otp_verification.verified_at = timezone.now()
            otp_verification.save()
            
            # If this is for registration, create user
            if purpose == 'registration':
                email = serializer.validated_data.get('email')
                name = serializer.validated_data.get('name')
                role = serializer.validated_data.get('role', 'viewer')
                
                if email and name:
                    user = User.objects.create_user(
                        email=email,
                        name=name,
                        phone=phone,
                        role=role,
                        is_phone_verified=True
                    )
                    
                    # Generate tokens
                    refresh = RefreshToken.for_user(user)
                    
                    return Response({
                        'message': 'Registration successful',
                        'user': UserSerializer(user).data,
                        'tokens': {
                            'refresh': str(refresh),
                            'access': str(refresh.access_token),
                        }
                    })
            
            return Response({
                'message': 'OTP verified successfully',
                'verified': True
            })
            
        except OTPVerification.DoesNotExist:
            # Increment attempts for existing OTP
            try:
                otp_verification = OTPVerification.objects.get(
                    phone=phone,
                    purpose=purpose,
                    is_verified=False
                )
                otp_verification.attempts += 1
                otp_verification.save()
            except OTPVerification.DoesNotExist:
                pass
            
            return Response(
                {'error': 'Invalid OTP code'},
                status=status.HTTP_400_BAD_REQUEST
            )


class RegisterView(generics.CreateAPIView):
    """
    User Registration
    
    Register new user account (Step 1: sends OTP for verification).
    """
    permission_classes = [permissions.AllowAny]
    serializer_class = SendOTPSerializer
    swagger_tags = ['Authentication']
    
    @swagger_auto_schema(
        operation_summary="Register new user",
        operation_description="Initiate user registration by sending OTP",
        tags=['Authentication']
    )
    
    def post(self, request):
        # This endpoint now just initiates OTP verification
        # The actual user creation happens in VerifyOTPView
        serializer = SendOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        phone = serializer.validated_data['phone']
        purpose = 'registration'
        
        # Generate 4-digit OTP
        otp_code = str(random.randint(1000, 9999))
        
        # Store OTP in database
        otp_verification = OTPVerification.objects.create(
            phone=phone,
            otp_code=otp_code,
            purpose=purpose,
            expires_at=timezone.now() + timezone.timedelta(minutes=2)
        )
        
        # In production, send SMS here
        logger.info(f"Registration OTP for {phone}: {otp_code}")
        
        return Response({
            'message': 'OTP sent to your phone. Please verify to complete registration.',
            'otp_id': otp_verification.id,
            'expires_in': 120  # 2 minutes
        })


class LoginView(APIView):
    """
    User Login
    
    Login user account (Step 1: sends OTP for verification).
    """
    permission_classes = [permissions.AllowAny]
    
    @swagger_auto_schema(
        operation_summary="Login user",
        operation_description="Initiate user login by sending OTP",
        tags=['Authentication']
    )
    
    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response(
                {'error': 'Email is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user = User.objects.get(email=email)
            if not user.is_active:
                return Response(
                    {'error': 'User account is disabled'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Generate OTP for login
            otp_code = str(random.randint(1000, 9999))
            
            # Store OTP in database
            otp_verification = OTPVerification.objects.create(
                user=user,
                phone=user.phone or 'unknown',
                otp_code=otp_code,
                purpose='login',
                expires_at=timezone.now() + timezone.timedelta(minutes=2)
            )
            
            # In production, send SMS here
            logger.info(f"Login OTP for {email}: {otp_code}")
            
            return Response({
                'message': 'OTP sent to your phone. Please verify to complete login.',
                'otp_id': otp_verification.id,
                'expires_in': 120  # 2 minutes
            })
            
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_400_BAD_REQUEST
            )


class LoginVerifyView(APIView):
    """
    Verify Login
    
    Complete login by verifying OTP code.
    """
    permission_classes = [permissions.AllowAny]
    
    @swagger_auto_schema(
        operation_summary="Verify login OTP",
        operation_description="Complete login by verifying OTP code",
        tags=['Authentication']
    )
    
    def post(self, request):
        serializer = VerifyOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        phone = serializer.validated_data['phone']
        otp_code = serializer.validated_data['otp_code']
        
        try:
            otp_verification = OTPVerification.objects.get(
                phone=phone,
                otp_code=otp_code,
                purpose='login',
                is_verified=False
            )
            
            # Check if OTP is expired
            if otp_verification.is_expired():
                return Response(
                    {'error': 'OTP has expired'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Check attempts
            if otp_verification.attempts >= 3:
                return Response(
                    {'error': 'Too many failed attempts'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Mark as verified
            otp_verification.is_verified = True
            otp_verification.verified_at = timezone.now()
            otp_verification.save()
            
            user = otp_verification.user
            
            # Reset failed attempts
            user.failed_login_attempts = 0
            user.last_login_ip = request.META.get('REMOTE_ADDR')
            user.save()
            
            # Generate tokens
            refresh = RefreshToken.for_user(user)
            
            # Create session
            device_id = request.data.get('device_id', 'unknown')
            UserSession.objects.create(
                user=user,
                device_id=device_id,
                device_info=request.data.get('device_info', {}),
                ip_address=request.META.get('REMOTE_ADDR', ''),
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
                refresh_token=str(refresh),
                expires_at=timezone.now() + timezone.timedelta(days=7)
            )
            
            return Response({
                'message': 'Login successful',
                'user': UserSerializer(user).data,
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                }
            })
            
        except OTPVerification.DoesNotExist:
            # Increment attempts for existing OTP
            try:
                otp_verification = OTPVerification.objects.get(
                    phone=phone,
                    purpose='login',
                    is_verified=False
                )
                otp_verification.attempts += 1
                otp_verification.save()
            except OTPVerification.DoesNotExist:
                pass
            
            return Response(
                {'error': 'Invalid OTP code'},
                status=status.HTTP_400_BAD_REQUEST
            )


class LogoutView(APIView):
    """
    User Logout
    
    Logout current user session.
    """
    
    @swagger_auto_schema(
        operation_summary="Logout user",
        operation_description="End current user session",
        tags=['Authentication']
    )
    
    def post(self, request):
        device_id = request.data.get('device_id')
        if device_id:
            UserSession.objects.filter(
                user=request.user,
                device_id=device_id
            ).update(is_active=False)
        
        return Response({'message': 'Logged out successfully'})


class ProfileView(generics.RetrieveUpdateAPIView):
    """
    User Profile
    
    Get or update current user profile information.
    """
    serializer_class = UserSerializer
    
    @swagger_auto_schema(tags=['Authentication'])
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)
    
    @swagger_auto_schema(tags=['Authentication'])
    def put(self, request, *args, **kwargs):
        return super().put(request, *args, **kwargs)
    
    @swagger_auto_schema(tags=['Authentication'])
    def patch(self, request, *args, **kwargs):
        return super().patch(request, *args, **kwargs)
    
    def get_object(self):
        return self.request.user


class ChangePasswordView(APIView):
    """
    Change Password
    
    Update user password.
    """
    
    @swagger_auto_schema(
        operation_summary="Change password",
        operation_description="Update user password with current password verification",
        tags=['Authentication']
    )
    
    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = request.user
        
        if not user.check_password(serializer.validated_data['current_password']):
            return Response(
                {'error': 'Current password is incorrect'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        
        return Response({'message': 'Password changed successfully'})


class HealthCheckView(APIView):
    """Authentication service health check"""
    permission_classes = [permissions.AllowAny]
    
    def get(self, request):
        return Response({
            'status': 'healthy',
            'service': 'authentication',
            'timestamp': timezone.now()
        })

