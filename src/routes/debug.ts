import express from 'express';
import Redis from '../Redis';
const router = express.Router();

const homeHandler = (req, res, next) => {
  res.render('home', {
    title: 'Werewolf Online',
  });
};

router.get('/gameOptions', async (req, res, next) => {
  const { gameId } = req.query;
  const t = await Redis.get(`game-${gameId}`);
  console.log('getting game options');
  res.send(t);
});
router.get('/characters', async (req, res, next) => {
  const { gameId } = req.query;
  const t = await Redis.get(`characters-${gameId}`);
  console.log('getting characters options');
  res.send(t);
});

export default router;
