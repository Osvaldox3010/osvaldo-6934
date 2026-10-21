
// export function countStageWins(marathon: Marathon): RunnerWins[] {
//     return marathon.runners.map((runner) => ({
//         name: runner.name,
//         wins: marathon.stages.filter((stage) => stage.winnerId === runner.id).length,
//     }));
// }

import { SimulatedDay, SnailWins, Bet, Race, BetsSummary } from "../types/dashboard";

export function getVictoriesBySnail(day: SimulatedDay): SnailWins[] {

    return day.snails.map((runner) => ({
        name: runner.name,
        wins: day.races.filter((races) => races.winnerId === runner.id).length,
    }));
};

export function isBetWon(bet: Bet, races: Race[]): boolean {

    return races.find((race) => race.winnerId === bet.snailId && race.number === bet.raceNumber) ? true: false;

}

export function getBetsSummary(day: SimulatedDay): BetsSummary {
    const won = day.bets.filter((bet) => isBetWon(bet, day.races)).length;
    const total = day.bets.length;

    return {
        won,
        lost: total - won,
        total,
    };
}

export function formatCurrency(amount: number): string {

    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);

}