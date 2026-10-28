// Dev UI only (#25): start a training job on the training service and poll its status. Never shipped.
import { SERVICE, post } from './record.mjs';

export const jobView = ({ id, model_kind, status, metrics, error }) => ({
  title: `Training job ${id} (${model_kind}): ${status}`,
  rows: Object.entries(metrics ?? {}).map(([k, v]) => [k, String(v)]),
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
    $('train-error').textContent = error ?? '';
  };
  button.onclick = async () => {
    button.disabled = true;
    try {
      let job = await post('/jobs', { model_kind: $('model-kind').value });
      while (job.status === 'queued' || job.status === 'running') {
        show(jobView(job));
        await new Promise((r) => setTimeout(r, 1000));
        job = await (await fetch(`${SERVICE}/jobs/${job.id}`)).json();
      }
      show(jobView(job));
    } catch (e) { show({ error: `error: ${e.message}` }); }
    button.disabled = false;
  };
}
