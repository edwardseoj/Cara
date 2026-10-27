// M0.5 spike (#17): PKCE login with a Client ID only, then toggle play/pause.
// Usage: SPOTIFY_CLIENT_ID=<id> node spike/spotify-pkce.js   (PORT optional, default 8888)
const crypto = require('node:crypto');
const http = require('node:http');

const SCOPES = 'user-read-playback-state user-modify-playback-state';
const b64url = (buf) => buf.toString('base64url');
const challengeOf = (verifier) => b64url(crypto.createHash('sha256').update(verifier).digest());

async function spotify(token, method, path) {
  const res = await fetch(`https://api.spotify.com/v1${path}`, { method, headers: { Authorization: `Bearer ${token}` } });
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null };
}

function waitForCode(port, state) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url, `http://127.0.0.1:${port}`);
      if (url.pathname !== '/callback') return res.writeHead(404).end();
      res.end('Cara: you can close this tab.');
      server.close();
      if (url.searchParams.get('state') !== state) return reject(new Error('state mismatch'));
      const err = url.searchParams.get('error');
      err ? reject(new Error(`authorize failed: ${err}`)) : resolve(url.searchParams.get('code'));
    });
    server.listen(port, '127.0.0.1');
  });
}

async function main() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  if (!clientId) throw new Error('set SPOTIFY_CLIENT_ID');
  const port = Number(process.env.PORT || 8888);
  // Spotify requires a loopback IP literal, not "localhost".
  const redirectUri = `http://127.0.0.1:${port}/callback`;
  const verifier = b64url(crypto.randomBytes(64));
  const state = b64url(crypto.randomBytes(16));

  const authUrl = new URL('https://accounts.spotify.com/authorize');
  authUrl.search = new URLSearchParams({
    client_id: clientId, response_type: 'code', redirect_uri: redirectUri,
    scope: SCOPES, code_challenge_method: 'S256', code_challenge: challengeOf(verifier), state,
  });
  console.log(`Redirect URI to register: ${redirectUri}\nOpen this URL:\n${authUrl}`);

  const code = await waitForCode(port, state);
  const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code', code, redirect_uri: redirectUri, client_id: clientId, code_verifier: verifier,
    }),
  });
  const tokens = await tokenRes.json();
  if (!tokenRes.ok) throw new Error(`token exchange ${tokenRes.status}: ${JSON.stringify(tokens)}`);
  console.log(`token ok: expires_in=${tokens.expires_in}s scope="${tokens.scope}" refresh_token=${Boolean(tokens.refresh_token)}`);

  const player = await spotify(tokens.access_token, 'GET', '/me/player');
  // 204 = no active device
  const playing = player.status === 200 && player.body.is_playing;
  const res = await spotify(tokens.access_token, 'PUT', playing ? '/me/player/pause' : '/me/player/play');
  console.log(`${playing ? 'pause' : 'play'} -> ${res.status}`, res.body ? JSON.stringify(res.body) : '');
}

module.exports = { challengeOf };

if (require.main === module) main().catch((e) => { console.error(e.message); process.exit(1); });
