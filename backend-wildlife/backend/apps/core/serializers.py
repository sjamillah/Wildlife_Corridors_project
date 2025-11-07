from rest_framework import serializers
from .models import ConflictZone, WildlifeAlert

class ConflictZoneSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConflictZone
        fields = [
            'id', 'name', 'zone_type', 'risk_level', 'geometry',
            'buffer_distance_km', 'description', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

class ConflictZoneGeoJSONSerializer(serializers.Serializer):
    type = serializers.CharField(default='FeatureCollection')
    features = serializers.ListField()
    
    @staticmethod
    def to_geojson(conflict_zones):
        features = []
        
        for zone in conflict_zones:
            feature = {
                'type': 'Feature',
                'geometry': zone.geometry,
                'properties': {
                    'id': str(zone.id),
                    'name': zone.name,
                    'zone_type': zone.zone_type,
                    'risk_level': zone.risk_level,
                    'buffer_distance_km': zone.buffer_distance_km,
                    'description': zone.description,
                }
            }
            features.append(feature)
        
        return {
            'type': 'FeatureCollection',
            'features': features
        }

class WildlifeAlertSerializer(serializers.ModelSerializer):
    animal_name = serializers.CharField(source='animal.name', read_only=True)
    animal_species = serializers.CharField(source='animal.species', read_only=True)
    conflict_zone_name = serializers.CharField(source='conflict_zone.name', read_only=True, allow_null=True)
    acknowledged_by_name = serializers.CharField(source='acknowledged_by.name', read_only=True, allow_null=True)
    
    class Meta:
        model = WildlifeAlert
        fields = [
            'id', 'animal', 'animal_name', 'animal_species',
            'alert_type', 'severity', 'status',
            'title', 'message',
            'latitude', 'longitude',
            'conflict_zone', 'conflict_zone_name',
            'detected_at', 'acknowledged_at', 'resolved_at',
            'acknowledged_by', 'acknowledged_by_name',
            'metadata', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'detected_at', 'created_at', 'updated_at']

class AlertAcknowledgeSerializer(serializers.Serializer):
    notes = serializers.CharField(required=False, allow_blank=True)

class AlertResolveSerializer(serializers.Serializer):
    resolution_notes = serializers.CharField(required=False, allow_blank=True)

