export interface RaceEntry {
    id: string;
    timestamp: number;
    contenders: Contender[];
    predictedWinner: string;
    actualWinner: string;
    confidence: number;
}

export interface Contender {
    number: string;
    odds: number;
}

export interface EntryFormData {
    contenders: Contender[];
    actualWinner: string;
}
