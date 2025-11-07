from django.contrib import admin
from .models import Ranger, RangerTeam, RangerTracking, PatrolLog, PatrolRoute

@admin.register(RangerTeam)
class RangerTeamAdmin(admin.ModelAdmin):
    list_display = ('name', 'is_active', 'created_at')
    list_filter = ('is_active',)
    search_fields = ('name', 'description')
    ordering = ('name',)

@admin.register(Ranger)
class RangerAdmin(admin.ModelAdmin):
    list_display = ('badge_number', 'get_name', 'team', 'current_status', 'last_active')
    list_filter = ('current_status', 'team')
    search_fields = ('badge_number', 'user__name', 'user__email')
    raw_id_fields = ('user', 'team')
    ordering = ('user__name',)
    
    def get_name(self, obj):
        return obj.user.name
    get_name.short_description = 'Name'

@admin.register(RangerTracking)
class RangerTrackingAdmin(admin.ModelAdmin):
    list_display = ('ranger', 'lat', 'lon', 'activity_type', 'timestamp')
    list_filter = ('activity_type', 'timestamp')
    search_fields = ('ranger__user__name', 'ranger__badge_number')
    raw_id_fields = ('ranger',)
    ordering = ('-timestamp',)
    date_hierarchy = 'timestamp'

@admin.register(PatrolLog)
class PatrolLogAdmin(admin.ModelAdmin):
    list_display = ('title', 'log_type', 'priority', 'ranger', 'is_resolved', 'timestamp')
    list_filter = ('log_type', 'priority', 'is_resolved', 'timestamp')
    search_fields = ('title', 'description', 'ranger__user__name')
    raw_id_fields = ('ranger', 'team', 'animal', 'resolved_by')
    ordering = ('-timestamp',)
    date_hierarchy = 'timestamp'
    readonly_fields = ('timestamp', 'updated_at')

@admin.register(PatrolRoute)
class PatrolRouteAdmin(admin.ModelAdmin):
    list_display = ('name', 'team', 'status', 'scheduled_start', 'scheduled_end')
    list_filter = ('status', 'scheduled_start')
    search_fields = ('name', 'description')
    raw_id_fields = ('team', 'created_by')
    filter_horizontal = ('assigned_rangers',)
    ordering = ('-scheduled_start',)
    date_hierarchy = 'scheduled_start'
    readonly_fields = ('created_at', 'updated_at')

