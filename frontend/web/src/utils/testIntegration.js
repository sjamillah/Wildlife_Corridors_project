/**
 * Integration Test Utilities
 * 
 * Helper functions for testing backend-frontend integration
 */

import { IntegrationCheck } from '../services';
import { API_BASE_URL } from '../services/api';

/**
 * Run comprehensive integration tests
 */
export const runIntegrationTests = async () => {
  console.log('Starting comprehensive integration tests...\n');
  
  const results = await IntegrationCheck.runFullCheck();
  
  // Analyze results
  const failures = [];
  
  if (!results.checks.health?.success) {
    failures.push(' Backend health check failed - backend may not be running');
  }
  
  if (!results.checks.apiRoot?.success) {
    failures.push(' API root check failed - backend may not be accessible');
  }
  
  if (!results.checks.animals?.liveStatus) {
    failures.push('[WARNING] Live Status endpoint not working - real-time tracking may not work');
  }
  
  if (!results.checks.tracking?.liveTracking) {
    failures.push('[WARNING] ML Pipeline (live_tracking) not available - advanced predictions disabled');
  }
  
  // Display summary
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('[RESULTS] Test Results Summary');
  
  if (failures.length === 0) {
    console.log(' All tests passed! Backend integration is working perfectly.');
    console.log('\n[SUCCESS] You can now use all features of the Wildlife Corridors platform!');
  } else {
    console.log(`[WARNING] ${failures.length} issue(s) detected:\n`);
    failures.forEach(failure => console.log(failure));
    console.log('\n[HELP] Troubleshooting tips:');
    console.log('1. Make sure the backend is running (python manage.py runserver)');
    console.log('2. Check your .env.local file has the correct REACT_APP_API_URL');
    console.log('3. Verify CORS is properly configured in backend settings');
    console.log('4. Check backend logs for any errors');
  }
  
  console.log('═══════════════════════════════════════════════════════\n');
  
  return {
    success: failures.length === 0,
    failures,
    results
  };
};

/**
 * Quick connection test
 */
export const quickConnectionTest = async () => {
  console.log('[TEST] Quick Connection Test');
  console.log('API URL:', API_BASE_URL);
  
  try {
    const health = await IntegrationCheck.checkBackendHealth();
    if (health.success) {
      console.log(' Backend is accessible and healthy!');
      return true;
    } else {
      console.log(' Backend is not responding');
      console.log('Error:', health.error);
      return false;
    }
  } catch (error) {
    console.log(' Connection failed:', error.message);
    return false;
  }
};

/**
 * Test specific endpoint
 */
export const testEndpoint = async (endpoint) => {
  console.log(`Testing endpoint: ${endpoint}`);
  
  try {
    const { api } = await import('../services');
    const response = await api.get(endpoint);
    console.log(' Success:', response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.log(' Failed:', error.message);
    console.log('Details:', error.response?.data);
    return { success: false, error: error.message, details: error.response?.data };
  }
};

/**
 * Test authentication flow
 */
export const testAuthFlow = async (email) => {
  console.log('[AUTH] Testing Authentication Flow');
  console.log('Email:', email);
  
  try {
    const { auth } = await import('../services');
    
    // Step 1: Send OTP
    console.log('Step 1: Sending OTP...');
    const otpResult = await auth.sendLoginOTP(email);
    console.log(' OTP sent successfully');
    console.log('Message:', otpResult.message);
    console.log('Expires in:', otpResult.expires_in, 'seconds');
    
    console.log('\n[INFO] Check your email for the OTP code');
    console.log('Then run: testAuthVerify("your-email@example.com", "123456")');
    
    return { success: true, otpResult };
  } catch (error) {
    console.log(' Auth test failed:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Test OTP verification
 */
export const testAuthVerify = async (email, otpCode) => {
  console.log('[AUTH] Testing OTP Verification');
  
  try {
    const { auth } = await import('../services');
    const result = await auth.verifyLoginOTP(email, otpCode);
    console.log(' Login successful!');
    console.log('User:', result.user);
    console.log('Token stored in localStorage');
    
    return { success: true, user: result.user };
  } catch (error) {
    console.log(' Verification failed:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Test animals API
 */
export const testAnimalsAPI = async () => {
  console.log(' Testing Animals API');
  
  try {
    const { animals } = await import('../services');
    
    console.log('Fetching all animals...');
    const allAnimals = await animals.getAll();
    console.log(` Found ${(allAnimals.results || allAnimals || []).length} animals`);
    
    console.log('\nFetching live status...');
    const liveStatus = await animals.getLiveStatus();
    console.log(` Live status for ${(liveStatus.results || liveStatus || []).length} active animals`);
    
    // Show first animal details
    const firstAnimal = (liveStatus.results || liveStatus || [])[0];
    if (firstAnimal) {
      console.log('\nFirst animal details:');
      console.log('  Name:', firstAnimal.animal_name || firstAnimal.animal);
      console.log('  Species:', firstAnimal.species);
      console.log('  Location:', `[${firstAnimal.current_lat}, ${firstAnimal.current_lon}]`);
      console.log('  In Corridor:', firstAnimal.in_corridor);
      console.log('  Risk Level:', firstAnimal.risk_level);
    }
    
    return { success: true, count: (allAnimals.results || allAnimals || []).length };
  } catch (error) {
    console.log('Animals API test failed:', error.message);
    return { success: false, error: error.message };
  }
};

export const showAPIConfig = () => {
  console.log('API Configuration');
  console.log('API URL:', API_BASE_URL);
  console.log('Auth Token:', localStorage.getItem('authToken') ? ' Present' : ' Not logged in');
  console.log('User Profile:', localStorage.getItem('userProfile') ? ' Present' : ' No profile');
};

if (typeof window !== 'undefined') {
  window.testIntegration = {
    runFull: runIntegrationTests,
    quickTest: quickConnectionTest,
    testEndpoint,
    testAuth: testAuthFlow,
    testAuthVerify,
    testAnimals: testAnimalsAPI,
    showConfig: showAPIConfig,
  };
  
  console.log(' Integration test utilities loaded!');
  console.log('Available commands:');
  console.log('  window.testIntegration.runFull() - Run all tests');
  console.log('  window.testIntegration.quickTest() - Quick connection test');
  console.log('  window.testIntegration.testEndpoint("/api/v1/animals/") - Test specific endpoint');
  console.log('  window.testIntegration.testAuth("your@email.com") - Test login flow');
  console.log('  window.testIntegration.testAnimals() - Test animals API');
  console.log('  window.testIntegration.showConfig() - Show current config');
}

const testIntegration = {
  runIntegrationTests,
  quickConnectionTest,
  testEndpoint,
  testAuthFlow,
  testAuthVerify,
  testAnimalsAPI,
  showAPIConfig,
};

export default testIntegration;

