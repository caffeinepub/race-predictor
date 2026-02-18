interface StatusEmojiProps {
  emoji: string;
  label: string;
  className?: string;
}

/**
 * Renders an emoji with accessible labeling so status meaning is not emoji-only.
 * Includes aria-label for screen readers and visually-hidden text.
 */
export function StatusEmoji({ emoji, label, className = '' }: StatusEmojiProps) {
  return (
    <span
      role="img"
      aria-label={label}
      className={`inline-block ${className}`}
      title={label}
    >
      {emoji}
      <span className="sr-only">{label}</span>
    </span>
  );
}
