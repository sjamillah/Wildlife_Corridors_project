from rest_framework import serializers
from .models import Animal

class AnimalSerializer(serializers.ModelSerializer):
    age = serializers.IntegerField(required=False, allow_null=True)
    weight = serializers.FloatField(required=False, allow_null=True)
    notes = serializers.CharField(required=False, allow_blank=True, default='')
    
    class Meta:
        model = Animal
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at', 'created_by')
    
    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)

class AnimalListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Animal
        fields = ('id', 'name', 'species', 'collar_id', 'status', 'health_status', 'created_at')

class LiveStatusSerializer(serializers.Serializer):
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
