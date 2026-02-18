import { type RaceEntry } from '@/features/entries/types';

export interface Metrics {
    totalRaces: number;
    correctPredictions: number;
    accuracy: number;
    recentAccuracy: number;
}

export function calculateMetrics(entries: RaceEntry[]): Metrics {
    const totalRaces = entries.length;

    if (totalRaces === 0) {
        return {
            totalRaces: 0,
            correctPredictions: 0,
            accuracy: 0,
            recentAccuracy: 0
        };
    }

    const correctPredictions = entries.filter((e) => e.predictedWinner === e.actualWinner).length;
    const accuracy = Math.round((correctPredictions / totalRaces) * 100);

    // Calculate recent accuracy (last 10 races)
    const recentEntries = entries.slice(-10);
    const recentCorrect = recentEntries.filter((e) => e.predictedWinner === e.actualWinner).length;
    const recentAccuracy = recentEntries.length > 0 ? Math.round((recentCorrect / recentEntries.length) * 100) : 0;

    return {
        totalRaces,
        correctPredictions,
        accuracy,
        recentAccuracy
    };
}
