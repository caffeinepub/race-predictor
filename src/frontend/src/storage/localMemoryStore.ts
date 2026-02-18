import { type RaceEntry } from '@/features/entries/types';
import { STORAGE_KEYS, STORAGE_VERSION } from './storageKeys';

export interface ContenderStats {
    wins: number;
    appearances: number;
}

export interface LearnedState {
    totalRaces: number;
    correctPredictions: number;
    contenderStats: Record<string, ContenderStats>;
}

function getDefaultLearnedState(): LearnedState {
    return {
        totalRaces: 0,
        correctPredictions: 0,
        contenderStats: {}
    };
}

export function loadEntries(): RaceEntry[] {
    try {
        const version = localStorage.getItem(STORAGE_KEYS.VERSION);
        if (version !== STORAGE_VERSION) {
            // Version mismatch, clear old data
            clearAllData();
            return [];
        }

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
        const version = localStorage.getItem(STORAGE_KEYS.VERSION);
        if (version !== STORAGE_VERSION) {
            return getDefaultLearnedState();
        }

        const stored = localStorage.getItem(STORAGE_KEYS.LEARNED_STATE);
        if (!stored) return getDefaultLearnedState();

        const state = JSON.parse(stored) as LearnedState;
        return state;
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

export function computeLearnedState(entries: RaceEntry[]): LearnedState {
    const state: LearnedState = {
        totalRaces: entries.length,
        correctPredictions: 0,
        contenderStats: {}
    };

    entries.forEach((entry) => {
        // Track correct predictions
        if (entry.predictedWinner === entry.actualWinner) {
            state.correctPredictions++;
        }

        // Track contender statistics
        entry.contenders.forEach((contender) => {
            if (!state.contenderStats[contender.number]) {
                state.contenderStats[contender.number] = {
                    wins: 0,
                    appearances: 0
                };
            }

            state.contenderStats[contender.number].appearances++;

            if (contender.number === entry.actualWinner) {
                state.contenderStats[contender.number].wins++;
            }
        });
    });

    return state;
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
