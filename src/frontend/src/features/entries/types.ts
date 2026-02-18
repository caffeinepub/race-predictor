export interface OddsData {
    numerator: number;
    denominator: number;
    decimal?: number;
}

export interface Contender {
    number: string;
    contenderId: string;
    laneIndex: number;
    odds: OddsData;
    impliedProbability: number;
}

export interface BetDetails {
    betHorseNumber: string;
    betAmount: number;
    oddsUsed: OddsData;
    result: 'win' | 'loss';
}

export interface RaceEntry {
    id: string;
    timestamp: number;
    contenders: Contender[];
    predictedWinner: string;
    actualWinner: string;
    confidence: number;
    firstPlace: string;
    secondPlace?: string;
    thirdPlace?: string;
    impliedProbabilities: Record<string, number>;
    predictedProbabilities: Record<string, number>;
    actualResults: Record<string, number>;
    strategyId?: StrategyProfile;
    betDetails?: BetDetails;
}

export type StrategyProfile = 'Aggressive' | 'Balanced' | 'Conservative';

export interface SignalContribution {
    signal: string;
    value: number;
}

export interface ContenderStats {
    appearances: number;
    wins: number;
    places: number;
    shows: number;
    winStreak: number;
    placerStreak: number;
    lowerStreak: number;
    recentForm: Array<{ position: number; timestamp: number }>;
    oddsMovement: number | null;
    momentumScore: number;
}
