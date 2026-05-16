import app from './app';
import { env } from './config/env';

const PORT = Number(env.PORT) || 5000;

app.listen(PORT, () => {
  console.log(`CredWallet service running on port ${PORT}`);
});
