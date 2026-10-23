import { useAuth } from '../hooks/useAuth';
import { DashboardHeader } from '../components/DashboardHeader';
import { VictoriesBarChart } from '../components/VictoriesBarChart';
import { BetsDonutChart } from '../components/BetsDonutChart';
import { getBetsSummary, getVictoriesBySnail } from '../services/dashboardStats';
import { simulatedDay } from '../mocks/simulatedDay';
import '../styles/DashboardPage.css';

export function DashboardPage() {
    const { user, logout } = useAuth();

    if (user === null) {
        return null;
    }

    const victories = getVictoriesBySnail(simulatedDay);
    const betsSummary = getBetsSummary(simulatedDay);

    return (
        <main className="dashboard-page">
            <DashboardHeader
                fullName={user.fullName}
                balance={user.balance}
                onLogout={logout}
            />
            <div className="dashboard-grid" aria-label="Resumen del dashboard">
                <VictoriesBarChart data={victories} />
                <section className="dashboard-card dashboard-card--bets">
                    <h2>Resumen de apuestas</h2>
                    <BetsDonutChart summary={betsSummary} />
                </section>
            </div>
        </main>
    );
}