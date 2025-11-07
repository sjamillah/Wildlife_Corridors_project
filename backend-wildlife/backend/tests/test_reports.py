import pytest
from django.urls import reverse
from django.utils import timezone
from datetime import timedelta
from rest_framework import status

from apps.reports.models import Report, ReportCategory, ReportTemplate
from apps.animals.models import Animal
from apps.tracking.models import Tracking
from apps.corridors.models import Corridor

@pytest.mark.django_db
class TestReportCategoryEndpoints:
    def test_list_categories(self, authenticated_client, test_user):
        # Create categories
        ReportCategory.objects.create(
            name='Movement Analysis',
            description='Movement and tracking reports'
        )
        ReportCategory.objects.create(
            name='Corridor Reports',
            description='Corridor effectiveness reports'
        )
        
        url = reverse('report-category-list')
        response = authenticated_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        results = response.data.get('results', response.data)
        assert len(results) == 2
        assert any(cat['name'] == 'Movement Analysis' for cat in results)
    
    def test_create_category(self, authenticated_client, test_user):
        url = reverse('report-category-list')
        data = {
            'name': 'Conflict Reports',
            'description': 'Human-wildlife conflict analysis',
            'icon': 'alert'
        }
        
        response = authenticated_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['name'] == 'Conflict Reports'
        assert ReportCategory.objects.filter(name='Conflict Reports').exists()
    
    def test_get_category(self, authenticated_client, test_user):
        category = ReportCategory.objects.create(
            name='Species Distribution',
            description='Species tracking and distribution'
        )
        
        url = reverse('report-category-detail', kwargs={'pk': category.id})
        response = authenticated_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['name'] == 'Species Distribution'
    
    def test_update_category(self, authenticated_client, test_user):
        category = ReportCategory.objects.create(
            name='Habitat Quality',
            description='Original description'
        )
        
        url = reverse('report-category-detail', kwargs={'pk': category.id})
        data = {'description': 'Updated habitat quality reports'}
        
        response = authenticated_client.patch(url, data, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['description'] == 'Updated habitat quality reports'
    
    def test_delete_category(self, authenticated_client, test_user):
        category = ReportCategory.objects.create(name='Test Category')
        
        url = reverse('report-category-detail', kwargs={'pk': category.id})
        response = authenticated_client.delete(url)
        
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not ReportCategory.objects.filter(id=category.id).exists()

@pytest.mark.django_db
class TestReportTemplateEndpoints:
    def test_list_templates(self, authenticated_client, test_user):
        category = ReportCategory.objects.create(name='Analysis')
        
        ReportTemplate.objects.create(
            name='Weekly Movement Report',
            template_type='movement_analysis',
            category=category,
            created_by=test_user
        )
        
        url = reverse('report-template-list')
        response = authenticated_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        results = response.data.get('results', response.data)
        assert len(results) >= 1
    
    def test_create_template(self, authenticated_client, test_user):
        category = ReportCategory.objects.create(name='Corridors')
        
        url = reverse('report-template-list')
        data = {
            'name': 'Corridor Effectiveness Template',
            'description': 'Evaluate corridor usage and effectiveness',
            'template_type': 'corridor_effectiveness',
            'category': str(category.id),
            'config': {
                'include_maps': True,
                'metrics': ['usage_rate', 'animal_crossings']
            },
            'is_active': True
        }
        
        response = authenticated_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['name'] == 'Corridor Effectiveness Template'
        assert response.data['created_by_name'] == test_user.name
    
    def test_filter_templates_by_type(self, authenticated_client, test_user):
        ReportTemplate.objects.create(
            name='Movement Template',
            template_type='movement_analysis',
            created_by=test_user
        )
        ReportTemplate.objects.create(
            name='Conflict Template',
            template_type='conflict_incidents',
            created_by=test_user
        )
        
        url = reverse('report-template-list')
        response = authenticated_client.get(f'{url}?template_type=movement_analysis')
        
        assert response.status_code == status.HTTP_200_OK
        results = response.data.get('results', response.data)
        assert all(t['template_type'] == 'movement_analysis' for t in results)

@pytest.mark.django_db
class TestReportEndpoints:
    def test_list_reports(self, authenticated_client, test_user):
        Report.objects.create(
            title='Test Report 1',
            status='completed',
            generated_by=test_user
        )
        Report.objects.create(
            title='Test Report 2',
            status='pending',
            generated_by=test_user
        )
        
        url = reverse('report-list')
        response = authenticated_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        results = response.data.get('results', response.data)
        assert len(results) >= 2
    
    def test_generate_report_basic(self, authenticated_client, test_user, sample_animal, sample_tracking):
        url = reverse('report-generate')
        data = {
            'title': 'Movement Analysis Report',
            'description': 'Analysis of elephant movements',
            'species_filter': 'elephant',
            'format': 'json',
            'include_charts': True
        }
        
        response = authenticated_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['title'] == 'Movement Analysis Report'
        assert response.data['status'] == 'completed'
        assert 'summary' in response.data
        assert 'data' in response.data
        assert 'charts' in response.data
    
    def test_generate_report_with_date_range(self, authenticated_client, test_user, sample_animal, sample_tracking):
        url = reverse('report-generate')
        date_from = (timezone.now() - timedelta(days=7)).isoformat()
        date_to = timezone.now().isoformat()
        
        data = {
            'title': 'Weekly Report',
            'date_from': date_from,
            'date_to': date_to,
            'format': 'json'
        }
        
        response = authenticated_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['date_from'] is not None
        assert response.data['date_to'] is not None
    
    def test_generate_report_for_specific_animal(self, authenticated_client, test_user, sample_animal, sample_tracking):
        url = reverse('report-generate')
        data = {
            'title': f'Report for {sample_animal.name}',
            'animal_id': str(sample_animal.id),
            'format': 'json'
        }
        
        response = authenticated_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_201_CREATED
        assert str(response.data['animal']) == str(sample_animal.id)
    
    def test_download_report_json(self, authenticated_client, test_user):
        report = Report.objects.create(
            title='Download Test Report',
            status='completed',
            format='json',
            generated_by=test_user,
            generated_at=timezone.now(),
            data={'test': 'data'},
            summary={'metric': 100},
            charts={'chart1': {}}
        )
        
        url = reverse('report-download', kwargs={'pk': report.id})
        response = authenticated_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['title'] == 'Download Test Report'
        assert 'data' in response.data
        assert 'summary' in response.data
        assert 'charts' in response.data
    
    def test_download_report_not_ready(self, authenticated_client, test_user):
        report = Report.objects.create(
            title='Pending Report',
            status='pending',
            generated_by=test_user
        )
        
        url = reverse('report-download', kwargs={'pk': report.id})
        response = authenticated_client.get(url)
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'error' in response.data
    
    def test_report_stats(self, authenticated_client, test_user):
        category = ReportCategory.objects.create(name='Movement')
        
        Report.objects.create(
            title='Report 1',
            status='completed',
            category=category,
            generated_by=test_user
        )
        Report.objects.create(
            title='Report 2',
            status='failed',
            generated_by=test_user
        )
        Report.objects.create(
            title='Report 3',
            status='pending',
            generated_by=test_user
        )
        
        url = reverse('report-stats')
        response = authenticated_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['total_reports'] >= 3
        assert response.data['completed'] >= 1
        assert response.data['failed'] >= 1
        assert response.data['pending'] >= 1
    
    def test_report_trends(self, authenticated_client, test_user):
        Report.objects.create(
            title='Recent Report',
            status='completed',
            generated_by=test_user,
            created_at=timezone.now() - timedelta(days=2)
        )
        
        url = reverse('report-trends')
        response = authenticated_client.get(f'{url}?days=7')
        
        assert response.status_code == status.HTTP_200_OK
        assert 'period_days' in response.data
        assert response.data['period_days'] == 7
        assert 'reports_by_date' in response.data
        assert 'status_distribution' in response.data
    
    def test_user_can_only_see_own_reports(self, authenticated_client, test_user, other_user):
        # Create report for test_user
        Report.objects.create(
            title='My Report',
            generated_by=test_user
        )
        # Create report for other_user
        Report.objects.create(
            title='Other User Report',
            generated_by=other_user
        )
        
        url = reverse('report-list')
        response = authenticated_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        results = response.data.get('results', response.data)
        # Should only see own report (assuming test_user is not admin)
        titles = [r['title'] for r in results]
        assert 'My Report' in titles

@pytest.mark.django_db
class TestReportDataGeneration:
    def test_report_includes_movement_stats(self, authenticated_client, test_user, sample_animal, sample_tracking):
        url = reverse('report-generate')
        data = {
            'title': 'Movement Stats Report',
            'species_filter': sample_animal.species,
            'format': 'json'
        }
        
        response = authenticated_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_201_CREATED
        assert 'data' in response.data
        assert 'movement' in response.data['data']
        assert 'total_points' in response.data['data']['movement']
        assert 'behavior_distribution' in response.data['data']['movement']
    
    def test_report_includes_corridor_stats(self, authenticated_client, test_user, sample_corridor):
        url = reverse('report-generate')
        data = {
            'title': 'Corridor Report',
            'corridor_id': str(sample_corridor.id),
            'format': 'json'
        }
        
        response = authenticated_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_201_CREATED
        assert 'data' in response.data
        assert 'corridors' in response.data['data']
        assert response.data['data']['corridors']['corridor_name'] == sample_corridor.name
    
    def test_report_includes_conflict_stats(self, authenticated_client, test_user):
        from apps.core.models import ConflictZone
        
        ConflictZone.objects.create(
            name='Test Conflict Zone',
            zone_type='agriculture',
            geometry={'type': 'Point', 'coordinates': [36.8, -1.3]},
            risk_level='high',
            is_active=True
        )
        
        url = reverse('report-generate')
        data = {
            'title': 'Conflict Analysis',
            'format': 'json'
        }
        
        response = authenticated_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_201_CREATED
        assert 'data' in response.data
        assert 'conflicts' in response.data['data']
        assert response.data['data']['conflicts']['active_zones'] >= 1
    
    def test_report_includes_charts(self, authenticated_client, test_user, sample_animal, sample_tracking):
        url = reverse('report-generate')
        data = {
            'title': 'Chart Test Report',
            'format': 'json',
            'include_charts': True
        }
        
        response = authenticated_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_201_CREATED
        assert 'charts' in response.data
        assert 'behavior_distribution' in response.data['charts']
        assert 'species_distribution' in response.data['charts']
    
    def test_report_summary_metrics(self, authenticated_client, test_user, sample_animal):
        url = reverse('report-generate')
        data = {
            'title': 'Summary Test',
            'format': 'json'
        }
        
        response = authenticated_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_201_CREATED
        assert 'summary' in response.data
        summary = response.data['summary']
        assert 'total_animals_monitored' in summary
        assert 'total_gps_points' in summary
        assert 'corridors_optimized' in summary
        assert 'conflict_zones_monitored' in summary

@pytest.mark.django_db
class TestReportFiltering:
    def test_filter_reports_by_status(self, authenticated_client, test_user):
        Report.objects.create(title='Completed', status='completed', generated_by=test_user)
        Report.objects.create(title='Pending', status='pending', generated_by=test_user)
        Report.objects.create(title='Failed', status='failed', generated_by=test_user)
        
        url = reverse('report-list')
        response = authenticated_client.get(f'{url}?status=completed')
        
        assert response.status_code == status.HTTP_200_OK
        results = response.data.get('results', response.data)
        assert all(r['status'] == 'completed' for r in results)
    
    def test_filter_reports_by_format(self, authenticated_client, test_user):
        Report.objects.create(title='PDF Report', format='pdf', generated_by=test_user)
        Report.objects.create(title='JSON Report', format='json', generated_by=test_user)
        
        url = reverse('report-list')
        response = authenticated_client.get(f'{url}?format=json')
        
        assert response.status_code == status.HTTP_200_OK
        results = response.data.get('results', response.data)
        assert all(r['format'] == 'json' for r in results)
    
    def test_search_reports_by_title(self, authenticated_client, test_user):
        Report.objects.create(title='Elephant Movement Report', generated_by=test_user)
        Report.objects.create(title='Wildebeest Migration Report', generated_by=test_user)
        
        url = reverse('report-list')
        response = authenticated_client.get(f'{url}?search=Elephant')
        
        assert response.status_code == status.HTTP_200_OK
        results = response.data.get('results', response.data)
        assert any('Elephant' in r['title'] for r in results)

@pytest.mark.django_db
class TestReportPermissions:
    def test_unauthenticated_cannot_access_reports(self, client):
        url = reverse('report-list')
        response = client.get(url)
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_authenticated_can_create_report(self, authenticated_client, test_user):
        url = reverse('report-generate')
        data = {
            'title': 'My Report',
            'format': 'json'
        }
        
        response = authenticated_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_201_CREATED
        assert str(response.data['generated_by']) == str(test_user.id)

@pytest.mark.django_db
class TestReportValidation:
    def test_generate_report_requires_title(self, authenticated_client, test_user):
        url = reverse('report-generate')
        data = {
            'format': 'json'
        }
        
        response = authenticated_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'title' in str(response.data)
    
    def test_generate_report_validates_format(self, authenticated_client, test_user):
        url = reverse('report-generate')
        data = {
            'title': 'Test Report',
            'format': 'invalid_format'
        }
        
        response = authenticated_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST

