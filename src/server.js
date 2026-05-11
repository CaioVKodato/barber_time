import { createApp } from './app.js';
import { env, assertDatabaseUrl } from './config/env.js';

assertDatabaseUrl();

const app = createApp();

app.listen(env.port, () => {
  console.log(`BarberTime API ouvindo na porta ${env.port}`);
});
