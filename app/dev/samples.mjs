// Dev UI: sample counts per gesture / recording session, and delete a sample by id (#24).
import { SERVICE, GESTURE_LABELS, showStatus } from './record.mjs';

export function countRows({ by_gesture, by_session }, labels) {
  const names = [...new Set([...labels, ...Object.keys(by_gesture)])];
  return { gestures: names.map((l) => [l, by_gesture[l] ?? 0]), sessions: Object.entries(by_session) };
}

if (typeof document !== 'undefined') {
  const err = document.getElementById('dataset-error');
  const id = document.getElementById('delete-id');
  const fill = (tbody, rows) => tbody.replaceChildren(...rows.map((cells) => {
    const tr = document.createElement('tr');
    tr.append(...cells.map((c) => Object.assign(document.createElement('td'), { textContent: c })));
    return tr;
  }));

  const refresh = async () => {
    try {
      const { gestures, sessions } = countRows(await (await fetch(SERVICE + '/counts')).json(), GESTURE_LABELS);
      fill(document.getElementById('gesture-counts'), gestures);
      fill(document.getElementById('session-counts'), sessions);
      showStatus(err, '', true);
    } catch (e) { showStatus(err, `error: ${e.message}`, true); }
  };

  document.getElementById('delete').onclick = async () => {
    try {
      const res = await fetch(`${SERVICE}/samples/${Number(id.value)}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json()).error || res.status);
      showStatus(err, '', true);
      refresh();
    } catch (e) { showStatus(err, `error: ${e.message}`, true); }
  };

  document.addEventListener('sample-saved', refresh); // dispatched by dev-ui.mjs
  refresh();
}
