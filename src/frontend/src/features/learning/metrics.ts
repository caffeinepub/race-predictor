import { type RaceEntry } from '@/features/entries/types';

export interface Metrics {
    totalRaces: number;
    correctPredictions: number;
    accuracy: number;
    recentAccuracy: number;
    overallROI: number;
    totalBetAmount: number;
    totalPayout: number;
    brierScore: number;
    strategyROI: Record<string, number>;
}

export function calculateMetrics(entries: RaceEntry[], totalBetAmount: number, totalPayout: number): Metrics {
    const totalRaces = entries.length;

    if (totalRaces === 0) {
        return {
            totalRaces: 0,
            correctPredictions: 0,
            accuracy: 0,
            recentAccuracy: 0,
            overallROI: 0,
            totalBetAmount: 0,
            totalPayout: 0,
            brierScore: 0,
            strategyROI: {}
        };
    }

    const correctPredictions = entries.filter((e) => e.predictedWinner === e.actualWinner).length;
    const accuracy = Math.round((correctPredictions / totalRaces) * 100);

    // Calculate recent accuracy (last 10 races)
    const recentEntries = entries.slice(-10);
    const recentCorrect = recentEntries.filter((e) => e.predictedWinner === e.actualWinner).length;
    const recentAccuracy = recentEntries.length > 0 ? Math.round((recentCorrect / recentEntries.length) * 100) : 0;

    // Calculate overall ROI
    const overallROI = totalBetAmount > 0 ? Math.round(((totalPayout - totalBetAmount) / totalBetAmount) * 100) : 0;

    // Calculate Brier score (calibration metric)
    let brierScore = 0;
    let brierCount = 0;
    entries.forEach(entry => {
        if (entry.impliedProbabilities) {
            Object.keys(entry.impliedProbabilities).forEach(horseNum => {
                const predictedProb = (entry.impliedProbabilities![horseNum] || 0) / 100;
                const actualOutcome = horseNum === entry.actualWinner ? 1 : 0;
                brierScore += Math.pow(predictedProb - actualOutcome, 2);
                brierCount++;
            });
        }
    });
    brierScore = brierCount > 0 ? brierScore / brierCount : 0;

    // Calculate ROI by strategy
    const strategyROI: Record<string, number> = {};
    const strategyStats: Record<string, { betAmount: number; payout: number }> = {};

    entries.forEach(entry => {
        const strategyId = entry.strategyId || 'default';
        if (!strategyStats[strategyId]) {
            strategyStats[strategyId] = { betAmount: 0, payout: 0 };
        }

        if (entry.betDetails) {
            strategyStats[strategyId].betAmount += entry.betDetails.betAmount;
            if (entry.betDetails.result === 'win') {
                const payout = entry.betDetails.betAmount * (entry.betDetails.oddsUsed + 1);
                strategyStats[strategyId].payout += payout;
            }
        }
    });

    Object.keys(strategyStats).forEach(strategyId => {
        const stats = strategyStats[strategyId];
        if (stats.betAmount > 0) {
            strategyROI[strategyId] = Math.round(((stats.payout - stats.betAmount) / stats.betAmount) * 100);
        }
    });

    return {
        totalRaces,
        correctPredictions,
        accuracy,
        recentAccuracy,
        overallROI,
        totalBetAmount,
        totalPayout,
        brierScore,
        strategyROI
    };
}
