import express from 'express';
import bodyParser from 'body-parser';
const router = express.Router();

router.get('/', (req, res, next) => {
  res.render('home', {
    title: 'test test',
  });
});

router.get('^/:roomId([0-9a-fA-F]{8})$', (req, res) => {
  const { roomId } = req.params;
  console.log('roomid', roomId);
  res.render('home', {
    roomId,
    title: 'in the room!!!',
  });
});

export default router;
