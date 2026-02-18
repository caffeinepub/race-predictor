import { type RaceEntry } from '@/features/entries/types';
import { STORAGE_KEYS, STORAGE_VERSION } from './storageKeys';

export interface ContenderStats {
    wins: number;
    places: number; // 2nd place finishes
    shows: number; // 3rd place finishes
    appearances: number;
    recentForm: Array<{ position: number; margin?: number }>; // Last 5 races
}

export interface StreakData {
    currentStreak: number; // Positive for wins/podiums, negative for losses
    type: 'win' | 'podium' | 'loss' | 'none';
}

export interface VarianceData {
    marginVariance: number;
    consistency: 'high' | 'medium' | 'low' | 'unknown';
}

export interface SignalWeights {
    oddsWeight: number;
    historicalWinRateWeight: number;
    recentFormWeight: number;
    streakWeight: number;
}

export interface LearnedState {
    totalRaces: number;
    correctPredictions: number;
    contenderStats: Record<string, ContenderStats>;
    streakData: Record<string, StreakData>;
    varianceData: Record<string, VarianceData>;
    signalWeights: SignalWeights;
    totalBetAmount: number;
    totalPayout: number;
    strategyPerformance: Record<string, { correct: number; total: number; roi: number }>;
}

function getDefaultLearnedState(): LearnedState {
    return {
        totalRaces: 0,
        correctPredictions: 0,
        contenderStats: {},
        streakData: {},
        varianceData: {},
        signalWeights: {
            oddsWeight: 1.0,
            historicalWinRateWeight: 0.5,
            recentFormWeight: 0.3,
            streakWeight: 0.2
        },
        totalBetAmount: 0,
        totalPayout: 0,
        strategyPerformance: {}
    };
}

export function loadEntries(): RaceEntry[] {
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.ENTRIES);
        if (!stored) return [];

        const entries = JSON.parse(stored) as RaceEntry[];
        return Array.isArray(entries) ? entries : [];
    } catch (error) {
        console.error('Error loading entries:', error);
        return [];
    }
}

export function saveEntries(entries: RaceEntry[]): void {
    try {
        localStorage.setItem(STORAGE_KEYS.VERSION, STORAGE_VERSION);
        localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(entries));
    } catch (error) {
        console.error('Error saving entries:', error);
    }
}

export function loadLearnedState(): LearnedState {
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.LEARNED_STATE);
        if (!stored) return getDefaultLearnedState();

        const state = JSON.parse(stored) as Partial<LearnedState>;
        const defaultState = getDefaultLearnedState();
        
        // Merge with defaults to handle missing fields
        return {
            ...defaultState,
            ...state,
            contenderStats: state.contenderStats || {},
            streakData: state.streakData || {},
            varianceData: state.varianceData || {},
            signalWeights: { ...defaultState.signalWeights, ...(state.signalWeights || {}) },
            strategyPerformance: state.strategyPerformance || {}
        };
    } catch (error) {
        console.error('Error loading learned state:', error);
        return getDefaultLearnedState();
    }
}

export function saveLearnedState(state: LearnedState): void {
    try {
        localStorage.setItem(STORAGE_KEYS.VERSION, STORAGE_VERSION);
        localStorage.setItem(STORAGE_KEYS.LEARNED_STATE, JSON.stringify(state));
    } catch (error) {
        console.error('Error saving learned state:', error);
    }
}

