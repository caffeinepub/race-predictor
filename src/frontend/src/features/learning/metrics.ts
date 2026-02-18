import { type RaceEntry } from '@/features/entries/types';
import { toDecimalOdds } from '@/lib/oddsFormat';

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

export interface ModelMood {
    mood: 'High' | 'Medium' | 'Low';
    confidence: number;
    emoji: string;
    color: string;
    label: string;
}

export interface RNGTiltStatus {
    isActive: boolean;
    recentMissRate: number;
    message?: string;
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
                const decimalOdds = toDecimalOdds(entry.betDetails.oddsUsed);
                const payout = entry.betDetails.betAmount * decimalOdds;
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

export function calculateModelMood(entries: RaceEntry[]): ModelMood {
    // Need at least 5 races to calculate mood
    if (entries.length < 5) {
        return {
            mood: 'Medium',
            confidence: 50,
            emoji: '🤷',
            color: 'text-muted-foreground',
            label: 'Insufficient data'
        };
    }

    // Use last 15-20 races for mood calculation
    const recentWindow = Math.min(20, entries.length);
    const recentEntries = entries.slice(-recentWindow);

    // Calculate recent accuracy
    const recentCorrect = recentEntries.filter(e => e.predictedWinner === e.actualWinner).length;
    const recentAccuracy = (recentCorrect / recentEntries.length) * 100;

    // Calculate recent calibration (Brier score)
    let brierScore = 0;
    let brierCount = 0;
    recentEntries.forEach(entry => {
        if (entry.predictedProbabilities && entry.actualResults) {
            Object.keys(entry.predictedProbabilities).forEach(horseNum => {
                const predictedProb = entry.predictedProbabilities![horseNum] || 0;
                const actualOutcome = entry.actualResults![horseNum] || 0;
                brierScore += Math.pow(predictedProb - actualOutcome, 2);
                brierCount++;
            });
        }
    });
    const avgBrierScore = brierCount > 0 ? brierScore / brierCount : 0.5;
    const calibrationScore = (1 - avgBrierScore) * 100; // Convert to 0-100 scale

    // Combine accuracy and calibration for overall confidence
    const overallConfidence = (recentAccuracy * 0.6 + calibrationScore * 0.4);

    // Determine mood
    let mood: 'High' | 'Medium' | 'Low';
    let emoji: string;
    let color: string;
    let label: string;

    if (overallConfidence >= 70) {
        mood = 'High';
        emoji = '🔥';
        color = 'text-green-600 dark:text-green-400';
        label = 'Model is performing well';
    } else if (overallConfidence >= 50) {
        mood = 'Medium';
        emoji = '😐';
        color = 'text-yellow-600 dark:text-yellow-400';
        label = 'Model is performing adequately';
    } else {
        mood = 'Low';
        emoji = '😰';
        color = 'text-red-600 dark:text-red-400';
        label = 'Model is struggling - proceed with caution';
    }

    return {
        mood,
        confidence: Math.round(overallConfidence),
        emoji,
        color,
        label
    };
}

export function detectRNGTilt(entries: RaceEntry[]): RNGTiltStatus {
    // Need at least 5 races to detect tilt
    if (entries.length < 5) {
        return {
            isActive: false,
            recentMissRate: 0
        };
    }

    // Check last 5-10 races
    const tiltWindow = Math.min(10, entries.length);
    const recentEntries = entries.slice(-tiltWindow);

    const misses = recentEntries.filter(e => e.predictedWinner !== e.actualWinner).length;
    const missRate = misses / recentEntries.length;

    // Tilt threshold: 70%+ miss rate
    const TILT_THRESHOLD = 0.70;
    const isActive = missRate >= TILT_THRESHOLD;

    return {
        isActive,
        recentMissRate: missRate * 100,
        message: isActive 
            ? `Pattern shift detected. Reducing bet size temporarily. (${Math.round(missRate * 100)}% miss rate in last ${tiltWindow} races)`
            : undefined
    };
}
