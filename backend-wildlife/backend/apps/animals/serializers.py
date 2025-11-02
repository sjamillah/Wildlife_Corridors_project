from rest_framework import serializers
from .models import Animal


class AnimalSerializer(serializers.ModelSerializer):
    """Animal serializer"""
    
    class Meta:
        model = Animal
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at', 'created_by')
    
    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class AnimalListSerializer(serializers.ModelSerializer):
    """Minimal animal serializer for list views"""
    
    class Meta:
        model = Animal
        fields = ('id', 'name', 'species', 'collar_id', 'status', 'health_status', 'created_at')


class LiveStatusSerializer(serializers.Serializer):
    """Serializer for live animal status response"""
    animal_id = serializers.UUIDField()
    species = serializers.CharField()
    current_lat = serializers.FloatField()
    current_lon = serializers.FloatField()
    predicted_lat = serializers.FloatField()
    predicted_lon = serializers.FloatField()
    in_corridor = serializers.BooleanField()
    predicted_in_corridor = serializers.BooleanField()
    speed_kmh = serializers.FloatField(allow_null=True)
    last_seen = serializers.DateTimeField()
