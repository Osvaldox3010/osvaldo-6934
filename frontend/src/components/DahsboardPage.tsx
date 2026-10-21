import { useAuth } from '../hooks/useAuth';

export function DashboardPage() {
    const { user, logout } = useAuth();

    if (user === null) {
        return null;
    }

    return (
        <main>
            <h1>Hola, {user.fullName}</h1>
            <p>{user.email}</p>
            <button type="button" onClick={logout}>
                Cerrar sesión
            </button>
        </main>
    );
}