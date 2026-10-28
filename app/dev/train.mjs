// Dev UI only (#25): start a training job on the training service and poll its status. Never shipped.
import { SERVICE, post } from './record.mjs';

export const jobText = ({ id, model_kind, status, metrics, error }) =>
  `job ${id} (${model_kind}): ${status}` +
  (metrics ? ` ${JSON.stringify(metrics)}` : '') + (error ? `: ${error}` : '');

if (globalThis.document) {
  const button = document.getElementById('train');
  const out = document.getElementById('train-status');
  button.onclick = async () => {
    button.disabled = true;
    try {
      let job = await post('/jobs', { model_kind: document.getElementById('model-kind').value });
      while (job.status === 'queued' || job.status === 'running') {
        out.textContent = jobText(job);
        await new Promise((r) => setTimeout(r, 1000));
        job = await (await fetch(`${SERVICE}/jobs/${job.id}`)).json();
      }
      out.textContent = jobText(job);
    } catch (e) { out.textContent = `error: ${e.message}`; }
    button.disabled = false;
  };
}
