import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { SnailWins } from '../types/dashboard';
import { CHART_COLORS } from '../styles/chartColors';

export function VictoriesBarChart({ data }: { data: SnailWins[] }) {
    const summary = data.map((item) => `${item.name}: ${item.wins}`).join(', ');

    return (
        <section className="dashboard-card dashboard-card--victories">
            <h2>Victorias por caracol</h2>
            <div
                className="dashboard-chart"
                role="img"
                aria-label={`Victorias por caracol. ${summary}`}
            >
                <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 480, height: 300 }}>
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3"     
                        stroke="#94A3B8"
                        strokeOpacity={0.3}
                        />
                        <XAxis dataKey="name" />
                        <YAxis allowDecimals={false} />
                        <Tooltip itemStyle={{fontWeight: "bold",}} labelStyle={{fontWeight: "bold",}}/>
                        <Bar dataKey="wins" name="Victorias" fill={CHART_COLORS.bar} radius={[5, 5, 0, 0]}/>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </section>
    );
}