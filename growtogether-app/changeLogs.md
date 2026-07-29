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

7-28-26
Implemented the email/password auth + private family data migration.
Changed:
[auth-context.tsx]
Replaced localStorage-only login with Supabase Auth.
Added signIn, createParentAccount, createChildAccount, signOut.
Loads the current app profile from family_users.auth_user_id.

[login-page.tsx]
New email/password sign-in.
New parent account creation with family code.
New child account creation that joins a parent-created family code.

[supabase-setup.sql]
Added families.created_by.
Added family_users.auth_user_id.
Removed permissive anon access.
Added authenticated-only RLS policies.
Added RPC functions for parent family creation, child family join, and protected progress increment.

[README.md]
Added Supabase Email Auth setup instructions.

Verified:
npx.cmd eslint components\app-shell.tsx components\providers\auth-context.tsx components\screens\login-page.tsx lib\supabase-hooks.ts --quiet passed.
npm.cmd run build passed.
Important next steps:
In Supabase, run the updated supabase-setup.sql.
In Supabase Dashboard, go to Authentication > Providers > Email.
Enable Email auth.
For this MVP, turn off Confirm email.
Create a parent account first, then create a child account with that same family code.
Existing old demo rows without auth_user_id will not be visible under the new private RLS model unless you manually link them or recreate the data.

The error happened because the SQL function had an input parameter named name and also returned a table column named name. Postgres treats both as parameters, so it rejected the function.
I changed:
room_code -> p_room_code
name -> p_name
role -> p_role
emoji -> p_emoji
And updated the app RPC calls in [auth-context.tsx]to use those new parameter names.
I also added:
drop function if exists public.create_family_for_current_user(text, text, text);
drop function if exists public.join_family_by_code(text, text, text, text);
So rerunning [supabase-setup.sql]is cleaner.
Verified:
npx.cmd eslint components\providers\auth-context.tsx --quiet passed.
npm.cmd run build passed.
Now rerun the full updated supabase-setup.sql in Supabase SQL Editor.