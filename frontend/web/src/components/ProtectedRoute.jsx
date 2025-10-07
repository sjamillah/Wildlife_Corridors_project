import React from 'react';
import { Navigate } from 'react-router-dom';
import auth from '../services/auth';

const ProtectedRoute = ({ children }) => {
  if (!auth.isAuthenticated()) {
    return <Navigate to="/auth" replace />;
  }
  return children;
};

export default ProtectedRoute;