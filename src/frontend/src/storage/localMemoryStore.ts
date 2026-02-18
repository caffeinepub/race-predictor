import { type RaceEntry, type ContenderStats, type StrategyProfile } from '@/features/entries/types';
import { STORAGE_KEYS } from './storageKeys';

export interface LearnedState {
    contenderStats: Record<string, ContenderStats>;
    overallAccuracy: number;
    totalBetAmount: number;
    totalPayout: number;
    recentWindowSize: number;
    signalWeights: {
        oddsWeight: number;
        historicalWinRateWeight: number;
        recentFormWeight: number;
        streakWeight: number;
        winStreakWeight: number;
        placerStreakWeight: number;
        lowerStreakWeight: number;
        oddsMovementWeight: number;
        momentumWeight: number;
    };
    varianceData: Record<string, { consistency: 'high' | 'medium' | 'low' }>;
    currentLogLoss: number;
    selectedStrategy: StrategyProfile;
    learningRate: number;
}

const INITIAL_LEARNING_RATE = 0.01;
const MOMENTUM_DECAY_FACTOR = 0.9;

export function calculateLearnedState(entries: RaceEntry[], previousState?: LearnedState): LearnedState {
    const contenderStats: Record<string, ContenderStats> = previousState?.contenderStats || {};
    const recentWindowSize = 10;

    // Initialize or update contender stats
    entries.forEach((entry, entryIndex) => {
        entry.contenders.forEach(contender => {
            const id = contender.contenderId;
            
            if (!contenderStats[id]) {
                contenderStats[id] = {
                    appearances: 0,
                    wins: 0,
                    places: 0,
                    shows: 0,
                    winStreak: 0,
                    placerStreak: 0,
                    lowerStreak: 0,
                    recentForm: [],
                    oddsMovement: null,
                    momentumScore: 0
                };
            }

            const stats = contenderStats[id];
            stats.appearances++;

            // Determine position
            let position = 0;
            if (entry.firstPlace === id) {
                position = 1;
                stats.wins++;
            } else if (entry.secondPlace === id) {
                position = 2;
                stats.places++;
            } else if (entry.thirdPlace === id) {
                position = 3;
                stats.shows++;
            } else if (entry.actualWinner === id) {
                position = 1;
                stats.wins++;
            } else {
                // Assume 4th-6th place
                position = 4;
            }

            // Update streaks based on position
            if (position === 1) {
                // Win streak
                stats.winStreak++;
                stats.placerStreak = 0;
                stats.lowerStreak = 0;
            } else if (position === 2 || position === 3) {
                // Placer streak
                stats.placerStreak++;
                stats.winStreak = 0;
                stats.lowerStreak = 0;
            } else {
                // Lower streak (4th-6th)
                stats.lowerStreak++;
                stats.winStreak = 0;
                stats.placerStreak = 0;
            }

            // Update recent form
            stats.recentForm.push({ position, timestamp: entry.timestamp });
            if (stats.recentForm.length > 5) {
                stats.recentForm.shift();
            }

            // Calculate odds movement (compare to previous race)
            if (entryIndex > 0) {
                const previousEntry = entries[entryIndex - 1];
                const previousContender = previousEntry.contenders.find(c => c.contenderId === id);
                if (previousContender) {
                    const currentOdds = contender.odds.numerator / contender.odds.denominator;
                    const previousOdds = previousContender.odds.numerator / previousContender.odds.denominator;
                    stats.oddsMovement = currentOdds - previousOdds;
                }
            }
        });
    });

    // Calculate momentum scores with exponential decay
    Object.keys(contenderStats).forEach(id => {
        const stats = contenderStats[id];
        let momentumScore = 0;
        let totalWeight = 0;

        stats.recentForm.forEach((form, index) => {
            const age = stats.recentForm.length - index - 1;
            const weight = Math.pow(MOMENTUM_DECAY_FACTOR, age);
            const positionScore = form.position === 1 ? 1.0 : 
                                 form.position === 2 ? 0.7 :
                                 form.position === 3 ? 0.5 :
                                 0.2;
            momentumScore += positionScore * weight;
            totalWeight += weight;
        });

        stats.momentumScore = totalWeight > 0 ? momentumScore / totalWeight : 0;
    });

    // Calculate variance/consistency
    const varianceData: Record<string, { consistency: 'high' | 'medium' | 'low' }> = {};
    Object.keys(contenderStats).forEach(id => {
        const stats = contenderStats[id];
        if (stats.appearances < 3) {
            varianceData[id] = { consistency: 'low' };
            return;
        }

        const positions = stats.recentForm.map(f => f.position);
        const avgPosition = positions.reduce((a, b) => a + b, 0) / positions.length;
        const variance = positions.reduce((sum, pos) => sum + Math.pow(pos - avgPosition, 2), 0) / positions.length;

        if (variance < 1.0) {
            varianceData[id] = { consistency: 'high' };
        } else if (variance < 2.5) {
            varianceData[id] = { consistency: 'medium' };
        } else {
            varianceData[id] = { consistency: 'low' };
        }
    });

    // Calculate overall accuracy
    const correctPredictions = entries.filter(e => e.predictedWinner === e.actualWinner).length;
    const overallAccuracy = entries.length > 0 ? (correctPredictions / entries.length) * 100 : 0;

    // Calculate total bet amount and payout
    let totalBetAmount = 0;
    let totalPayout = 0;
    entries.forEach(entry => {
        if (entry.betDetails) {
            totalBetAmount += entry.betDetails.betAmount;
            if (entry.betDetails.result === 'win') {
                const decimalOdds = entry.betDetails.oddsUsed.decimal || 
                    (entry.betDetails.oddsUsed.numerator / entry.betDetails.oddsUsed.denominator + 1);
                totalPayout += entry.betDetails.betAmount * decimalOdds;
            }
        }
    });

    // Calculate log-loss
    let logLoss = 0;
    let logLossCount = 0;
    entries.forEach(entry => {
        if (entry.predictedProbabilities && entry.actualResults) {
            Object.keys(entry.predictedProbabilities).forEach(horseNum => {
                const predictedProb = Math.max(0.001, Math.min(0.999, entry.predictedProbabilities[horseNum]));
                const actualOutcome = entry.actualResults[horseNum] || 0;
                logLoss += -(actualOutcome * Math.log(predictedProb) + (1 - actualOutcome) * Math.log(1 - predictedProb));
                logLossCount++;
            });
        }
    });
    const currentLogLoss = logLossCount > 0 ? logLoss / logLossCount : 0;

    // Dynamic learning rate based on recent accuracy
    const recentEntries = entries.slice(-20);
    const recentCorrect = recentEntries.filter(e => e.predictedWinner === e.actualWinner).length;
    const recentAccuracy = recentEntries.length > 0 ? (recentCorrect / recentEntries.length) : 0.5;
    
    let learningRate = INITIAL_LEARNING_RATE;
    if (recentAccuracy < 0.5) {
        learningRate = INITIAL_LEARNING_RATE * 1.5; // Increase learning rate when struggling
    } else if (recentAccuracy > 0.7) {
        learningRate = INITIAL_LEARNING_RATE * 0.75; // Decrease learning rate when doing well
    }

    // Update signal weights using gradient descent (simplified)
    const baseWeights = previousState?.signalWeights || {
        oddsWeight: 1.0,
        historicalWinRateWeight: 0.8,
        recentFormWeight: 1.2,
        streakWeight: 0.5,
        winStreakWeight: 0.8,
        placerStreakWeight: 0.5,
        lowerStreakWeight: -0.3,
        oddsMovementWeight: 0.4,
        momentumWeight: 0.9
    };

    // Apply small adjustments based on recent performance
    const signalWeights = { ...baseWeights };
    if (entries.length > 10) {
        const gradient = recentAccuracy > 0.5 ? 0.01 : -0.01;
        Object.keys(signalWeights).forEach(key => {
            signalWeights[key as keyof typeof signalWeights] += gradient * learningRate;
        });
    }

    return {
        contenderStats,
        overallAccuracy,
        totalBetAmount,
        totalPayout,
        recentWindowSize,
        signalWeights,
        varianceData,
        currentLogLoss,
        selectedStrategy: previousState?.selectedStrategy || 'Balanced',
        learningRate
    };
}

export function saveLearnedState(state: LearnedState): void {
    localStorage.setItem(STORAGE_KEYS.LEARNED_STATE, JSON.stringify(state));
}

export function loadLearnedState(): LearnedState | null {
    const stored = localStorage.getItem(STORAGE_KEYS.LEARNED_STATE);
    if (!stored) return null;
    
    try {
        return JSON.parse(stored);
    } catch {
        return null;
    }
}

export function loadEntries(): RaceEntry[] {
    const stored = localStorage.getItem(STORAGE_KEYS.ENTRIES);
    if (!stored) return [];
    
    try {
        return JSON.parse(stored);
    } catch {
        return [];
    }
}

export function saveEntries(entries: RaceEntry[]): void {
    localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(entries));
}

export function clearAllData(): void {
    localStorage.removeItem(STORAGE_KEYS.ENTRIES);
    localStorage.removeItem(STORAGE_KEYS.LEARNED_STATE);
}

export function updateLearnedStateWithFeedback(
    currentState: LearnedState,
    entry: RaceEntry
): LearnedState {
    // Recalculate with the new entry
    const allEntries = loadEntries();
    return calculateLearnedState(allEntries, currentState);
}
