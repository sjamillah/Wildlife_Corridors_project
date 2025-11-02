from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, UserSession, OTPVerification

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['email', 'name', 'role', 'organization', 'is_staff', 'is_active']
    list_filter = ['is_staff', 'is_active', 'role', 'organization', 'created_at']
    search_fields = ['email', 'name']
    ordering = ['email']
    readonly_fields = ['created_at', 'updated_at', 'last_login']
    
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal info', {'fields': ('name', 'phone', 'role', 'organization')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'created_at', 'updated_at')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'name', 'role', 'password1', 'password2'),
        }),
    )

@admin.register(UserSession)
class UserSessionAdmin(admin.ModelAdmin):
    list_display = ['user', 'device_id', 'is_active', 'created_at', 'last_activity']
    list_filter = ['is_active', 'created_at']
    search_fields = ['user__email', 'device_id']
    readonly_fields = ['created_at', 'last_activity']

@admin.register(OTPVerification)
class OTPVerificationAdmin(admin.ModelAdmin):
    list_display = ['phone', 'purpose', 'is_verified', 'attempts', 'created_at']
    list_filter = ['purpose', 'is_verified', 'created_at']
    search_fields = ['phone']
    readonly_fields = ['created_at', 'verified_at']
