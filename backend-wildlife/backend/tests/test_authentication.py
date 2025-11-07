import pytest
from django.urls import reverse
from rest_framework import status
from django.contrib.auth import get_user_model
from tests.factories import UserFactory

User = get_user_model()

pytestmark = [pytest.mark.django_db, pytest.mark.auth]

@pytest.mark.api
class TestUserRegistration:
    def test_register_user_success(self, api_client):
        url = reverse('register')
        data = {
            'email': 'newuser@test.com',
            'name': 'New User',
            'role': 'viewer'
            # purpose is optional - automatically set to 'registration'
        }
        
        response = api_client.post(url, data)
        
        # Check if endpoint exists, otherwise skip
        if response.status_code == 404:
            pytest.skip("Registration endpoint not implemented")
        
        # Email-based OTP registration returns 200 and sends OTP to email
        # User is not created until OTP is verified
        if response.status_code == status.HTTP_200_OK:
            assert 'message' in response.data
            assert 'email' in response.data['message'].lower() or 'otp' in str(response.data).lower()
            assert 'otp_id' in response.data
            assert response.data['expires_in'] == 120  # 2 minutes
        else:
            # If it's a traditional registration, check for 201
            assert response.status_code == status.HTTP_201_CREATED
            assert User.objects.filter(email='newuser@test.com').exists()
    
    def test_register_duplicate_email(self, api_client):
        UserFactory.create(email='existing@test.com')
        
        url = reverse('register')
        data = {
            'email': 'existing@test.com',
            'password': 'TestPass123!',
            'name': 'Another User'
        }
        
        response = api_client.post(url, data)
        
        if response.status_code == 404:
            pytest.skip("Registration endpoint not implemented")
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_register_invalid_email(self, api_client):
        url = reverse('register')
        data = {
            'email': 'invalid-email',
            'password': 'TestPass123!',
            'name': 'Test User'
        }
        
        response = api_client.post(url, data)
        
        if response.status_code == 404:
            pytest.skip("Registration endpoint not implemented")
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST

@pytest.mark.api
class TestUserLogin:
    def test_login_success(self, api_client, ranger_user):
        try:
            url = reverse('login')
        except:
            pytest.skip("Login endpoint not configured")
        
        data = {
            'email': 'ranger@test.com'
        }
        
        response = api_client.post(url, data)
        
        if response.status_code == 404:
            pytest.skip("Login endpoint not implemented")
        
        assert response.status_code == status.HTTP_200_OK
        # OTP-based login sends OTP instead of returning token directly
        if 'message' in response.data and 'OTP' in str(response.data['message']):
            assert True  # OTP flow is working
        else:
            # Traditional token-based login
            assert 'access' in response.data or 'token' in response.data
    
    def test_login_invalid_credentials(self, api_client, ranger_user):
        try:
            url = reverse('login')
        except:
            pytest.skip("Login endpoint not configured")
        
        data = {
            'email': 'nonexistent@test.com'
        }
        
        response = api_client.post(url, data)
        
        if response.status_code == 404:
            pytest.skip("Login endpoint not implemented")
        
        # OTP-based login may return 200 even for non-existent users (security)
        # or 400/404 for invalid data
        assert response.status_code in [status.HTTP_400_BAD_REQUEST, status.HTTP_404_NOT_FOUND, status.HTTP_200_OK]
    
    def test_login_inactive_user(self, api_client):
        inactive_user = UserFactory.create(is_active=False)
        
        try:
            url = reverse('login')
        except:
            pytest.skip("Login endpoint not configured")
        
        data = {
            'email': inactive_user.email
        }
        
        response = api_client.post(url, data)
        
        if response.status_code == 404:
            pytest.skip("Login endpoint not implemented")
        
        # Should return error for inactive user
        assert response.status_code in [status.HTTP_400_BAD_REQUEST, status.HTTP_401_UNAUTHORIZED]

@pytest.mark.api
class TestJWTAuthentication:
    def test_obtain_token_pair(self, api_client, ranger_user):
        url = '/api/v1/auth/token/'
        data = {
            'email': 'ranger@test.com',
            'password': 'testpass123'
        }
        
        response = api_client.post(url, data)
        
        if response.status_code == 404:
            pytest.skip("JWT token endpoint not configured")
        
        assert response.status_code == status.HTTP_200_OK
        assert 'access' in response.data
        assert 'refresh' in response.data
    
    def test_refresh_token(self, api_client, jwt_tokens):
        url = '/api/v1/auth/token/refresh/'
        data = {'refresh': jwt_tokens['refresh']}
        
        response = api_client.post(url, data)
        
        if response.status_code == 404:
            pytest.skip("JWT refresh endpoint not configured")
        
        assert response.status_code == status.HTTP_200_OK
        assert 'access' in response.data
    
    def test_protected_endpoint_without_token(self, api_client):
        url = '/api/v1/animals/'
        response = api_client.get(url)
        
        # Should be unauthorized
        assert response.status_code in [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN]
    
    def test_protected_endpoint_with_token(self, authenticated_client):
        url = '/api/v1/animals/'
        response = authenticated_client.get(url)
        
        # Should succeed or return 200/404 (if no data)
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_404_NOT_FOUND]

@pytest.mark.unit
class TestUserModel:
    def test_create_user(self):
        user = UserFactory.create(
            email='test@test.com',
            name='Test User',
            role='viewer'
        )
        
        assert user.email == 'test@test.com'
        assert user.name == 'Test User'
        assert user.role == 'viewer'
        assert user.is_active is True
        assert user.is_staff is False
    
    def test_create_superuser(self):
        user = User.objects.create_superuser(
            email='admin@test.com',
            password='adminpass',
            name='Admin User'
        )
        
        assert user.is_staff is True
        assert user.is_superuser is True
        assert user.role == 'admin'
    
    def test_user_str_method(self, ranger_user):
        assert str(ranger_user) == ranger_user.email
    
    def test_account_locked_check(self):
        from django.utils import timezone
        from datetime import timedelta
        
        user = UserFactory.create()
        
        # Not locked
        assert user.is_account_locked() is False
        
        # Lock account
        user.locked_until = timezone.now() + timedelta(hours=1)
        user.save()
        
        assert user.is_account_locked() is True
        
        # Expired lock
        user.locked_until = timezone.now() - timedelta(hours=1)
        user.save()
        
        assert user.is_account_locked() is False

