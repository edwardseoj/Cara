// Dev UI: sample counts per gesture / recording session, and delete a sample by id (#24).
import { SERVICE } from './record.mjs';

const list = (o) => Object.entries(o).map(([k, n]) => `${k} ${n}`).join(', ') || 'none';
const listSessions = (o) => Object.entries(o).map(([k, n]) => `${k}: ${n}`).join(', ') || 'none';

export function formatCounts({ by_gesture, by_session }) {
  return `gesture: ${list(by_gesture)}\nrecording session: ${listSessions(by_session)}`;
}

if (typeof document !== 'undefined') {
  const out = document.getElementById('counts');
  const id = document.getElementById('delete-id');

  const refresh = async () => {
    try {
      out.textContent = formatCounts(await (await fetch(SERVICE + '/counts')).json());
    } catch (e) { out.textContent = `error: ${e.message}`; }
  };

  document.getElementById('delete').onclick = async () => {
    const res = await fetch(`${SERVICE}/samples/${Number(id.value)}`, { method: 'DELETE' });
    out.textContent = res.ok ? '' : `error: ${(await res.json()).error}`;
    if (res.ok) refresh();
  };

  document.addEventListener('sample-saved', refresh); // dispatched by dev-ui.mjs
  refresh();
}
