from rest_framework import serializers
from .models import Ranger, RangerTeam, RangerTracking, PatrolLog, PatrolRoute

class RangerTeamSerializer(serializers.ModelSerializer):
    ranger_count = serializers.SerializerMethodField()
    
    class Meta:
        model = RangerTeam
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')
    
    def get_ranger_count(self, obj):
        return obj.rangers.count()

class RangerSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='user.name', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    phone = serializers.CharField(source='user.phone', read_only=True)
    team_name = serializers.CharField(source='team.name', read_only=True)
    
    class Meta:
        model = Ranger
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at', 'last_active')

class RangerTrackingSerializer(serializers.ModelSerializer):
    ranger_name = serializers.CharField(source='ranger.user.name', read_only=True)
    ranger_badge = serializers.CharField(source='ranger.badge_number', read_only=True)
    
    class Meta:
        model = RangerTracking
        fields = '__all__'
        read_only_fields = ('id', 'created_at')

class PatrolLogSerializer(serializers.ModelSerializer):
    ranger_name = serializers.CharField(source='ranger.user.name', read_only=True)
    team_name = serializers.CharField(source='team.name', read_only=True)
    animal_name = serializers.CharField(source='animal.name', read_only=True)
    
    class Meta:
        model = PatrolLog
        fields = '__all__'
        read_only_fields = ('id', 'timestamp', 'updated_at')
    
    def create(self, validated_data):
        request = self.context.get('request')
        if request and hasattr(request.user, 'ranger_profile'):
            validated_data['ranger'] = request.user.ranger_profile
            if request.user.ranger_profile.team:
                validated_data['team'] = request.user.ranger_profile.team
        return super().create(validated_data)

class PatrolRouteSerializer(serializers.ModelSerializer):
    team_name = serializers.CharField(source='team.name', read_only=True)
    assigned_ranger_names = serializers.SerializerMethodField()
    
    class Meta:
        model = PatrolRoute
        fields = '__all__'
        read_only_fields = ('id', 'created_by', 'created_at', 'updated_at')
    
    def get_assigned_ranger_names(self, obj):
        return [r.user.name for r in obj.assigned_rangers.all()]
    
    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)

class RangerLiveStatusSerializer(serializers.Serializer):
    ranger_id = serializers.UUIDField()
    name = serializers.CharField()
    badge_number = serializers.CharField()
    team_name = serializers.CharField(allow_null=True)
    current_status = serializers.CharField()
    last_active = serializers.DateTimeField(allow_null=True)
    
    current_position = serializers.DictField(allow_null=True)
    activity_type = serializers.CharField(allow_null=True)
    speed_kmh = serializers.FloatField(allow_null=True)
    battery_level = serializers.CharField(allow_null=True)
    signal_strength = serializers.CharField(allow_null=True)
    
    recent_logs = serializers.ListField(allow_null=True)
    distance_to_base_km = serializers.FloatField(allow_null=True)

