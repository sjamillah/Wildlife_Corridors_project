# Generated migration - Update tracking fields

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('tracking', '0001_initial'),
    ]

    operations = [
        # Remove accuracy field
        migrations.RemoveField(
            model_name='tracking',
            name='accuracy',
        ),
        
        # Rename heading to directional_angle
        migrations.RenameField(
            model_name='tracking',
            old_name='heading',
            new_name='directional_angle',
        ),
        
        # Change battery_level from Float to CharField
        migrations.AlterField(
            model_name='tracking',
            name='battery_level',
            field=models.CharField(
                blank=True,
                help_text="Battery level (e.g., 'High', 'Medium', 'Low', '75%')",
                max_length=50,
                null=True
            ),
        ),
        
        # Change signal_strength from Float to CharField
        migrations.AlterField(
            model_name='tracking',
            name='signal_strength',
            field=models.CharField(
                blank=True,
                help_text="Signal strength (e.g., 'Excellent', 'Good', 'Weak', '4 bars')",
                max_length=50,
                null=True
            ),
        ),
    ]

