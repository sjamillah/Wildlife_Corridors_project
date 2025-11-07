/**
 * API Integration Checker
 * 
 * Validates that all backend endpoints are accessible and returning expected data
 */

import { API_BASE_URL } from './api';
import api, { publicApi } from './api';

const IntegrationCheck = {
  /**
   * Check if backend is accessible
   */
  checkBackendHealth: async () => {
    try {
      const response = await api.get('/health/');
      console.log('[OK] Backend health check passed:', response.data);
      return {
        success: true,
        data: response.data,
        message: 'Backend is healthy'
      };
    } catch (error) {
      console.error('[ERROR] Backend health check failed:', error.message);
      return {
        success: false,
        error: error.message,
        message: 'Backend is not accessible'
      };
    }
  },

  /**
   * Check API root endpoint
   */
  checkApiRoot: async () => {
    try {
      const response = await publicApi.get('/');
      console.log('[OK] API Root check passed');
      console.log('  Service:', response.data.service);
      console.log('  Version:', response.data.version);
      console.log('  Available endpoints:', Object.keys(response.data.endpoints || {}).length);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('[ERROR] API Root check failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Check Animals endpoints
   */
  checkAnimalsEndpoints: async () => {
    const results = {
      getAll: false,
      liveStatus: false,
    };

    try {
      // Test GET /api/v1/animals/
      const animalsResponse = await api.get('/api/v1/animals/');
      results.getAll = true;
      console.log(`[OK] Animals GET: ${(animalsResponse.data.results || animalsResponse.data || []).length} animals found`);
    } catch (error) {
      console.error('[ERROR] Animals GET failed:', error.message);
    }

    try {
      // Test GET /api/v1/animals/live_status/
      const liveStatusResponse = await api.get('/api/v1/animals/live_status/');
      results.liveStatus = true;
      console.log(`[OK] Live Status: ${liveStatusResponse.data.length || 0} active animals`);
    } catch (error) {
      console.error('[ERROR] Live Status failed:', error.message);
    }

    return results;
  },

  /**
   * Check Tracking endpoints
   */
  checkTrackingEndpoints: async () => {
    const results = {
      getAll: false,
      live: false,
      liveTracking: false,
    };

    try {
      // Test GET /api/v1/tracking/
      const trackingResponse = await api.get('/api/v1/tracking/');
      results.getAll = true;
      console.log(`[OK] Tracking GET: ${(trackingResponse.data.results || trackingResponse.data || []).length} records found`);
    } catch (error) {
      console.error('[ERROR] Tracking GET failed:', error.message);
    }

    try {
      // Test GET /api/v1/tracking/live/
      const liveResponse = await api.get('/api/v1/tracking/live/');
      results.live = true;
      console.log(`[OK] Tracking Live: ${(liveResponse.data.results || liveResponse.data || []).length} live records`);
    } catch (error) {
      console.error('[ERROR] Tracking Live failed:', error.message);
    }

    try {
      // Test GET /api/v1/tracking/live_tracking/
      const liveTrackingResponse = await api.get('/api/v1/tracking/live_tracking/');
      results.liveTracking = true;
      console.log('[OK] Live Tracking (ML Pipeline): Available');
      console.log('  Season:', liveTrackingResponse.data.season);
      console.log('  Species data:', (liveTrackingResponse.data.species_data || []).length);
    } catch (error) {
      console.error('[ERROR] Live Tracking (ML Pipeline) failed:', error.message);
    }

    return results;
  },

  /**
   * Check Corridors endpoints
   */
  checkCorridorsEndpoints: async () => {
    const results = {
      getAll: false,
    };

    try {
      // Test GET /api/v1/corridors/
      const corridorsResponse = await api.get('/api/v1/corridors/');
      results.getAll = true;
      console.log(`[OK] Corridors GET: ${(corridorsResponse.data.results || corridorsResponse.data || []).length} corridors found`);
    } catch (error) {
      console.error('[ERROR] Corridors GET failed:', error.message);
    }

    return results;
  },

  /**
   * Check Conflict Zones endpoints
   */
  checkConflictZonesEndpoints: async () => {
    const results = {
      getAll: false,
    };

    try {
      // Test GET /api/v1/conflict-zones/
      const conflictZonesResponse = await api.get('/api/v1/conflict-zones/');
      results.getAll = true;
      console.log(`[OK] Conflict Zones GET: ${(conflictZonesResponse.data.results || conflictZonesResponse.data || []).length} zones found`);
    } catch (error) {
      console.error('[ERROR] Conflict Zones GET failed:', error.message);
    }

    return results;
  },

  /**
   * Check Predictions endpoints
   */
  checkPredictionsEndpoints: async () => {
    const results = {
      getAll: false,
    };

    try {
      // Test GET /api/v1/predictions/
      const predictionsResponse = await api.get('/api/v1/predictions/');
      results.getAll = true;
      console.log(`[OK] Predictions GET: ${(predictionsResponse.data.results || predictionsResponse.data || []).length} predictions found`);
    } catch (error) {
      console.error('[ERROR] Predictions GET failed:', error.message);
    }

    return results;
  },

  /**
   * Check Synchronization endpoints
   */
  checkSyncEndpoints: async () => {
    const results = {
      getAll: false,
    };

    try {
      // Test GET /api/v1/sync/logs/
      const syncResponse = await api.get('/api/v1/sync/logs/');
      results.getAll = true;
      console.log(`[OK] Sync Logs GET: ${(syncResponse.data.results || syncResponse.data || []).length} sync logs found`);
    } catch (error) {
      console.error('[ERROR] Sync GET failed:', error.message);
    }

    return results;
  },

  /**
   * Check Reports endpoints
   */
  checkReportsEndpoints: async () => {
    const results = {
      getAll: false,
      getCategories: false,
      getTemplates: false,
    };

    try {
      // Test GET /api/v1/reports/
      const reportsResponse = await api.get('/api/v1/reports/');
      results.getAll = true;
      console.log(`[OK] Reports GET: ${(reportsResponse.data.results || reportsResponse.data || []).length} reports found`);
    } catch (error) {
      console.error('[ERROR] Reports GET failed:', error.message);
    }

    try {
      // Test GET /api/v1/reports/categories/
      const categoriesResponse = await api.get('/api/v1/reports/categories/');
      results.getCategories = true;
      console.log(`[OK] Report Categories GET: ${(categoriesResponse.data.results || categoriesResponse.data || []).length} categories found`);
    } catch (error) {
      console.error('[ERROR] Report Categories GET failed:', error.message);
    }

    try {
      // Test GET /api/v1/reports/templates/
      const templatesResponse = await api.get('/api/v1/reports/templates/');
      results.getTemplates = true;
      console.log(`[OK] Report Templates GET: ${(templatesResponse.data.results || templatesResponse.data || []).length} templates found`);
    } catch (error) {
      console.error('[ERROR] Report Templates GET failed:', error.message);
    }

    return results;
  },

  /**
   * Run all integration checks
   */
  runFullCheck: async () => {
    console.log('===========================================================');
    console.log('Running Full API Integration Check');
    console.log('API URL:', API_BASE_URL);
    console.log('===========================================================\n');

    const results = {
      timestamp: new Date().toISOString(),
      apiUrl: API_BASE_URL,
      checks: {},
      notImplemented: [] // Track not-yet-implemented endpoints
    };

    console.log('1. Checking Backend Health...');
    results.checks.health = await IntegrationCheck.checkBackendHealth();
    console.log('');

    console.log('2. Checking API Root...');
    results.checks.apiRoot = await IntegrationCheck.checkApiRoot();
    console.log('');

    console.log('3. Checking Animals Endpoints...');
    results.checks.animals = await IntegrationCheck.checkAnimalsEndpoints();
    console.log('');

    console.log('4. Checking Tracking Endpoints...');
    results.checks.tracking = await IntegrationCheck.checkTrackingEndpoints();
    console.log('');

    console.log('5. Checking Corridors Endpoints...');
    results.checks.corridors = await IntegrationCheck.checkCorridorsEndpoints();
    console.log('');

    console.log('6. Checking Conflict Zones Endpoints...');
    results.checks.conflictZones = await IntegrationCheck.checkConflictZonesEndpoints();
    console.log('');

    console.log('7. Checking Predictions Endpoints...');
    results.checks.predictions = await IntegrationCheck.checkPredictionsEndpoints();
    console.log('');

    console.log('8. Checking Sync Endpoints...');
    results.checks.sync = await IntegrationCheck.checkSyncEndpoints();
    console.log('');

    console.log('9. Checking Reports Endpoints...');
    results.checks.reports = await IntegrationCheck.checkReportsEndpoints();
    console.log('');

    console.log('===========================================================');
    console.log('[COMPLETE] Integration Check Complete!');
    console.log('===========================================================');

    // Summary
    const allChecks = [
      results.checks.health?.success,
      results.checks.apiRoot?.success,
      ...Object.values(results.checks.animals || {}),
      ...Object.values(results.checks.tracking || {}),
      ...Object.values(results.checks.corridors || {}),
      ...Object.values(results.checks.conflictZones || {}),
      ...Object.values(results.checks.predictions || {}),
      ...Object.values(results.checks.sync || {}),
      ...Object.values(results.checks.reports || {}),
    ];

    const successCount = allChecks.filter(c => c === true).length;
    const totalCount = allChecks.length;

    console.log(`\n[SUMMARY] ${successCount}/${totalCount} checks passed`);
    
    if (results.notImplemented.length > 0) {
      console.log(`\n[WARNING] Not Yet Implemented: ${results.notImplemented.join(', ')}`);
    }

    return results;
  }
};

// Make available globally for console testing
if (typeof window !== 'undefined') {
  window.IntegrationCheck = IntegrationCheck;
}

export default IntegrationCheck;

