
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { CHART_COLORS } from '../styles/chartColors';
import { BetsSummary } from '../types/dashboard';

export function BetsDonutChart({
    summary,
    animate = true,
}: {
    summary: BetsSummary;
    animate?: boolean;
}) {
    const data = [
        { name: 'Ganadas', value: summary.won, fill: CHART_COLORS.won },
        { name: 'Perdidas', value: summary.lost, fill: CHART_COLORS.lost },
    ];

    if (summary.total === 0) {
        return <p className="dashboard-empty-state">Aún no hay apuestas</p>;
    }

    return (
        <div
            className="dashboard-chart bets-donut-chart"
            role="group"
            aria-label={`Resumen de ${summary.total} apuestas`}
        >
            <div className="bets-donut-chart__visual">
                <div className="bets-donut-chart__graph" role="img" aria-label="Gráfico de apuestas ganadas y perdidas">
                    <ResponsiveContainer
                        width="100%"
                        height="100%"
                        initialDimension={{ width: 480, height: 240 }}
                    >
                        <PieChart>
                            <Tooltip itemStyle={{ fontWeight: 'bold' }} />
                            <Pie
                                data={data}
                                dataKey="value"
                                nameKey="name"
                                innerRadius="55%"
                                outerRadius="78%"
                                isAnimationActive={animate}
                            >
                                {data.map((entry) => (
                                    <Cell key={entry.name} fill={entry.fill} />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                <div className="bets-donut-chart__legend" aria-hidden="true">
                    <span>
                        <i style={{ backgroundColor: CHART_COLORS.won }} />
                        Ganadas
                    </span>
                    <span>
                        <i style={{ backgroundColor: CHART_COLORS.lost }} />
                        Perdidas
                    </span>
                </div>
            </div>

            <div className="bets-donut-chart__stats">
                <div className="bets-donut-chart__stat">
                    <span>Ganadas</span>
                    <strong style={{ color: CHART_COLORS.won }}>
                        {summary.won}
                    </strong>
                </div>

                <div className="bets-donut-chart__stat">
                    <span>Perdidas</span>
                    <strong style={{ color: CHART_COLORS.lost }}>
                        {summary.lost}
                    </strong>
                </div>
            </div>
        </div>
    );
}
