import { type RaceEntry, type OddsData, type StrategyProfile } from '@/features/entries/types';
import { STORAGE_KEYS, STORAGE_VERSION } from './storageKeys';
import { calculateImpliedProbability, toDecimalOdds } from '@/lib/oddsFormat';

export interface ContenderStats {
    wins: number;
    places: number; // 2nd place finishes
    shows: number; // 3rd place finishes
    appearances: number;
    recentForm: Array<{ position: number; margin?: number }>; // Last 5 races
    winStreak: number; // Consecutive 1st place finishes
    placerStreak: number; // Consecutive 2nd or 3rd place finishes
    lowerStreak: number; // Consecutive 4th-6th place finishes
    lastOddsNumerator: number | null; // For odds movement tracking
    oddsMovement: number | null; // Percentage change in odds
    momentumScore: number; // Exponentially weighted recent performance
}

export interface BlendedStats {
    lifetime: ContenderStats;
    recent: ContenderStats;
    blended: ContenderStats;
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
    recentWindowSize: number;
    logLossHistory: number[];
    currentLogLoss: number;
    selectedStrategy: StrategyProfile;
    recentAccuracy: boolean[]; // Last 20 predictions for adaptive learning rate
}

export interface ContendersCache {
    version: string;
    timestamp: number;
    blendedStats: Record<string, BlendedStats>;
    streakData: Record<string, StreakData>;
    varianceData: Record<string, VarianceData>;
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
        strategyPerformance: {},
        recentWindowSize: 50,
        logLossHistory: [],
        currentLogLoss: 0,
        selectedStrategy: 'Balanced',
        recentAccuracy: []
    };
}

export function loadEntries(): RaceEntry[] {
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.ENTRIES);
        if (!stored) return [];

        const entries = JSON.parse(stored) as RaceEntry[];
        return Array.isArray(entries) ? migrateEntries(entries) : [];
    } catch (error) {
        console.error('Error loading entries:', error);
        return [];
    }
}

function migrateEntries(entries: RaceEntry[]): RaceEntry[] {
    return entries.map(entry => {
        const migratedContenders = entry.contenders.map(c => {
            // Migrate legacy numeric odds to OddsData structure
            if (typeof c.odds === 'number') {
                return {
                    ...c,
                    contenderId: c.contenderId || c.number,
                    laneIndex: c.laneIndex || parseInt(c.number),
                    odds: {
                        numerator: c.odds,
                        denominator: 1,
                        decimal: c.odds + 1
                    } as OddsData,
                    impliedProbability: c.impliedProbability || calculateImpliedProbability(c.odds)
                };
            }
            
            // Ensure all fields are present
            return {
                ...c,
                contenderId: c.contenderId || c.number,
                laneIndex: c.laneIndex || parseInt(c.number),
                impliedProbability: c.impliedProbability || calculateImpliedProbability(c.odds as OddsData)
            };
        });
        
        return {
            ...entry,
            contenders: migratedContenders
        };
    });
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
        const mergedState: LearnedState = {
            ...defaultState,
            ...state,
            contenderStats: state.contenderStats || {},
            streakData: state.streakData || {},
            varianceData: state.varianceData || {},
            signalWeights: { ...defaultState.signalWeights, ...(state.signalWeights || {}) },
            strategyPerformance: state.strategyPerformance || {},
            recentWindowSize: state.recentWindowSize || 50,
            logLossHistory: state.logLossHistory || [],
            currentLogLoss: state.currentLogLoss || 0,
            selectedStrategy: state.selectedStrategy || 'Balanced',
            recentAccuracy: state.recentAccuracy || []
        };
        
        // Migrate contender stats to include new streak fields
        Object.keys(mergedState.contenderStats).forEach(contenderId => {
            const stats = mergedState.contenderStats[contenderId];
            if (stats.winStreak === undefined) stats.winStreak = 0;
            if (stats.placerStreak === undefined) stats.placerStreak = 0;
            if (stats.lowerStreak === undefined) stats.lowerStreak = 0;
            if (stats.lastOddsNumerator === undefined) stats.lastOddsNumerator = null;
            if (stats.oddsMovement === undefined) stats.oddsMovement = null;
            if (stats.momentumScore === undefined) stats.momentumScore = 0;
        });
        
        return mergedState;
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

export function loadContendersCache(): ContendersCache | null {
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.CONTENDERS_CACHE);
        if (!stored) return null;
        
        const cache = JSON.parse(stored) as ContendersCache;
        if (cache.version !== STORAGE_VERSION) return null;
        
        return cache;
    } catch (error) {
        console.error('Error loading contenders cache:', error);
        return null;
    }
}

