7-13-2026
mplemented the child-only theme switcher.
Changed:
[components/app-shell.tsx]
Added Theme: Original / Theme: Neon Quest toggle for child users only.
Saves the choice in localStorage as growtogether-child-theme.
Applies data-child-theme="neon-quest" only for child screens.
Parent screens do not show the button.
Child /parent blocking still works.

[app/globals.css]
Kept the original child theme as default.
Added a scoped Neon Quest theme with dark HUD colors, neon accents, sharper controls, and themed mobile nav/background.

Verified:
npx.cmd eslint components\app-shell.tsx app\globals.css --quiet passed.
npm.cmd run build passed.

Implemented the Neon Quest tone upgrade.
What changed:
Added [child-theme-context.tsx]so child screens know when Neon Quest is active.
Updated Neon Quest copy across:[app-shell.tsx]
[dashboard-page.tsx]
[discover-page.tsx]
[check-in-page.tsx]
[memory-page.tsx]
shared cards for next move, streaks, and badges

Examples of new tone:
“Stack XP, catch Ws, and keep the streak spicy. No cap.”
“Build your loadout. Make it loud.”
“Quest engine is cooking.”
“Mission posted. Squad can see the W.”
“Replay vault”
“Flex Badges”
“BIG W”
Verified:
Focused ESLint passed.
npm.cmd run build passed.