from rest_framework import serializers
from .models import Report, ReportCategory, ReportTemplate

class ReportCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ReportCategory
        fields = ['id', 'name', 'description', 'icon', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

class ReportTemplateSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.name', read_only=True)
    
    class Meta:
        model = ReportTemplate
        fields = [
            'id', 'name', 'description', 'template_type', 'category', 'category_name',
            'config', 'is_active', 'created_by', 'created_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)

class ReportSerializer(serializers.ModelSerializer):
    template_name = serializers.CharField(source='template.name', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    animal_name = serializers.CharField(source='animal.name', read_only=True)
    corridor_name = serializers.CharField(source='corridor.name', read_only=True)
    generated_by_name = serializers.CharField(source='generated_by.name', read_only=True)
    
    class Meta:
        model = Report
        fields = [
            'id', 'title', 'description', 'template', 'template_name', 
            'category', 'category_name', 'date_from', 'date_to', 
            'species_filter', 'animal', 'animal_name', 'corridor', 'corridor_name',
            'data', 'summary', 'charts', 'status', 'format', 'file_url', 'file_size',
            'generated_by', 'generated_by_name', 'generated_at', 'error_message',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'data', 'summary', 'charts', 'status', 'file_url', 'file_size',
            'generated_by', 'generated_at', 'error_message', 'created_at', 'updated_at'
        ]
    
    def create(self, validated_data):
        validated_data['generated_by'] = self.context['request'].user
        validated_data['status'] = 'pending'
        return super().create(validated_data)

class GenerateReportSerializer(serializers.Serializer):
    template_id = serializers.UUIDField(required=False)
    title = serializers.CharField(max_length=300)
    description = serializers.CharField(required=False, allow_blank=True)
    category_id = serializers.UUIDField(required=False)
    
    date_from = serializers.DateTimeField(required=False)
    date_to = serializers.DateTimeField(required=False)
    species_filter = serializers.CharField(required=False, allow_blank=True)
    animal_id = serializers.UUIDField(required=False)
    corridor_id = serializers.UUIDField(required=False)
    
    format = serializers.ChoiceField(choices=['pdf', 'excel', 'json'], default='json')
    include_charts = serializers.BooleanField(default=True)
    include_maps = serializers.BooleanField(default=True)

