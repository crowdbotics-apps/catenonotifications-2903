var express = require('express');
var router = express.Router();

// console.log('test')

router.post('/', function(req, res, next) {
  console.log(req.body.type)
  console.log(req.body.pushTokens)
  res.send('Rates router');
});

module.exports = router;
