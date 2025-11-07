# Generated migration - Change OTPVerification from phone to email

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('authentication', '0001_initial'),
    ]

    operations = [
        # Rename phone field to email
        migrations.RenameField(
            model_name='otpverification',
            old_name='phone',
            new_name='email',
        ),
        # Change email field type to EmailField
        migrations.AlterField(
            model_name='otpverification',
            name='email',
            field=models.EmailField(max_length=255),
        ),
        # Update PURPOSE_CHOICES to replace phone_verification with email_verification
        migrations.AlterField(
            model_name='otpverification',
            name='purpose',
            field=models.CharField(
                choices=[
                    ('login', 'Login'),
                    ('registration', 'Registration'),
                    ('password_reset', 'Password Reset'),
                    ('email_verification', 'Email Verification')
                ],
                max_length=20
            ),
        ),
    ]

