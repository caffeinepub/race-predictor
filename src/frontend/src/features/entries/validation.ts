import { type Contender, type OddsData } from './types';

export interface ValidationResult {
    valid: boolean;
    error?: string;
}

export function validateOdds(odds: OddsData): ValidationResult {
    if (!odds || typeof odds.numerator !== 'number' || typeof odds.denominator !== 'number') {
        return { valid: false, error: 'Invalid odds format' };
    }
    
    if (odds.numerator <= 0 || odds.denominator <= 0) {
        return { valid: false, error: 'Odds must be positive numbers' };
    }
    
    return { valid: true };
}

export function validateWinner(winner: string, contenders: Contender[]): ValidationResult {
    if (!winner || winner.trim() === '') {
        return { valid: false, error: 'Winner is required' };
    }
    
    const winnerNum = parseInt(winner);
    if (isNaN(winnerNum) || winnerNum < 1 || winnerNum > 6) {
        return { valid: false, error: 'Winner must be between 1 and 6' };
    }
    
    const validNumbers = contenders.map(c => c.number);
    if (!validNumbers.includes(winner)) {
        return { valid: false, error: 'Winner must be one of the contenders' };
    }
    
    return { valid: true };
}

export function validateContenders(contenders: Contender[]): ValidationResult {
    if (contenders.length !== 6) {
        return { valid: false, error: 'Must have exactly 6 contenders' };
    }

    for (let i = 0; i < contenders.length; i++) {
        const c = contenders[i];
        const oddsValue = typeof c.odds === 'number' ? c.odds : c.odds.numerator;
        if (!oddsValue || oddsValue <= 0) {
            return { valid: false, error: `Contender ${i + 1}: Odds must be greater than 0` };
        }
    }

    return { valid: true };
}

export function validatePodium(
    firstPlace: string,
    secondPlace: string,
    thirdPlace: string,
    contenders: Contender[]
): ValidationResult {
    if (!firstPlace) {
        return { valid: false, error: 'First place must be selected' };
    }
    if (!secondPlace) {
        return { valid: false, error: 'Second place must be selected' };
    }
    if (!thirdPlace) {
        return { valid: false, error: 'Third place must be selected' };
    }

    const positions = [firstPlace, secondPlace, thirdPlace];
    const uniquePositions = new Set(positions);
    if (positions.length !== uniquePositions.size) {
        return { valid: false, error: 'Each position must be a different contender' };
    }

    const validNumbers = contenders.map(c => c.number);
    for (const pos of positions) {
        if (!validNumbers.includes(pos)) {
            return { valid: false, error: 'Invalid contender number' };
        }
    }

    return { valid: true };
}
