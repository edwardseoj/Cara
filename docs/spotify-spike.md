# Spotify PKCE spike (M0.5, #17)

Script: `app/spike/spotify-pkce.js`. It logs in with a Client ID only, then toggles play/pause on the active device.

## Run it

1. In the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard), create an app and add `http://127.0.0.1:8888/callback` to its Redirect URIs.
2. `cd app && SPOTIFY_CLIENT_ID=<your id> node spike/spotify-pkce.js` (set `PORT` to use another port; register that URI instead).
3. Open the printed URL, approve, and the script prints the token info and the play/pause result.
4. Start playback on some device first, or you get the no-active-device error.

## Findings

"Observed" means seen in a real run on 2026-10-28. "Docs" means taken from Spotify's documentation and not yet observed.

| Question | Finding | Status |
|---|---|---|
| Redirect URI shape | `http://127.0.0.1:<port>/callback`. Spotify requires a loopback IP literal over HTTP; `localhost` is rejected. The port must match the registered URI exactly. | Observed: `http://127.0.0.1:8888/callback` worked |
| Scopes needed | `user-read-playback-state` (to read `is_playing`) and `user-modify-playback-state` (play/pause). Like/unlike will later need `user-library-modify`. | Observed: both granted, token response lists exactly these two |
| Token lifetime | `expires_in` is 3600 s. A refresh token is returned for PKCE and is exchanged at the same token endpoint with `grant_type=refresh_token` and no secret. | Observed: `expires_in=3600`, `refresh_token` present. Refresh not exercised |
| No active device | `PUT /me/player/play` or `/pause` returns 404 with reason `NO_ACTIVE_DEVICE`; `GET /me/player` returns 204 with no body. | Docs |
| Pause response | Docs say 204 with no body. Observed `PUT /me/player/pause` returns **200 with a plain-text body**, so a client must not JSON-parse play/pause responses. `GET /me/player` returned 200 with an active device. | Observed |
| Non-Premium | Playback control returns 403 with reason `PREMIUM_REQUIRED`. | Docs |

## Not done

- No token storage or refresh. That belongs to #30.
- Still "Docs" only: the no-active-device error, the non-Premium error, and `play` (run the script again after a pause to see it). #17 stays open until these are observed.
