import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { LoginPage } from "./components/LoginPage";
import { RegisterPage } from "./components/RegisterPage";
import { AuthProvider } from "./hooks/AuthProvider";
import { DashboardPage } from "./components/DahsboardPage";
import { GuestRoute } from "./components/GuestRoute";
import { ProtectedRoute } from "./components/ProtectedRoute";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<DashboardPage />} />
          </Route>
          <Route element={<GuestRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>
          <Route path='*' element={<Navigate to='/' replace/>}/>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
