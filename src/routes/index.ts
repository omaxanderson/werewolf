import express from 'express';
import bodyParser from 'body-parser';
const router = express.Router();

const homeHandler = (req, res, next) => {
  res.render('home', {
    title: 'Werewolf Online',
  });
};

router.get('/', homeHandler);
router.get(/^\/[a-f0-9]{8}/, homeHandler);

export default router;
