from rest_framework import serializers
from .models import Tracking, Observation

class TrackingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tracking
        fields = '__all__'
        read_only_fields = ('id', 'local_id', 'created_at', 'updated_at', 'uploaded_by')
    
    def create(self, validated_data):
        validated_data['uploaded_by'] = self.context['request'].user
        return super().create(validated_data)

class TrackingBulkSerializer(serializers.Serializer):
    tracking_points = TrackingSerializer(many=True)
    
    def create(self, validated_data):
        tracking_points = validated_data['tracking_points']
        user = self.context['request'].user
        
        instances = []
        for point_data in tracking_points:
            point_data['uploaded_by'] = user
            instances.append(Tracking(**point_data))
        
        return Tracking.objects.bulk_create(instances)

class ObservationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Observation
        fields = '__all__'
        read_only_fields = ('id', 'local_id', 'created_at', 'updated_at', 'observer')
    
    def create(self, validated_data):
        validated_data['observer'] = self.context['request'].user
        return super().create(validated_data)

