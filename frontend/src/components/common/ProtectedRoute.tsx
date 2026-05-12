import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAppSelector } from '../../store';
import { UserRole } from '../../types';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
  redirectPath?: string;
  roles?: UserRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, roles, redirectPath = '/' }) => {
  const { isAuthenticated, user, isLoading } = useAppSelector((s) => s.auth);
  const permitted = allowedRoles ?? roles;
  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/auth/login" replace />;
  if (permitted && user && !permitted.includes(user.role)) return <Navigate to={redirectPath} replace />;
  return <Outlet />;
};

export default ProtectedRoute;
