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

    // Load entries on mount
    useEffect(() => {
        const loaded = loadEntries();
        setEntries(loaded);
    }, []);

    const addEntry = useCallback((entry: RaceEntry) => {
        setEntries((prev) => {
            const updated = [...prev, entry];
            saveEntries(updated);
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
        setLearnedState({
            totalRaces: 0,
            correctPredictions: 0,
            contenderStats: {}
        });
    }, []);

    return {
        entries,
        learnedState,
        addEntry,
        recomputeLearnedState,
        clearAll
    };
}
