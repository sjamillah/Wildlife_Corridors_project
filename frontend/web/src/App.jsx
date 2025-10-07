import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Import screens and components
import Auth from './screens/auth/Auth';
import Dashboard from './screens/main/Dashboard';
import WildlifeTracking from './screens/wildlife/WildlifeTracking';
import AlertHub from './screens/wildlife/AlertHub';
import LiveTracking from './screens/operations/LiveTracking';
import PatrolOperations from './screens/operations/PatrolOperations';
import Analytics from './screens/operations/Analytics';
import Settings from './screens/management/Settings';
import Reports from './screens/management/Reports';
import TeamManagement from './screens/management/TeamManagement';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <div className="App">
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
      </div>
    </Router>
  );
}

export default App;