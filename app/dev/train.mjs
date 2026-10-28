// Dev UI only (#25): start a training job on the training service and poll its status. Never shipped.
import { SERVICE, post, showStatus } from './record.mjs';

// Nested metric objects (e.g. per-class scores) become dotted labels: per_class.idle.
const flatten = (obj, prefix = '') => Object.entries(obj).flatMap(([k, v]) =>
  v && typeof v === 'object' ? flatten(v, `${prefix}${k}.`) : [[prefix + k, String(v)]]);

export const jobView = ({ id, model_kind, status, metrics, error }) => ({
  title: `Training job ${id} (${model_kind}): ${status}`,
  rows: flatten(metrics ?? {}),
  error,
});

if (globalThis.document) {
  const $ = (id) => document.getElementById(id);
  const button = $('train');
  const show = ({ title = '', rows = [], error }) => {
    $('train-title').textContent = title;
    $('train-metrics').replaceChildren(...rows.flatMap(([k, v]) => {
      const dt = document.createElement('dt'), dd = document.createElement('dd');
      dt.textContent = k; dd.textContent = v; return [dt, dd];
    }));
    showStatus($('train-error'), error ?? '', true);
  };
  button.onclick = async () => {
    button.disabled = true;
    let view = {};
    try {
      let job = await post('/jobs', { model_kind: $('model-kind').value });
      while (job.status === 'queued' || job.status === 'running') {
        show(view = jobView(job));
        await new Promise((r) => setTimeout(r, 1000));
        job = await (await fetch(`${SERVICE}/jobs/${job.id}`)).json();
      }
      show(jobView(job));
    } catch (e) { show({ ...view, error: `error: ${e.message}` }); } // keep the last known job title
    button.disabled = false;
  };
}
