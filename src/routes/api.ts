import express from 'express';
import client, { ok } from '../Redis';
const router = express.Router();

router.get('/leaderboard', async (req, res, next) => {
  // get redis and return
  if (await ok()) {
    const stats = await client.get('all-time-stats');
    return res.send(stats);
  } else {
    return res.send({
      error: 'Redis is not connected, please try again. Or get Max to fix it.',
    });
  }
});

export default router;
