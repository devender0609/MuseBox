# Cantoa v18.9.1 Release Notes

Maintenance update built from the user-supplied v18.9.0 baseline.

## Fixes
- Defines the previously missing `--accent` theme token as the active Cantoa palette accent so newer controls no longer lose accent/focus/border styling.
- Defines the legacy `--card` token from the active theme surface, preventing older panels from falling back to white in dark mode.
- Adds explicit dark/light treatment for collaboration/status rows that may reuse legacy card styling.
- Forces social-destination SVG icons and labels to readable theme foregrounds while retaining a distinct WhatsApp accent.
- Retains all v18.9.0 Smart Remix, Vibe Match, Blend, signed-URL recovery, focus management, billing, quota and provider behavior.

No SQL or new environment variables are required.
