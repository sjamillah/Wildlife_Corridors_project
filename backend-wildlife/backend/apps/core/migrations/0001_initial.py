# Initial migration for core app

from django.db import migrations, models
import uuid


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='ConflictZone',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('name', models.CharField(max_length=255)),
                ('zone_type', models.CharField(choices=[('agriculture', 'Agricultural Land'), ('settlement', 'Human Settlement'), ('road', 'Road/Highway'), ('infrastructure', 'Infrastructure'), ('protected_area', 'Protected Area'), ('buffer_zone', 'Buffer Zone')], max_length=50)),
                ('risk_level', models.CharField(choices=[('high', 'High Risk'), ('medium', 'Medium Risk'), ('low', 'Low Risk')], default='medium', max_length=20)),
                ('geometry', models.JSONField(help_text='GeoJSON geometry for the conflict zone')),
                ('buffer_distance_km', models.FloatField(default=1.0, help_text='Buffer distance in kilometers')),
                ('description', models.TextField(blank=True, default='')),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'db_table': 'conflict_zones',
                'ordering': ['-created_at'],
                'managed': True,
            },
        ),
    ]

