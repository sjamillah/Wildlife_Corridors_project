import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

import ProtectedRoute from './components/ProtectedRoute';
import { DataProvider } from './contexts/DataContext';

if (process.env.NODE_ENV === 'development') {
  import('./utils/testIntegration').then(() => {
    console.log('Development Mode: Integration test utilities are available');
    console.log('Run window.testIntegration.runFull() to test backend connection');
  });
}
const Auth = lazy(() => import('./screens/auth/Auth'));
const Dashboard = lazy(() => import('./screens/main/Dashboard'));
const WildlifeTracking = lazy(() => import('./screens/wildlife/WildlifeTracking'));
const AlertHub = lazy(() => import('./screens/wildlife/AlertHub'));
const LiveTracking = lazy(() => import('./screens/operations/LiveTracking'));
const PatrolOperations = lazy(() => import('./screens/operations/PatrolOperations'));
const Analytics = lazy(() => import('./screens/operations/Analytics'));
const Settings = lazy(() => import('./screens/management/Settings'));
const Reports = lazy(() => import('./screens/management/Reports'));
const TeamManagement = lazy(() => import('./screens/management/TeamManagement'));

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
      <p className="mt-4 text-gray-600 font-medium">Loading...</p>
    </div>
  </div>
);

function App() {
  return (
    <Router>
      <DataProvider>
        <div className="App">
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
          <Route
            path="/"
            element={
              <Navigate to="/dashboard" replace />
            }
          />
          
          <Route path="/auth" element={<Auth />} />
          
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/wildlife-tracking" 
            element={
              <ProtectedRoute>
                <WildlifeTracking />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/tracking" 
            element={
              <ProtectedRoute>
                <LiveTracking />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/alerts" 
            element={
              <ProtectedRoute>
                <AlertHub />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/patrol-operations" 
            element={
              <ProtectedRoute>
                <PatrolOperations />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/analytics" 
            element={
              <ProtectedRoute>
                <Analytics />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/settings" 
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/reports" 
            element={
              <ProtectedRoute>
                <Reports />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/team" 
            element={
              <ProtectedRoute>
                <TeamManagement />
              </ProtectedRoute>
            } 
          />
          
          <Route
            path="*" 
            element={
              <Navigate to="/auth" replace />
            }
          />
            </Routes>
          </Suspense>
        </div>
      </DataProvider>
    </Router>
  );
}

export default App;