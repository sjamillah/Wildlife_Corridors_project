"""
Prediction Serializers
DRF serializers for prediction models and ML service requests
"""

from rest_framework import serializers
from .models import Prediction


class PredictionSerializer(serializers.ModelSerializer):
    """Serializer for Prediction model"""
    
    class Meta:
        model = Prediction
        fields = [
            'id', 'animal', 'prediction_type', 'input_data',
            'results', 'confidence', 'model_version', 'created_by', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class MovementPredictionSerializer(serializers.Serializer):
    """Serializer for movement prediction requests"""
    animal_id = serializers.IntegerField(required=True)
    species = serializers.ChoiceField(
        choices=['elephant', 'wildebeest'],
        required=True
    )
    prediction_days = serializers.IntegerField(default=7, min_value=1, max_value=30)


class HabitatPredictionSerializer(serializers.Serializer):
    """Serializer for habitat prediction requests"""
    lat = serializers.FloatField(required=True, min_value=-90, max_value=90)
    lon = serializers.FloatField(required=True, min_value=-180, max_value=180)
    species = serializers.ChoiceField(
        choices=['elephant', 'wildebeest'],
        required=True
    )
    radius_km = serializers.FloatField(default=10.0, min_value=0.1, max_value=100.0)


class CorridorPredictionSerializer(serializers.Serializer):
    """Serializer for corridor prediction requests"""
    species = serializers.ChoiceField(
        choices=['elephant', 'wildebeest'],
        required=True,
        help_text="Species name (elephant or wildebeest)"
    )
    start_lat = serializers.FloatField(
        required=True,
        min_value=-90,
        max_value=90,
        help_text="Starting latitude"
    )
    start_lon = serializers.FloatField(
        required=True,
        min_value=-180,
        max_value=180,
        help_text="Starting longitude"
    )
    steps = serializers.IntegerField(
        default=50,
        min_value=1,
        max_value=200,
        help_text="Number of prediction steps"
    )
    algorithm = serializers.ChoiceField(
        choices=['ppo', 'dqn'],
        default='ppo',
        help_text="RL algorithm (PPO or DQN)"
    )
    
    # Optional parameters
    time = serializers.FloatField(
        default=12.0,
        min_value=0,
        max_value=24,
        required=False,
        help_text="Time of day (0-24)"
    )
    predicted_state = serializers.IntegerField(
        default=1,
        required=False,
        help_text="HMM predicted state"
    )
    risk_score = serializers.FloatField(
        default=0.5,
        min_value=0,
        max_value=1,
        required=False,
        help_text="Initial risk score"
    )
    temporal_score = serializers.FloatField(
        default=0.6,
        min_value=0,
        max_value=1,
        required=False,
        help_text="Temporal stability score"
    )
    connectivity_score = serializers.FloatField(
        default=0.6,
        min_value=0,
        max_value=1,
        required=False,
        help_text="Connectivity score"
    )
    corridor_quality = serializers.FloatField(
        default=0.65,
        min_value=0,
        max_value=1,
        required=False,
        help_text="Initial corridor quality"
    )


class CorridorPredictionResponseSerializer(serializers.Serializer):
    """Serializer for corridor prediction responses"""
    status = serializers.CharField()
    predictions = serializers.ListField()
    summary = serializers.DictField()
    timestamp = serializers.DateTimeField()

