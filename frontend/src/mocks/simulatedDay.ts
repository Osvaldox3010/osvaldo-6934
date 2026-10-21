import {SimulatedDay } from '../types/dashboard';

export const simulatedDay: SimulatedDay = {
    snails: [
        {id: 'S1', name: 'turbo'},
        {id: 'S2', name: 'Chet'},
        {id: 'S3', name: 'Carl'},
        {id: 'S4', name: 'Pólvora'},
        {id: 'S5', name: 'Speedy'},
        {id: 'S6', name: 'Rocco'},
    ],
    races: [
        {number: 1, winnerId: 'S1'},
        {number: 2, winnerId: 'S4'},
        {number: 3, winnerId: 'S6'},
        {number: 4, winnerId: 'S1'},
        {number: 5, winnerId: 'S1'},
        {number: 6, winnerId: 'S5'},
    ],
    bets: [
        {raceNumber: 1, snailId: 'S1'},
        {raceNumber: 1, snailId: 'S2'},
        {raceNumber: 2, snailId: 'S1'},
        {raceNumber: 2, snailId: 'S2'},
        {raceNumber: 3, snailId: 'S5'},
        {raceNumber: 3, snailId: 'S2'},
        {raceNumber: 3, snailId: 'S3'},
        {raceNumber: 4, snailId: 'S5'},
        {raceNumber: 5, snailId: 'S1'},
        {raceNumber: 6, snailId: 'S2'},
    ],
}