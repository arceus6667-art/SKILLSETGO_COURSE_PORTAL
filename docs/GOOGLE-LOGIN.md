# Enable Google sign-in

Target: **SKILLSETGOCOURCES**, AgentTrap AI organization, project `smdgqmmnqbhqqhkyqxok`.

The app already implements Supabase OAuth with PKCE, secure cookie exchange, session refresh, and authorization from the protected database profile. A sign-in portal choice does not grant Admin access.

1. Create a **Web application** OAuth client in Google Cloud. Configure its consent screen and authorized test users while the OAuth app is in testing.
2. Set this exact authorized redirect URI in Google Cloud:

   ```text
   https://smdgqmmnqbhqqhkyqxok.supabase.co/auth/v1/callback
   ```

3. In Supabase Authentication → Sign In / Providers → Google, enter the client ID and client secret, then enable Google. The Google client secret belongs in Supabase, not in GitHub or browser code.
4. In Supabase URL Configuration, add the app's `/auth/callback` URL to the redirect allowlist. For the current local preview use `http://127.0.0.1:3000/auth/callback`. Add the final deployed HTTPS origin later.
5. In the private app environment, set `GOOGLE_AUTH_ENABLED=true`, the canonical `NEXT_PUBLIC_APP_URL`, and `APP_MODE=live` after the private backend credential is configured. Restart the app after changing environment variables.
6. Test a full Google sign-in. New accounts always receive the **User** role, regardless of metadata supplied by the client.

The project owner may assign **Admin** to a known authenticated account in the protected `profiles` table. Select the exact account by its verified email/UUID; the application does not automatically make the first visitor an administrator. There are no other profile types.

Do not mark Google sign-in as verified until the complete browser redirect, callback exchange, profile creation and authorized portal access have passed. The live provider was checked during this build and was still disabled.
