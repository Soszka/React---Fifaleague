import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RequireAuth() {
  const { user, loading } = useAuth();
  if (loading) return null; // spinner, skeleton - wg uznania
  return user ? <Outlet /> : <Navigate to="/auth" replace />;
}
