# Users bring their own Spotify Client ID by default

Spotify apps in development mode only allow users the owner allowlists by hand, which doesn't scale beyond a few people. Cara uses OAuth PKCE (no client secret), so it's safe for each user to register their own Spotify app and paste its Client ID into Cara's settings; this is the documented default. Being allowlisted on the maintainer's Client ID remains available as a fallback for people who don't want to register an app.
