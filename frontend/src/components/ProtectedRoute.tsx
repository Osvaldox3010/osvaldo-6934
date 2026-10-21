import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export function ProtectedRoute() {
    const { user } = useAuth();

    return user === null ? <Navigate to="/register" replace /> : <Outlet />;
}