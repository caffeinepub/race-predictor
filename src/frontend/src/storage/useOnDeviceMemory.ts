import { useState, useEffect, useCallback } from 'react';
import { type RaceEntry } from '@/features/entries/types';
import {
    loadEntries,
    saveEntries,
    loadLearnedState,
    saveLearnedState,
    computeLearnedState,
    clearAllData,
    type LearnedState
} from './localMemoryStore';

export function useOnDeviceMemory() {
    const [entries, setEntries] = useState<RaceEntry[]>([]);
    const [learnedState, setLearnedState] = useState<LearnedState>(() => loadLearnedState());
    const [isInitialized, setIsInitialized] = useState(false);

    // Load entries on mount and recompute if needed
    useEffect(() => {
        const loaded = loadEntries();
        setEntries(loaded);
        
        // Recompute learned state from history if it seems stale or incomplete
        if (loaded.length > 0) {
            const recomputed = computeLearnedState(loaded);
            setLearnedState(recomputed);
            saveLearnedState(recomputed);
        }
        
        setIsInitialized(true);
    }, []);

    const addEntry = useCallback((entry: RaceEntry) => {
        setEntries((prev) => {
            const updated = [...prev, entry];
            saveEntries(updated);
            
            // Immediately recompute learned state with new entry
            const newState = computeLearnedState(updated);
            setLearnedState(newState);
            saveLearnedState(newState);
            
            return updated;
        });
    }, []);

    const recomputeLearnedState = useCallback(() => {
        setEntries((currentEntries) => {
            const newState = computeLearnedState(currentEntries);
            setLearnedState(newState);
            saveLearnedState(newState);
            return currentEntries;
        });
    }, []);

    const clearAll = useCallback(() => {
        clearAllData();
        setEntries([]);
        const defaultState = {
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
        setLearnedState(defaultState);
    }, []);

    return {
        entries,
        learnedState,
        addEntry,
        recomputeLearnedState,
        clearAll,
        isInitialized
    };
}
