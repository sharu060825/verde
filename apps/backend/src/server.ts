import app from './app.js';
import { ensureDemoUserExists } from './utils/seedDemoUser.js';

const port = Number(process.env.PORT || 5000);

app.listen(port, async () => {
  console.log(`Backend running on port ${port}`);
  try {
    await ensureDemoUserExists();
  } catch (err) {
    console.error('Demo seed check error:', err);
  }
});
