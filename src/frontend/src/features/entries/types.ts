export interface RaceEntry {
    id: string;
    timestamp: number;
    contenders: Contender[];
    predictedWinner: string;
    actualWinner: string;
    confidence: number;
    // Podium finish order (top 3 only)
    firstPlace?: string;
    secondPlace?: string;
    thirdPlace?: string;
    // Legacy: Podium margins (optional, for backward compatibility with older entries)
    firstPlaceMargin?: number;
    secondPlaceMargin?: number;
    thirdPlaceMargin?: number;
    // Enhanced tracking
    impliedProbabilities?: Record<string, number>;
    predictedProbabilities?: Record<string, number>;
    actualResults?: Record<string, number>; // 1 for win, 0 for loss
    strategyId?: string;
    betDetails?: BetDetails;
}

export interface Contender {
    number: string;
    contenderId?: string; // Identity of the horse (name or ID)
    laneIndex?: number; // Starting position (1-6)
    odds: OddsData;
    impliedProbability?: number;
}

export interface OddsData {
    numerator: number;
    denominator: number;
    decimal?: number; // Cached decimal representation
}

export interface BetDetails {
    betHorseNumber: string;
    betAmount: number;
    oddsUsed: OddsData;
    result: 'win' | 'loss';
}

export interface EntryFormData {
    contenders: Contender[];
    actualWinner: string;
}

export type StrategyProfile = 'Safe' | 'Value' | 'Balanced' | 'Aggressive';

export interface SignalContribution {
    signal: string;
    value: number;
}
