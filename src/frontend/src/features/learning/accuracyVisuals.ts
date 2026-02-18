/**
 * Helper functions to map accuracy percentage to visual indicators (color and emoji)
 */

export interface AccuracyVisuals {
    color: string;
    emoji: string;
}

/**
 * Maps an accuracy percentage (0-100) to a red→green color value and attitude emoji
 */
export function getAccuracyVisuals(accuracy: number): AccuracyVisuals {
    // Clamp accuracy to 0-100 range
    const clampedAccuracy = Math.max(0, Math.min(100, accuracy));

    // Determine emoji based on accuracy ranges
    let emoji: string;
    if (clampedAccuracy < 20) {
        emoji = '😰'; // Very low - distressed
    } else if (clampedAccuracy < 40) {
        emoji = '😟'; // Low - worried
    } else if (clampedAccuracy < 60) {
        emoji = '😐'; // Medium - neutral
    } else if (clampedAccuracy < 80) {
        emoji = '🙂'; // Good - slightly happy
    } else if (clampedAccuracy < 95) {
        emoji = '😊'; // Very good - happy
    } else {
        emoji = '🎯'; // Excellent - target hit
    }

    // Calculate color: red (0%) → yellow (50%) → green (100%)
    // Using HSL for smooth transition: 0° = red, 60° = yellow, 120° = green
    const hue = (clampedAccuracy / 100) * 120; // 0 to 120 degrees
    const color = `hsl(${hue}, 70%, 45%)`;

    return { color, emoji };
}

/**
 * Returns an English qualitative label for an accuracy percentage,
 * aligned to the existing emoji ranges for consistent screen-reader labeling.
 */
export function getAccuracyLabel(accuracy: number): string {
    const clampedAccuracy = Math.max(0, Math.min(100, accuracy));
    
    if (clampedAccuracy < 20) {
        return 'Very low accuracy';
    } else if (clampedAccuracy < 40) {
        return 'Low accuracy';
    } else if (clampedAccuracy < 60) {
        return 'Medium accuracy';
    } else if (clampedAccuracy < 80) {
        return 'Good accuracy';
    } else if (clampedAccuracy < 95) {
        return 'Very good accuracy';
    } else {
        return 'Excellent accuracy';
    }
}

/**
 * Returns emoji and label for ROI percentage
 */
export function getROIVisuals(roi: number): { emoji: string; label: string } {
    if (roi >= 50) {
        return { emoji: '🚀', label: 'Exceptional ROI' };
    } else if (roi >= 20) {
        return { emoji: '💰', label: 'Strong positive ROI' };
    } else if (roi >= 5) {
        return { emoji: '📈', label: 'Positive ROI' };
    } else if (roi >= -5) {
        return { emoji: '➖', label: 'Neutral ROI' };
    } else if (roi >= -20) {
        return { emoji: '📉', label: 'Negative ROI' };
    } else {
        return { emoji: '💸', label: 'Poor ROI' };
    }
}

/**
 * Returns emoji and label for calibration score (0-1 scale)
 */
export function getCalibrationVisuals(calibrationScore: number): { emoji: string; label: string } {
    // Calibration score is 1 - brierScore, so higher is better
    if (calibrationScore >= 0.95) {
        return { emoji: '🎯', label: 'Excellent calibration' };
    } else if (calibrationScore >= 0.85) {
        return { emoji: '😊', label: 'Very good calibration' };
    } else if (calibrationScore >= 0.75) {
        return { emoji: '🙂', label: 'Good calibration' };
    } else if (calibrationScore >= 0.65) {
        return { emoji: '😐', label: 'Fair calibration' };
    } else if (calibrationScore >= 0.50) {
        return { emoji: '😟', label: 'Poor calibration' };
    } else {
        return { emoji: '😰', label: 'Very poor calibration' };
    }
}

/**
 * Returns visuals for Model Mood states
 */
export function getMoodVisuals(mood: 'High' | 'Medium' | 'Low'): {
    emoji: string;
    color: string;
    label: string;
} {
    switch (mood) {
        case 'High':
            return {
                emoji: '🔥',
                color: 'text-green-600 dark:text-green-400',
                label: 'High confidence - model is performing well'
            };
        case 'Medium':
            return {
                emoji: '😐',
                color: 'text-yellow-600 dark:text-yellow-400',
                label: 'Medium confidence - model is performing adequately'
            };
        case 'Low':
            return {
                emoji: '😰',
                color: 'text-red-600 dark:text-red-400',
                label: 'Low confidence - model is struggling'
            };
    }
}
