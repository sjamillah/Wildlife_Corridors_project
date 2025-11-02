from rest_framework import serializers
from .models import Corridor


class CorridorSerializer(serializers.ModelSerializer):
    """Serializer for Corridor model"""
    
    class Meta:
        model = Corridor
        fields = [
            'id', 'name', 'description', 'species', 'status',
            'start_point', 'end_point', 'path', 'optimization_score',
            'optimization_data', 'created_at', 'updated_at', 'created_by'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class CorridorOptimizationSerializer(serializers.Serializer):
    """Serializer for corridor optimization requests"""
    start_point = serializers.JSONField(help_text="Starting point coordinates")
    end_point = serializers.JSONField(help_text="Ending point coordinates")
    species = serializers.CharField(max_length=255, help_text="Target species")
    optimization_goal = serializers.ChoiceField(
        choices=['balanced', 'shortest', 'safest', 'most_connected'],
        default='balanced',
        help_text="Optimization goal"
    )
    
    def validate_start_point(self, value):
        """Validate start point has required coordinates"""
        if not isinstance(value, dict) or 'lat' not in value or 'lon' not in value:
            raise serializers.ValidationError("Start point must have 'lat' and 'lon'")
        return value
    
    def validate_end_point(self, value):
        """Validate end point has required coordinates"""
        if not isinstance(value, dict) or 'lat' not in value or 'lon' not in value:
            raise serializers.ValidationError("End point must have 'lat' and 'lon'")
        return value
