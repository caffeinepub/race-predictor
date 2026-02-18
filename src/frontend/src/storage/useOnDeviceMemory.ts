import { useState, useEffect, useCallback } from 'react';
import { type RaceEntry, type StrategyProfile } from '@/features/entries/types';
import {
    loadEntries,
    saveEntries,
    loadLearnedState,
    saveLearnedState,
    computeLearnedState,
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
        
        setEntries(loadedEntries);
        setLearnedState(loadedState);
        setIsLoading(false);
    }, []);

    const addEntry = useCallback((entry: RaceEntry) => {
        const newEntries = [...entries, entry];
        setEntries(newEntries);
        saveEntries(newEntries);
        
        // Update learned state incrementally
        if (learnedState) {
            const updatedState = calculateLearnedState(learnedState, entry);
            setLearnedState(updatedState);
            saveLearnedState(updatedState);
        }
    }, [entries, learnedState]);

    const recomputeLearnedState = useCallback(() => {
        const newState = computeLearnedState(entries);
        setLearnedState(newState);
        saveLearnedState(newState);
    }, [entries]);

    const clearMemory = useCallback(() => {
        clearAllData();
        setEntries([]);
        setLearnedState(loadLearnedState());
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
