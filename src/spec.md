# Specification

## Summary
**Goal:** Rename the app to “GTA Online Horse Track Guesser”, switch odds entry/display to a fractional “X/1” format, and add in-app help explaining how to get an Android APK via a WebView wrapper.

**Planned changes:**
- Rename all user-visible instances of the app name from “Race Predictor” to “GTA Online Horse Track Guesser” (header title, app icon alt text, and HTML document title).
- Update the New Entry odds input to a single numeric numerator field with a fixed, non-editable “/1” suffix, using “-/1” as the blank/empty state, while keeping odds stored/used as numeric values (X in X/1) and preserving existing English validation behavior.
- Update all odds displays across the UI to render as “{numerator}/1” (and remove/update any examples that show odds as plain decimals or raw numbers).
- Add a clearly discoverable in-app “Android APK” help section in English that explains generating an APK by wrapping the deployed site URL in a WebView via a website-to-APK generator, explicitly mentioning “websitetoapk.com”.

**User-visible outcome:** The app is titled “GTA Online Horse Track Guesser”, odds are entered and shown consistently as “X/1”, and users can find in-app instructions for creating an Android APK from the deployed web app using a WebView wrapper (with the referenced generator site).
