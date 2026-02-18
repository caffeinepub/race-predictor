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
