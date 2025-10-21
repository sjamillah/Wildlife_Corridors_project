import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Import only the essential components needed immediately
import ProtectedRoute from './components/ProtectedRoute';

// Lazy load all screens for code splitting
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

// Loading fallback component
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
      <div className="App">
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
          {/* Default route - send unauthenticated users to signup/login */}
          <Route
            path="/"
            element={
              // Always start at the authentication entry (signin/signup)
              <Navigate to="/auth" replace />
            }
          />
          
          {/* Authentication routes */}
          <Route path="/auth" element={<Auth />} />
          
          {/* Protected application routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* Wildlife Tracking Route */}
          <Route 
            path="/wildlife-tracking" 
            element={
              <ProtectedRoute>
                <WildlifeTracking />
              </ProtectedRoute>
            } 
          />


          
          {/* Live Tracking Route */}
          <Route 
            path="/tracking" 
            element={
              <ProtectedRoute>
                <LiveTracking />
              </ProtectedRoute>
            } 
          />
          
          {/* Additional protected routes */}
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
          
          {/* Catch all route - redirect to auth or dashboard */}
          <Route 
            path="*" 
            element={
              // Any unknown route should send users to the auth entrypoint
              <Navigate to="/auth" replace />
            } 
          />
        </Routes>
        </Suspense>
      </div>
    </Router>
  );
}

export default App;