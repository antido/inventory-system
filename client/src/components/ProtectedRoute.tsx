// Route guards:
//   <RequireAuth>          -> sends logged out visitors to /login
//   <RequirePrivilege ...> -> shows "no access" if the user lacks a privilege
import { ShieldX } from 'lucide-react';
import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="page-loading">Loading…</div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return children;
}

export function RequirePrivilege({ privilege, children }: { privilege: string; children: ReactNode }) {
  const { can } = useAuth();

  if (!can(privilege)) {
    return (
      <div className="empty-state">
        <ShieldX size={40} />
        <h2>No access</h2>
        <p>You need the "{privilege}" privilege to open this page.</p>
      </div>
    );
  }
  return children;
}
