import { useState, useEffect, useCallback } from 'react';
import { type RaceEntry, type StrategyProfile } from '@/features/entries/types';
import {
    loadEntries,
    saveEntries,
    loadLearnedState,
    saveLearnedState,
    calculateLearnedState,
    clearAllData,
    type LearnedState
} from './localMemoryStore';

export function useOnDeviceMemory() {
    const [entries, setEntries] = useState<RaceEntry[]>([]);
    const [learnedState, setLearnedState] = useState<LearnedState | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Load data on mount
    useEffect(() => {
        const loadedEntries = loadEntries();
        const loadedState = loadLearnedState();
        
        // If no learned state exists, compute it from entries
        if (!loadedState && loadedEntries.length > 0) {
            const computedState = calculateLearnedState(loadedEntries);
            setLearnedState(computedState);
            saveLearnedState(computedState);
        } else if (!loadedState) {
            // Initialize empty state
            const emptyState = calculateLearnedState([]);
            setLearnedState(emptyState);
            saveLearnedState(emptyState);
        } else {
            setLearnedState(loadedState);
        }
        
        setEntries(loadedEntries);
        setIsLoading(false);
    }, []);

    const addEntry = useCallback((entry: RaceEntry) => {
        const newEntries = [...entries, entry];
        setEntries(newEntries);
        saveEntries(newEntries);
        
        // Recalculate learned state with all entries
        const updatedState = calculateLearnedState(newEntries, learnedState || undefined);
        setLearnedState(updatedState);
        saveLearnedState(updatedState);
    }, [entries, learnedState]);

    const recomputeLearnedState = useCallback(() => {
        const newState = calculateLearnedState(entries);
        setLearnedState(newState);
        saveLearnedState(newState);
    }, [entries]);

    const clearMemory = useCallback(() => {
        clearAllData();
        setEntries([]);
        const emptyState = calculateLearnedState([]);
        setLearnedState(emptyState);
        saveLearnedState(emptyState);
    }, []);
    
    const setStrategy = useCallback((strategy: StrategyProfile) => {
        if (learnedState) {
            const updatedState = { ...learnedState, selectedStrategy: strategy };
            setLearnedState(updatedState);
            saveLearnedState(updatedState);
        }
    }, [learnedState]);

    return {
        entries,
        learnedState,
        isLoading,
        addEntry,
        recomputeLearnedState,
        clearMemory,
        setStrategy
    };
}
