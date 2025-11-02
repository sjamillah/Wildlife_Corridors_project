"""
Management command to create a superuser with proper role
"""
import os
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCommand):
    help = 'Create a superuser with admin role'

    def add_arguments(self, parser):
        parser.add_argument('--email', type=str, help='Email address')
        parser.add_argument('--name', type=str, help='Full name')
        parser.add_argument('--password', type=str, help='Password')
        parser.add_argument('--role', type=str, default='admin', help='User role')

    def handle(self, *args, **options):
        # Get from arguments or environment variables
        email = options.get('email') or os.environ.get('DJANGO_SUPERUSER_EMAIL')
        name = options.get('name') or os.environ.get('DJANGO_SUPERUSER_NAME', 'Admin User')
        password = options.get('password') or os.environ.get('DJANGO_SUPERUSER_PASSWORD')
        role = options.get('role') or os.environ.get('DJANGO_SUPERUSER_ROLE', 'admin')

        if not email or not password:
            self.stdout.write(
                self.style.WARNING('Skipping superuser creation - no credentials provided')
            )
            return

        if User.objects.filter(email=email).exists():
            self.stdout.write(
                self.style.WARNING(f'User with email {email} already exists')
            )
            return

        user = User.objects.create_superuser(
            email=email,
            name=name,
            password=password,
            role=role
        )

        self.stdout.write(
            self.style.SUCCESS(f'Successfully created {role} user: {email}')
        )
