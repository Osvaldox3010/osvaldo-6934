import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export function GuestRoute() {
    const { user } = useAuth();

    return user !== null ? <Navigate to="/Dashboard" replace /> : <Outlet />;
}