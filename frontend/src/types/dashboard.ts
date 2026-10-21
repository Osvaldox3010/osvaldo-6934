export interface Snail {
    id: string;
    name: string;
};

export interface Race {
    number: number;
    winnerId: string;
};

export interface Bet {
    raceNumber: number;
    snailId: string;
};

export interface SimulatedDay {
    snails: Snail[];
    races: Race[];
    bets: Bet[];
};

export interface SnailWins {
    name: string;
    wins: number;
}

export interface BetsSummary {
    won: number;
    lost: number;
    total: number;
};