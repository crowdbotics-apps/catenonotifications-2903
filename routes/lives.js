const express = require('express');
const router = express.Router();
import { sendPush } from '../services/pushNotifications.js';

/* GET users listing. */
router.post('/', function(req, res, next) {
  sendPush([req.body.pushToken], req.body.type);
  res.json({'lives': 'router'});
});

module.exports = router;
