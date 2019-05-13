const express = require('express');
const router = express.Router();
import { sendPush } from '../services/pushNotifications.js';

// console.log('test')

router.post('/', function(req, res, next) {
  sendPush([req.body.pushToken], req.body.type);
  res.json({'rates': 'router'});
});

module.exports = router;
