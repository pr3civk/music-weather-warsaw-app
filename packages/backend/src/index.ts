import { createApp } from './app.js';
import { env } from './env.js';
import { startCronJobs, runHourlyFetch } from './jobs/hourlyFetch.js';

const app = createApp();

app.listen(env.PORT, () => {
  console.log(`[backend] listening on ${env.PORT}`);
  startCronJobs();
  runHourlyFetch().catch((e) => console.error('[cron] initial run failed', e));
});