export function saveContendersCache(cache: ContendersCache): void {
    try {
        localStorage.setItem(STORAGE_KEYS.CONTENDERS_CACHE, JSON.stringify(cache));
    } catch (error) {
        console.error('Error saving contenders cache:', error);
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

function computeContenderStats(races: Array<{ position: number; margin?: number; timestamp: number }>): ContenderStats {
    const wins = races.filter(r => r.position === 1).length;
    const places = races.filter(r => r.position === 2).length;
    const shows = races.filter(r => r.position === 3).length;
    const appearances = races.length;
    
    const recentForm = races.slice(0, 5).map(r => ({
        position: r.position,
        margin: r.margin
    }));
    
    // Calculate streaks
    let winStreak = 0;
    let placerStreak = 0;
    let lowerStreak = 0;
    
    for (const race of races) {
        if (race.position === 1) {
            winStreak++;
        } else {
            break;
        }
    }
    
    if (winStreak === 0) {
        for (const race of races) {
            if (race.position === 2 || race.position === 3) {
                placerStreak++;
            } else {
                break;
            }
        }
    }
    
    if (winStreak === 0 && placerStreak === 0) {
        for (const race of races) {
            if (race.position >= 4 && race.position <= 6) {
                lowerStreak++;
            } else {
                break;
            }
        }
    }
    
    // Calculate momentum with exponential decay
    let momentumScore = 0;
    const decayFactor = 0.7;
    let weight = 1.0;
    const lookback = Math.min(20, races.length);
    
    for (let i = 0; i < lookback; i++) {
        const race = races[i];
        let positionValue = 0;
        
        if (race.position === 1) positionValue = 1.0;
        else if (race.position === 2) positionValue = 0.7;
        else if (race.position === 3) positionValue = 0.5;
        else if (race.position >= 4 && race.position <= 6) positionValue = 0.2;
        
        momentumScore += positionValue * weight;
        weight *= decayFactor;
    }
    
    // Normalize momentum to 0-1 range
    if (lookback > 0) {
        const maxPossibleMomentum = (1 - Math.pow(decayFactor, lookback)) / (1 - decayFactor);
        momentumScore = momentumScore / maxPossibleMomentum;
    }
    
    return { 
        wins, 
        places, 
        shows, 
        appearances, 
        recentForm,
        winStreak,
        placerStreak,
        lowerStreak,
        lastOddsNumerator: null,
        oddsMovement: null,
        momentumScore
    };
}

export function calculateLearnedState(currentState: LearnedState, newEntry: RaceEntry): LearnedState {
    const state = { ...currentState };
    state.totalRaces++;
    
    // Track prediction correctness for adaptive learning rate
    const isCorrect = newEntry.predictedWinner === newEntry.actualWinner;
    state.recentAccuracy.push(isCorrect);
    if (state.recentAccuracy.length > 20) {
        state.recentAccuracy = state.recentAccuracy.slice(-20);
    }
    
    if (isCorrect) {
        state.correctPredictions++;
    }
    
    // Track strategy performance
    const strategyId = newEntry.strategyId || 'default';
    if (!state.strategyPerformance[strategyId]) {
        state.strategyPerformance[strategyId] = { correct: 0, total: 0, roi: 0 };
    }
    state.strategyPerformance[strategyId].total++;
    if (isCorrect) {
        state.strategyPerformance[strategyId].correct++;
    }
    
    // Track betting performance
    if (newEntry.betDetails) {
        state.totalBetAmount += newEntry.betDetails.betAmount;
        if (newEntry.betDetails.result === 'win') {
            const odds = newEntry.betDetails.oddsUsed;
            const decimalOdds = typeof odds === 'number' ? odds + 1 : toDecimalOdds(odds);
            const payout = newEntry.betDetails.betAmount * decimalOdds;
            state.totalPayout += payout;
        }
    }
    
    // Update contender stats
    newEntry.contenders.forEach((contender) => {
        const contenderId = contender.contenderId || contender.number;
        
        if (!state.contenderStats[contenderId]) {
            state.contenderStats[contenderId] = {
                wins: 0,
                places: 0,
                shows: 0,
                appearances: 0,
                recentForm: [],
                winStreak: 0,
                placerStreak: 0,
                lowerStreak: 0,
                lastOddsNumerator: null,
                oddsMovement: null,
                momentumScore: 0
            };
        }
        
        const stats = state.contenderStats[contenderId];
        stats.appearances++;
        
        let position = 0;
        let margin: number | undefined;
        
        if (newEntry.firstPlace === contender.number) {
            position = 1;
            margin = newEntry.firstPlaceMargin;
            stats.wins++;
        } else if (newEntry.secondPlace === contender.number) {
            position = 2;
            margin = newEntry.secondPlaceMargin;
            stats.places++;
        } else if (newEntry.thirdPlace === contender.number) {
            position = 3;
            margin = newEntry.thirdPlaceMargin;
            stats.shows++;
        } else {
            // Assume 4th-6th for unplaced contenders
            position = 4;
        }
        
        // Update recent form
        stats.recentForm.unshift({ position, margin });
        if (stats.recentForm.length > 5) {
            stats.recentForm = stats.recentForm.slice(0, 5);
        }
        
        // Update streaks based on position
        if (position === 1) {
            stats.winStreak++;
            stats.placerStreak = 0;
            stats.lowerStreak = 0;
        } else if (position === 2 || position === 3) {
            stats.winStreak = 0;
            stats.placerStreak++;
            stats.lowerStreak = 0;
        } else if (position >= 4 && position <= 6) {
            stats.winStreak = 0;
            stats.placerStreak = 0;
            stats.lowerStreak++;
        } else {
            stats.winStreak = 0;
            stats.placerStreak = 0;
            stats.lowerStreak = 0;
        }
        
        // Track odds movement
        const currentOddsNumerator = contender.odds.numerator;
        if (stats.lastOddsNumerator !== null) {
            stats.oddsMovement = (currentOddsNumerator - stats.lastOddsNumerator) / stats.lastOddsNumerator;
        }
        stats.lastOddsNumerator = currentOddsNumerator;
        
        // Recalculate momentum (simplified incremental update)
        const positionValue = position === 1 ? 1.0 : position === 2 ? 0.7 : position === 3 ? 0.5 : 0.2;
        stats.momentumScore = stats.momentumScore * 0.7 + positionValue * 0.3;
    });
    
    return state;
}

export function computeLearnedState(entries: RaceEntry[]): LearnedState {
    const state: LearnedState = getDefaultLearnedState();
    state.totalRaces = entries.length;

    // First pass: collect all stats
    const contenderRaces: Record<string, Array<{ position: number; margin?: number; timestamp: number; oddsNumerator: number }>> = {};

    entries.forEach((entry) => {
        // Track correct predictions
        const isCorrect = entry.predictedWinner === entry.actualWinner;
        if (isCorrect) {
            state.correctPredictions++;
        }
        
        // Track for adaptive learning rate
        state.recentAccuracy.push(isCorrect);

        // Track strategy performance
        const strategyId = entry.strategyId || 'default';
        if (!state.strategyPerformance[strategyId]) {
            state.strategyPerformance[strategyId] = { correct: 0, total: 0, roi: 0 };
        }
        state.strategyPerformance[strategyId].total++;
        if (isCorrect) {
            state.strategyPerformance[strategyId].correct++;
        }

        // Track betting performance
        if (entry.betDetails) {
            state.totalBetAmount += entry.betDetails.betAmount;
            if (entry.betDetails.result === 'win') {
                const odds = entry.betDetails.oddsUsed;
                const decimalOdds = typeof odds === 'number' ? odds + 1 : toDecimalOdds(odds);
                const payout = entry.betDetails.betAmount * decimalOdds;
                state.totalPayout += payout;
            }
        }

        // Track contender statistics by contender identity
        entry.contenders.forEach((contender) => {
            const contenderId = contender.contenderId || contender.number;
            
            if (!contenderRaces[contenderId]) {
                contenderRaces[contenderId] = [];
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
            } else {
                position = 4; // Assume 4th-6th for unplaced
            }

            contenderRaces[contenderId].push({
                position,
                margin,
                timestamp: entry.timestamp,
                oddsNumerator: contender.odds.numerator
            });
        });
    });
    
    // Keep only last 20 accuracy values
    if (state.recentAccuracy.length > 20) {
        state.recentAccuracy = state.recentAccuracy.slice(-20);
    }

    // Second pass: compute derived stats with lifetime + recent window blending
    Object.keys(contenderRaces).forEach(contenderId => {
        const races = contenderRaces[contenderId].sort((a, b) => b.timestamp - a.timestamp);
        
        // Compute lifetime stats
        const lifetimeStats = computeContenderStats(races);
        
        // Compute recent window stats
        const recentRaces = races.slice(0, state.recentWindowSize);
        const recentStats = computeContenderStats(recentRaces);
        
        // Blend stats (60% recent, 40% lifetime)
        const blendedWins = Math.round(recentStats.wins * 0.6 + lifetimeStats.wins * 0.4);
        const blendedPlaces = Math.round(recentStats.places * 0.6 + lifetimeStats.places * 0.4);
        const blendedShows = Math.round(recentStats.shows * 0.6 + lifetimeStats.shows * 0.4);
        const blendedAppearances = Math.round(recentStats.appearances * 0.6 + lifetimeStats.appearances * 0.4);
        
        // Calculate odds movement
        let oddsMovement: number | null = null;
        let lastOddsNumerator: number | null = null;
        
        if (races.length >= 2) {
            const currentOdds = races[0].oddsNumerator;
            const previousOdds = races[1].oddsNumerator;
            oddsMovement = (currentOdds - previousOdds) / previousOdds;
            lastOddsNumerator = currentOdds;
        } else if (races.length === 1) {
            lastOddsNumerator = races[0].oddsNumerator;
        }
        
        state.contenderStats[contenderId] = {
            wins: blendedWins,
            places: blendedPlaces,
            shows: blendedShows,
            appearances: blendedAppearances,
            recentForm: recentStats.recentForm,
            winStreak: lifetimeStats.winStreak,
            placerStreak: lifetimeStats.placerStreak,
            lowerStreak: lifetimeStats.lowerStreak,
            lastOddsNumerator,
            oddsMovement,
            momentumScore: lifetimeStats.momentumScore
        };

        // Calculate legacy streak for backward compatibility
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

        state.streakData[contenderId] = {
            currentStreak,
            type: streakType
        };

        // Calculate variance from margins
        const marginsWithData = races
            .filter(r => r.margin !== undefined && r.margin !== null)
            .map(r => r.margin as number);

        if (marginsWithData.length >= 2) {
            const variance = calculateVariance(marginsWithData);
            state.varianceData[contenderId] = {
                marginVariance: variance,
                consistency: getConsistencyLevel(variance, true)
            };
        } else {
            state.varianceData[contenderId] = {
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

    // Update signal weights using log-loss feedback
    if (entries.length >= 5) {
        updateSignalWeightsWithLogLoss(state, entries);
    }
    
    // Save contenders cache for faster loading
    saveContendersCache({
        version: STORAGE_VERSION,
        timestamp: Date.now(),
        blendedStats: Object.keys(contenderRaces).reduce((acc, id) => {
            const races = contenderRaces[id].sort((a, b) => b.timestamp - a.timestamp);
            acc[id] = {
                lifetime: computeContenderStats(races),
                recent: computeContenderStats(races.slice(0, state.recentWindowSize)),
                blended: state.contenderStats[id]
            };
            return acc;
        }, {} as Record<string, BlendedStats>),
        streakData: state.streakData,
        varianceData: state.varianceData
    });

    return state;
}

function updateSignalWeightsWithLogLoss(state: LearnedState, entries: RaceEntry[]): void {
    // Use last 10 races for weight adjustment
    const recentEntries = entries.slice(-10).filter(e => e.predictedProbabilities && e.actualResults);
    
    if (recentEntries.length === 0) return;
    
    // Compute log-loss for the winning contender in each race
    let totalLogLoss = 0;
    let lossCount = 0;
    
    recentEntries.forEach(entry => {
        const winnerProb = entry.predictedProbabilities?.[entry.actualWinner];
        if (winnerProb && winnerProb > 0) {
            const loss = -Math.log(winnerProb);
            totalLogLoss += loss;
            lossCount++;
        }
    });
    
    if (lossCount === 0) return;
    
    const avgLogLoss = totalLogLoss / lossCount;
    state.currentLogLoss = avgLogLoss;
    state.logLossHistory.push(avgLogLoss);
    
    // Keep only last 50 loss values
    if (state.logLossHistory.length > 50) {
        state.logLossHistory = state.logLossHistory.slice(-50);
    }
    
    // Calculate adaptive learning rate based on recent accuracy
    const recentCorrect = state.recentAccuracy.filter(Boolean).length;
    const recentTotal = state.recentAccuracy.length;
    const recentAccuracyRate = recentTotal > 0 ? recentCorrect / recentTotal : 0.5;
    
    const baseLearningRate = 0.05;
    let adaptiveLearningRate = baseLearningRate;
    
    if (recentAccuracyRate < 0.5) {
        adaptiveLearningRate = baseLearningRate * 1.5; // Increase when accuracy is low
    } else if (recentAccuracyRate > 0.7) {
        adaptiveLearningRate = baseLearningRate * 0.6; // Decrease when accuracy is high
    }
    
    // Clamp learning rate
    adaptiveLearningRate = Math.max(0.001, Math.min(0.1, adaptiveLearningRate));
    
    // Gradient descent-style weight adjustment
    recentEntries.forEach(entry => {
        const winner = entry.actualWinner;
        const predictedProb = entry.predictedProbabilities?.[winner] || 0;
        const impliedProb = entry.impliedProbabilities?.[winner] || 0;
        
        // Calculate error gradient for each signal
        const error = 1 - predictedProb; // How far from perfect prediction
        
        // If odds signal was strong but prediction was wrong, reduce odds weight
        if (impliedProb > 0.5 && predictedProb < 0.5) {
            state.signalWeights.oddsWeight *= (1 - adaptiveLearningRate);
        } else if (impliedProb > 0.3 && predictedProb > 0.5) {
            state.signalWeights.oddsWeight *= (1 + adaptiveLearningRate);
        }
        
        // Adjust other weights based on historical performance correlation
        const winnerStats = state.contenderStats[winner];
        if (winnerStats) {
            const winRate = winnerStats.appearances > 0 ? winnerStats.wins / winnerStats.appearances : 0;
            
            if (winRate > 0.3 && predictedProb < 0.5) {
                state.signalWeights.historicalWinRateWeight *= (1 + adaptiveLearningRate);
            } else if (winRate < 0.2 && predictedProb > 0.5) {
                state.signalWeights.historicalWinRateWeight *= (1 - adaptiveLearningRate);
            }
        }
    });
    
    // Normalize weights to prevent runaway growth
    const totalWeight = 
        state.signalWeights.oddsWeight +
        state.signalWeights.historicalWinRateWeight +
        state.signalWeights.recentFormWeight +
        state.signalWeights.streakWeight;
    
    if (totalWeight > 3.0 || totalWeight < 1.0) {
        const scale = 2.0 / totalWeight;
        state.signalWeights.oddsWeight *= scale;
        state.signalWeights.historicalWinRateWeight *= scale;
        state.signalWeights.recentFormWeight *= scale;
        state.signalWeights.streakWeight *= scale;
    }
    
    // Ensure no weight goes negative or too small
    state.signalWeights.oddsWeight = Math.max(0.1, state.signalWeights.oddsWeight);
    state.signalWeights.historicalWinRateWeight = Math.max(0.1, state.signalWeights.historicalWinRateWeight);
    state.signalWeights.recentFormWeight = Math.max(0.1, state.signalWeights.recentFormWeight);
    state.signalWeights.streakWeight = Math.max(0.05, state.signalWeights.streakWeight);
}

export function clearAllData(): void {
    try {
        localStorage.removeItem(STORAGE_KEYS.VERSION);
        localStorage.removeItem(STORAGE_KEYS.ENTRIES);
        localStorage.removeItem(STORAGE_KEYS.LEARNED_STATE);
        localStorage.removeItem(STORAGE_KEYS.CONTENDERS_CACHE);
    } catch (error) {
        console.error('Error clearing data:', error);
    }
}
