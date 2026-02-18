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
    // Podium margins (optional, for learning)
    firstPlaceMargin?: number;
    secondPlaceMargin?: number;
    thirdPlaceMargin?: number;
    // Enhanced tracking
    impliedProbabilities?: Record<string, number>;
    strategyId?: string;
    betDetails?: BetDetails;
}

export interface Contender {
    number: string;
    odds: number;
}

export interface BetDetails {
    betHorseNumber: string;
    betAmount: number;
    oddsUsed: number;
    result: 'win' | 'loss';
}

export interface EntryFormData {
    contenders: Contender[];
    actualWinner: string;
}
