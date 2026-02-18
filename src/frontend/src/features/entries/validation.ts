import { type Contender } from './types';

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
}

const VALID_CONTENDER_NUMBERS = ['1', '2', '3', '4', '5', '6'];

export function validateContenders(contenders: Contender[]): ValidationResult {
    const errors: string[] = [];

    // Check that we have exactly 6 contenders with the correct numbers
    if (contenders.length !== 6) {
        errors.push('Must have exactly 6 contenders');
    }

    const numbers = contenders.map((c) => c.number);
    const hasAllNumbers = VALID_CONTENDER_NUMBERS.every(num => numbers.includes(num));
    
    if (!hasAllNumbers) {
        errors.push('Contenders must be numbered 1 through 6');
    }

    // Check that all contenders have valid odds
    contenders.forEach((c) => {
        if (!c.odds || c.odds <= 0) {
            errors.push(`Contender ${c.number}: Odds must be greater than 0`);
        }
    });

    return {
        isValid: errors.length === 0,
        errors
    };
}

export function validateWinner(winner: string, contenders: Contender[]): ValidationResult {
    const errors: string[] = [];

    if (!winner || winner.trim() === '') {
        errors.push('Please select the actual winner');
    }

    // Winner must be one of the valid contender numbers (1-6)
    if (winner && !VALID_CONTENDER_NUMBERS.includes(winner)) {
        errors.push('Winner must be a contender number between 1 and 6');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}