function calculateVariance(margins: number[]): number {
    if (margins.length < 2) return 0;
    const mean = margins.reduce((a, b) => a + b, 0) / margins.length;
    const squaredDiffs = margins.map(m => Math.pow(m - mean, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / margins.length;
}

function getConsistencyLevel(variance: number, hasData: boolean): 'high' | 'medium' | 'low' | 'unknown' {
    if (!hasData) return 'unknown';
    if (variance < 1.0) return 'high';
    if (variance < 5.0) return 'medium';
    return 'low';
}

export function computeLearnedState(entries: RaceEntry[]): LearnedState {
    const state: LearnedState = getDefaultLearnedState();
    state.totalRaces = entries.length;

    // First pass: collect all stats
    const contenderRaces: Record<string, Array<{ position: number; margin?: number; timestamp: number }>> = {};

    entries.forEach((entry) => {
        // Track correct predictions
        if (entry.predictedWinner === entry.actualWinner) {
            state.correctPredictions++;
        }

        // Track strategy performance
        const strategyId = entry.strategyId || 'default';
        if (!state.strategyPerformance[strategyId]) {
            state.strategyPerformance[strategyId] = { correct: 0, total: 0, roi: 0 };
        }
        state.strategyPerformance[strategyId].total++;
        if (entry.predictedWinner === entry.actualWinner) {
            state.strategyPerformance[strategyId].correct++;
        }

        // Track betting performance
        if (entry.betDetails) {
            state.totalBetAmount += entry.betDetails.betAmount;
            if (entry.betDetails.result === 'win') {
                const payout = entry.betDetails.betAmount * (entry.betDetails.oddsUsed + 1);
                state.totalPayout += payout;
            }
        }

        // Track contender statistics
        entry.contenders.forEach((contender) => {
            if (!contenderRaces[contender.number]) {
                contenderRaces[contender.number] = [];
            }

            let position = 0; // 0 = unplaced
            let margin: number | undefined;

            if (entry.firstPlace === contender.number) {
                position = 1;
                margin = entry.firstPlaceMargin;
            } else if (entry.secondPlace === contender.number) {
                position = 2;
                margin = entry.secondPlaceMargin;
            } else if (entry.thirdPlace === contender.number) {
                position = 3;
                margin = entry.thirdPlaceMargin;
            }

            contenderRaces[contender.number].push({
                position,
                margin,
                timestamp: entry.timestamp
            });
        });
    });

    // Second pass: compute derived stats
    Object.keys(contenderRaces).forEach(number => {
        const races = contenderRaces[number].sort((a, b) => b.timestamp - a.timestamp);
        
        const wins = races.filter(r => r.position === 1).length;
        const places = races.filter(r => r.position === 2).length;
        const shows = races.filter(r => r.position === 3).length;
        const appearances = races.length;

        // Recent form (last 5)
        const recentForm = races.slice(0, 5).map(r => ({
            position: r.position,
            margin: r.margin
        }));

        state.contenderStats[number] = {
            wins,
            places,
            shows,
            appearances,
            recentForm
        };

        // Calculate streak
        let currentStreak = 0;
        let streakType: 'win' | 'podium' | 'loss' | 'none' = 'none';

        for (const race of races) {
            if (race.position === 1) {
                if (streakType === 'none' || streakType === 'win') {
                    currentStreak++;
                    streakType = 'win';
                } else {
                    break;
                }
            } else if (race.position > 0 && race.position <= 3) {
                if (streakType === 'none' || streakType === 'podium') {
                    currentStreak++;
                    streakType = 'podium';
                } else {
                    break;
                }
            } else {
                if (streakType === 'none' || streakType === 'loss') {
                    currentStreak--;
                    streakType = 'loss';
                } else {
                    break;
                }
            }
        }

        state.streakData[number] = {
            currentStreak,
            type: streakType
        };

        // Calculate variance from margins
        const marginsWithData = races
            .filter(r => r.margin !== undefined && r.margin !== null)
            .map(r => r.margin as number);

        if (marginsWithData.length >= 2) {
            const variance = calculateVariance(marginsWithData);
            state.varianceData[number] = {
                marginVariance: variance,
                consistency: getConsistencyLevel(variance, true)
            };
        } else {
            state.varianceData[number] = {
                marginVariance: 0,
                consistency: 'unknown'
            };
        }
    });

    // Calculate ROI for strategies
    Object.keys(state.strategyPerformance).forEach(strategyId => {
        const perf = state.strategyPerformance[strategyId];
        if (state.totalBetAmount > 0) {
            perf.roi = ((state.totalPayout - state.totalBetAmount) / state.totalBetAmount) * 100;
        }
    });

    // Update signal weights based on prediction accuracy (learning feedback)
    if (entries.length >= 5) {
        updateSignalWeights(state, entries);
    }

    return state;
}

function updateSignalWeights(state: LearnedState, entries: RaceEntry[]): void {
    // Calibration feedback: adjust weights based on prediction vs outcome
    const recentEntries = entries.slice(-10); // Last 10 races
    let correctCount = 0;
    let totalConfidence = 0;

    recentEntries.forEach(entry => {
        if (entry.predictedWinner === entry.actualWinner) {
            correctCount++;
        }
        totalConfidence += entry.confidence;
    });

    const actualAccuracy = recentEntries.length > 0 ? correctCount / recentEntries.length : 0;
    const avgConfidence = recentEntries.length > 0 ? totalConfidence / recentEntries.length / 100 : 0;

    // If we're overconfident, reduce weights slightly
    // If we're underconfident, increase weights slightly
    const calibrationError = avgConfidence - actualAccuracy;

    if (Math.abs(calibrationError) > 0.1) {
        const adjustment = calibrationError > 0 ? 0.95 : 1.05;
        
        state.signalWeights.oddsWeight *= adjustment;
        state.signalWeights.historicalWinRateWeight *= adjustment;
        state.signalWeights.recentFormWeight *= adjustment;
        state.signalWeights.streakWeight *= adjustment;

        // Normalize to keep total weight reasonable
        const totalWeight = 
            state.signalWeights.oddsWeight +
            state.signalWeights.historicalWinRateWeight +
            state.signalWeights.recentFormWeight +
            state.signalWeights.streakWeight;

        if (totalWeight > 3.0) {
            const scale = 2.0 / totalWeight;
            state.signalWeights.oddsWeight *= scale;
            state.signalWeights.historicalWinRateWeight *= scale;
            state.signalWeights.recentFormWeight *= scale;
            state.signalWeights.streakWeight *= scale;
        }
    }
}

export function clearAllData(): void {
    try {
        localStorage.removeItem(STORAGE_KEYS.VERSION);
        localStorage.removeItem(STORAGE_KEYS.ENTRIES);
        localStorage.removeItem(STORAGE_KEYS.LEARNED_STATE);
    } catch (error) {
        console.error('Error clearing data:', error);
    }
}
