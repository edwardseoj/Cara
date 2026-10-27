# Spotify PKCE spike (M0.5, #17)

Script: `app/spike/spotify-pkce.js`. It logs in with a Client ID only, then toggles play/pause on the active device.

## Run it

1. In the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard), create an app and add `http://127.0.0.1:8888/callback` to its Redirect URIs.
2. `cd app && SPOTIFY_CLIENT_ID=<your id> node spike/spotify-pkce.js` (set `PORT` to use another port; register that URI instead).
3. Open the printed URL, approve, and the script prints the token info and the play/pause result.
4. Start playback on some device first, or you get the no-active-device error.

## Findings

"Docs" means taken from Spotify's documentation and not yet observed in a run. Replace each with what the run showed.

| Question | Finding | Status |
|---|---|---|
| Redirect URI shape | `http://127.0.0.1:<port>/callback`. Spotify requires a loopback IP literal over HTTP; `localhost` is rejected. The port must match the registered URI exactly. | Docs |
| Scopes needed | `user-read-playback-state` (to read `is_playing`) and `user-modify-playback-state` (play/pause). Like/unlike will later need `user-library-modify`. | Docs |
| Token lifetime | `expires_in` is 3600 s. A refresh token is returned for PKCE and is exchanged at the same token endpoint with `grant_type=refresh_token` and no secret. | Docs; script prints `expires_in`, refresh not exercised |
| No active device | `PUT /me/player/play` or `/pause` returns 404 with reason `NO_ACTIVE_DEVICE`; `GET /me/player` returns 204 with no body. | Docs |
| Non-Premium | Playback control returns 403 with reason `PREMIUM_REQUIRED`. | Docs |

## Not done

- No token storage or refresh. That belongs to #30.
- The script was not run against Spotify, since it needs the maintainer's Client ID and a login. #17 stays open until it has been run and the table above is confirmed.
