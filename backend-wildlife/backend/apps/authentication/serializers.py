from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from .models import User, UserSession, OTPVerification


class UserSerializer(serializers.ModelSerializer):
    """User serializer for profile data"""
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'name', 'phone', 'role', 'organization',
            'is_active', 'is_staff', 'is_email_verified', 'is_phone_verified',
            'created_at', 'updated_at', 'last_login', 'failed_login_attempts', 'last_login_ip'
        ]
        read_only_fields = [
            'id', 'is_active', 'is_staff', 'is_email_verified', 'is_phone_verified',
            'created_at', 'updated_at', 'last_login', 'failed_login_attempts', 'last_login_ip'
        ]


class SendOTPSerializer(serializers.Serializer):
    """Send OTP serializer"""
    phone = serializers.CharField(max_length=20)
    purpose = serializers.ChoiceField(choices=OTPVerification.PURPOSE_CHOICES)
    email = serializers.EmailField(required=False)
    name = serializers.CharField(max_length=255, required=False)
    role = serializers.ChoiceField(choices=User.ROLE_CHOICES, required=False, default='viewer')
    
    def validate_phone(self, value):
        # Basic phone validation
        if not value.isdigit() or len(value) < 10:
            raise serializers.ValidationError("Invalid phone number format")
        return value


class VerifyOTPSerializer(serializers.Serializer):
    """Verify OTP serializer"""
    phone = serializers.CharField(max_length=20)
    otp_code = serializers.CharField(max_length=6, min_length=6)
    purpose = serializers.ChoiceField(choices=OTPVerification.PURPOSE_CHOICES)
    email = serializers.EmailField(required=False)
    name = serializers.CharField(max_length=255, required=False)
    role = serializers.ChoiceField(choices=User.ROLE_CHOICES, required=False)
    device_id = serializers.CharField(required=False, default='unknown')
    device_info = serializers.JSONField(required=False, default=dict)
    
    def validate_otp_code(self, value):
        if not value.isdigit():
            raise serializers.ValidationError("OTP code must contain only digits")
        return value
    
    def validate_phone(self, value):
        if not value.isdigit() or len(value) < 10:
            raise serializers.ValidationError("Invalid phone number format")
        return value


class RegisterSerializer(serializers.ModelSerializer):
    """User registration serializer - Legacy (now handled by OTP flow)"""
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = [
            'email', 'name', 'phone', 'role', 'organization',
            'password', 'password_confirm'
        ]
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Passwords don't match")
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(**validated_data)
        return user


class LoginSerializer(serializers.Serializer):
    """User login serializer - Legacy (now handled by OTP flow)"""
    email = serializers.EmailField()
    password = serializers.CharField()
    device_id = serializers.CharField(required=False, default='unknown')
    device_info = serializers.JSONField(required=False, default=dict)
    
    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')
        
        if email and password:
            user = authenticate(username=email, password=password)
            if not user:
                raise serializers.ValidationError('Invalid credentials')
            if not user.is_active:
                raise serializers.ValidationError('User account is disabled')
            
            attrs['user'] = user
            return attrs
        else:
            raise serializers.ValidationError('Must include email and password')


class ChangePasswordSerializer(serializers.Serializer):
    """Change password serializer"""
    current_password = serializers.CharField()
    new_password = serializers.CharField(validators=[validate_password])
    new_password_confirm = serializers.CharField()
    
    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError("New passwords don't match")
        return attrs


class OTPSerializer(serializers.Serializer):
    """OTP verification serializer - Legacy"""
    otp_code = serializers.CharField(max_length=6, min_length=6)
    email = serializers.EmailField()
    
    def validate_otp_code(self, value):
        if not value.isdigit():
            raise serializers.ValidationError("OTP code must contain only digits")
        return value


class UserSessionSerializer(serializers.ModelSerializer):
    """User session serializer"""
    
    class Meta:
        model = UserSession
        fields = [
            'id', 'device_id', 'device_info', 'ip_address',
            'user_agent', 'created_at', 'last_activity', 'is_active'
        ]
        read_only_fields = ['id', 'created_at', 'last_activity']
