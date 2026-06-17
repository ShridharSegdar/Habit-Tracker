import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-obsidian text-cyber font-mono">
        <span className="label">Authenticating…</span>
      </div>
    );
  }
  if (!user && !location.state?.user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}
