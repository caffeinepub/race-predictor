export interface ValidationResult {
    isValid: boolean;
    errors: string[];
}

export function validateContenders(contenders: { number: string; odds: number }[]): ValidationResult {
    const errors: string[] = [];

    if (contenders.length === 0) {
        errors.push('At least one contender is required');
        return { isValid: false, errors };
    }

    const hasValidOdds = contenders.some((c) => c.odds > 0);
    if (!hasValidOdds) {
        errors.push('At least one contender must have valid odds greater than 0');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

export function validateWinner(winner: string, contenders: { number: string }[]): ValidationResult {
    const errors: string[] = [];

    if (!winner) {
        errors.push('Please select the actual winner');
        return { isValid: false, errors };
    }

    const isValidContender = contenders.some((c) => c.number === winner);
    if (!isValidContender) {
        errors.push('Winner must be one of the contenders');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

export function validatePodium(
    firstPlace: string,
    secondPlace: string,
    thirdPlace: string,
    contenders: { number: string }[]
): ValidationResult {
    const errors: string[] = [];

    if (!firstPlace || !secondPlace || !thirdPlace) {
        errors.push('Please select all three podium positions (1st, 2nd, 3rd)');
        return { isValid: false, errors };
    }

    // Check all are different
    const positions = [firstPlace, secondPlace, thirdPlace];
    const uniquePositions = new Set(positions);
    if (uniquePositions.size !== 3) {
        errors.push('1st, 2nd, and 3rd place must be different horses');
    }

    // Check all are valid contenders
    const contenderNumbers = new Set(contenders.map(c => c.number));
    positions.forEach((pos, idx) => {
        if (!contenderNumbers.has(pos)) {
            errors.push(`${['1st', '2nd', '3rd'][idx]} place must be one of the contenders`);
        }
    });

    return {
        isValid: errors.length === 0,
        errors
    };
}

export function validateMargins(
    firstPlaceMargin: string,
    secondPlaceMargin: string,
    thirdPlaceMargin: string
): ValidationResult {
    const errors: string[] = [];

    // Margins are optional, but if provided must be valid
    const margins = [
        { value: firstPlaceMargin, label: '1st place margin' },
        { value: secondPlaceMargin, label: '2nd place margin' },
        { value: thirdPlaceMargin, label: '3rd place margin' }
    ];

    margins.forEach(({ value, label }) => {
        if (value && value.trim() !== '') {
            const num = parseFloat(value);
            if (isNaN(num)) {
                errors.push(`${label} must be a valid number`);
            } else if (num < 0) {
                errors.push(`${label} cannot be negative`);
            }
        }
    });

    return {
        isValid: errors.length === 0,
        errors
    };
}
