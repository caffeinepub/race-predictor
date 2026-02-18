# Specification

## Summary
**Goal:** Add richer on-device race/horse stats, adaptive weighted predictions, and updated bet sizing limits while keeping existing saved data compatible.

**Planned changes:**
- Extend the on-device RaceEntry model to record horse-level performance history inputs needed for Win/Place/Show and Recent Form, including optional 1st/2nd/3rd podium margin fields while keeping old saved entries loading safely.
- Update the New Entry “Race Outcome” step to capture optional 1st/2nd/3rd place margin values with English labels and validation (non-negative numeric when provided), without changing the existing top-3 outcome workflow.
- Reintroduce computed horse-level stats from saved history (Win %, Place %, Show %, and last-5 Recent Form using podium positions and margins when available) and display them in the Stats view with clear English labels and graceful handling of missing margins.
- Enhance the prediction model to combine market odds with learned performance signals using stored, learnable feature weights (“trust factors”), and update these weights after each saved race based on predicted probabilities vs actual outcomes; output updated per-contender implied probabilities and a new strategyId.
- Add streak/slump and variance/consistency signals (variance based on margins when available), incorporate them into confidence, and surface them in the Stats view with English labels and graceful degradation when margins are unavailable.
- Update bet sizing guidance and EntryFlow bet amount UI/validation to enforce a minimum bet of 100 and maximum bet of 10,000 (inclusive) with English labels.
- Update on-device storage schema/version handling so newly added learned-state fields (horse stats, streak/variance signals, and feature weights) default safely when missing and recompute from history without breaking existing users’ saved data.

**User-visible outcome:** Users can log races with optional podium margins, view expanded horse-by-number stats (including recent form, streak/variance where available), get predictions that adapt over time via weighted signals, and enter bets constrained to 100–10,000 without losing existing on-device history.
