import { type OddsData } from '@/features/entries/types';

/**
 * Format odds data as fractional string (e.g., "5/1")
 */
export function formatOdds(odds: OddsData | number | undefined): string {
    if (!odds) return '-';
    
    // Handle legacy numeric odds (assume denominator = 1)
    if (typeof odds === 'number') {
        return `${odds}/1`;
    }
    
    return `${odds.numerator}/${odds.denominator}`;
}

/**
 * Parse fractional odds string (e.g., "5/1") or decimal (e.g., "2.5") into OddsData
 */
export function parseOddsInput(oddsString: string): OddsData {
    const trimmed = oddsString.trim();
    
    // Try parsing as fractional odds (e.g., "5/2")
    if (trimmed.includes('/')) {
        const parts = trimmed.split('/');
        if (parts.length === 2) {
            const numerator = parseFloat(parts[0]);
            const denominator = parseFloat(parts[1]);
            
            if (!isNaN(numerator) && !isNaN(denominator) && denominator !== 0) {
                return {
                    numerator,
                    denominator,
                    decimal: numerator / denominator + 1
                };
            }
        }
    }
    
    // Try parsing as decimal odds (e.g., "2.5")
    const decimal = parseFloat(trimmed);
    if (!isNaN(decimal) && decimal > 1) {
        const fractional = decimal - 1;
        return {
            numerator: fractional,
            denominator: 1,
            decimal: decimal
        };
    }
    
    // Default fallback for invalid input
    return {
        numerator: 0,
        denominator: 1,
        decimal: 1
    };
}

/**
 * Parse fractional odds string (e.g., "5/1") into OddsData
 */
export function parseOdds(oddsString: string): OddsData | null {
    const parts = oddsString.trim().split('/');
    if (parts.length !== 2) return null;
    
    const numerator = parseFloat(parts[0]);
    const denominator = parseFloat(parts[1]);
    
    if (isNaN(numerator) || isNaN(denominator) || denominator === 0) {
        return null;
    }
    
    return {
        numerator,
        denominator,
        decimal: numerator / denominator + 1
    };
}

/**
 * Convert OddsData to decimal odds
 */
export function toDecimalOdds(odds: OddsData | number): number {
    if (typeof odds === 'number') {
        return odds + 1;
    }
    return odds.decimal || (odds.numerator / odds.denominator + 1);
}

/**
 * Calculate implied probability from odds
 */
export function calculateImpliedProbability(odds: OddsData | number): number {
    const decimal = typeof odds === 'number' ? odds + 1 : toDecimalOdds(odds);
    return 1 / decimal;
}

/**
 * Create OddsData from numeric fractional odds (legacy support)
 */
export function createOddsData(numerator: number, denominator: number = 1): OddsData {
    return {
        numerator,
        denominator,
        decimal: numerator / denominator + 1
    };
}
