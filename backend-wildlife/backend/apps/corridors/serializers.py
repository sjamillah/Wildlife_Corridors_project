from rest_framework import serializers
from .models import Corridor

class CorridorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Corridor
        fields = [
            'id', 'name', 'description', 'species', 'status',
            'start_point', 'end_point', 'path', 'optimization_score',
            'optimization_data', 'created_at', 'updated_at', 'created_by'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

class CorridorOptimizationSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255, required=False, help_text="Corridor name (optional)")
    species = serializers.CharField(max_length=255, help_text="Target species (e.g., 'Elephant', 'Wildebeest')")
    start_point = serializers.JSONField(help_text="Starting point {'lat': -2.0, 'lon': 34.0}")
    end_point = serializers.JSONField(help_text="Ending point {'lat': -2.5, 'lon': 34.5}")
    steps = serializers.IntegerField(required=False, default=50, help_text="Number of steps for RL optimization")
    optimization_goal = serializers.ChoiceField(
        choices=['balanced', 'shortest', 'safest', 'most_connected'],
        default='balanced',
        required=False,
        help_text="Optimization goal: balanced (default), shortest, safest, or most_connected"
    )
    
    def validate_start_point(self, value):
        if not isinstance(value, dict) or 'lat' not in value or 'lon' not in value:
            raise serializers.ValidationError("Start point must have 'lat' and 'lon'")
        return value
    
    def validate_end_point(self, value):
        if not isinstance(value, dict) or 'lat' not in value or 'lon' not in value:
            raise serializers.ValidationError("End point must have 'lat' and 'lon'")
        return value
    
    def validate_steps(self, value):
        if value < 10 or value > 200:
            raise serializers.ValidationError("Steps must be between 10 and 200")
        return value
