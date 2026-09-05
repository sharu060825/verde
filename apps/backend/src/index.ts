import express from 'express';

const app = express();
const port = Number(process.env.PORT || 5000);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`Backend listening on port ${port}`);
});
