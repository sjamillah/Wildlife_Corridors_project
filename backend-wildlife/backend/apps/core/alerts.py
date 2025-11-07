from django.db import models
from django.utils import timezone
from apps.animals.models import Animal
from apps.core.models import ConflictZone
from apps.core.models import WildlifeAlert
import uuid
import logging

logger = logging.getLogger(__name__)

class AlertType:
    HIGH_RISK_ZONE = 'high_risk_zone'
    POACHING_RISK = 'poaching_risk'
    CORRIDOR_EXIT = 'corridor_exit'
    RAPID_MOVEMENT = 'rapid_movement'
    LOW_BATTERY = 'low_battery'
    WEAK_SIGNAL = 'weak_signal'
    STATIONARY_TOO_LONG = 'stationary_too_long'
    UNUSUAL_BEHAVIOR = 'unusual_behavior'

class AlertSeverity:
    LOW = 'low'
    MEDIUM = 'medium'
    HIGH = 'high'
    CRITICAL = 'critical'

def create_alert(
    animal,
    alert_type,
    severity,
    title,
    message,
    latitude,
    longitude,
    conflict_zone=None,
    metadata=None
):
    recent_similar = WildlifeAlert.objects.filter(
        animal=animal,
        alert_type=alert_type,
        status='active',
        detected_at__gte=timezone.now() - timezone.timedelta(minutes=30)
    ).first()
    
    if recent_similar:
        logger.info(f"Similar alert already exists for {animal.name} - skipping duplicate")
        return recent_similar
    
    alert = WildlifeAlert.objects.create(
        animal=animal,
        alert_type=alert_type,
        severity=severity,
        title=title,
        message=message,
        latitude=latitude,
        longitude=longitude,
        conflict_zone=conflict_zone,
        metadata=metadata or {}
    )
    
    logger.warning(f"ALERT CREATED: {severity.upper()} - {title} for {animal.name}")
    
    return alert

def check_and_create_alerts(animal, current_position, tracking_data, conflict_info, corridor_status):
    alerts = []
    
    if conflict_info['risk_level'] == 'High':
        alert = create_alert(
            animal=animal,
            alert_type=AlertType.HIGH_RISK_ZONE,
            severity=AlertSeverity.CRITICAL,
            title=f"{animal.name} entered high-risk zone",
            message=f"{animal.species} {animal.name} has entered a high-risk conflict zone. Immediate attention required.",
            latitude=current_position['lat'],
            longitude=current_position['lon'],
            conflict_zone=conflict_info.get('conflict_zone'),
            metadata={
                'distance_to_conflict': conflict_info.get('distance_to_conflict'),
            }
        )
        if alert:
            alerts.append(alert)
    
    elif conflict_info['risk_level'] == 'Medium':
        alert = create_alert(
            animal=animal,
            alert_type=AlertType.HIGH_RISK_ZONE,
            severity=AlertSeverity.HIGH,
            title=f"{animal.name} approaching risk zone",
            message=f"{animal.species} {animal.name} is within {conflict_info.get('distance_to_conflict', 0):.1f}km of a conflict zone. Monitor closely.",
            latitude=current_position['lat'],
            longitude=current_position['lon'],
            metadata={'distance_to_conflict': conflict_info.get('distance_to_conflict')}
        )
        if alert:
            alerts.append(alert)
    
    if not corridor_status.get('inside_corridor'):
        alert = create_alert(
            animal=animal,
            alert_type=AlertType.CORRIDOR_EXIT,
            severity=AlertSeverity.MEDIUM,
            title=f"{animal.name} left wildlife corridor",
            message=f"{animal.species} {animal.name} has exited the designated wildlife corridor. May be at risk.",
            latitude=current_position['lat'],
            longitude=current_position['lon'],
            metadata={'last_corridor': corridor_status.get('corridor_name')}
        )
        if alert:
            alerts.append(alert)
    
    if tracking_data and tracking_data.speed_kmh:
        speed = tracking_data.speed_kmh
        speed_threshold = 20 if animal.species.lower() == 'elephant' else 30
        
        if speed > speed_threshold:
            alert = create_alert(
                animal=animal,
                alert_type=AlertType.RAPID_MOVEMENT,
                severity=AlertSeverity.HIGH,
                title=f"{animal.name} moving unusually fast",
                message=f"{animal.species} {animal.name} is moving at {speed:.1f} km/h. Possible chase or disturbance.",
                latitude=current_position['lat'],
                longitude=current_position['lon'],
                metadata={'speed_kmh': speed, 'threshold': speed_threshold}
            )
            if alert:
                alerts.append(alert)
    
    if tracking_data and tracking_data.battery_level:
        battery = str(tracking_data.battery_level).lower()
        if 'low' in battery or 'critical' in battery:
            alert = create_alert(
                animal=animal,
                alert_type=AlertType.LOW_BATTERY,
                severity=AlertSeverity.MEDIUM,
                title=f"{animal.name} collar battery low",
                message=f"GPS collar battery for {animal.name} is low. Schedule battery replacement.",
                latitude=current_position['lat'],
                longitude=current_position['lon'],
                metadata={'battery_level': tracking_data.battery_level}
            )
            if alert:
                alerts.append(alert)
    
    if tracking_data and tracking_data.signal_strength:
        signal = str(tracking_data.signal_strength).lower()
        if 'weak' in signal or 'poor' in signal or 'critical' in signal:
            alert = create_alert(
                animal=animal,
                alert_type=AlertType.WEAK_SIGNAL,
                severity=AlertSeverity.LOW,
                title=f"{animal.name} weak GPS signal",
                message=f"GPS collar signal for {animal.name} is weak. May lose tracking soon.",
                latitude=current_position['lat'],
                longitude=current_position['lon'],
                metadata={'signal_strength': tracking_data.signal_strength}
            )
            if alert:
                alerts.append(alert)
    
    return alerts
