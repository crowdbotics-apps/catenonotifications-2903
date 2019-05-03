var express = require('express');
var router = express.Router();
import { sendPush } from '../services/pushNotifications.js';
const { admin } = require('../config/firebase.js');

const snapshotToArray = (snap) => {
  const arr = [];
  snap.forEach(res => {
     arr.push(res.val()); // eslint-disable-line
  });
  return arr;
};

const getActiveCompetitions = () => {
  const competitionRef = admin.database().ref('competitions');
  competitionRef.once('value')
    .then(snapshot => snapshotToArray(snapshot))
    .then(competitions => competitions.filter(x => x.started && !x.ended))
    .then(competitions => getPlayers(competitions))
    .catch(err => console.log(err));
}

const getPlayers = (competitions) => {
  // console.log(competitions)
  competitions.map(competition => getPushToken(competition.players))
}

const getPushToken = (players) => {
  const pushTokens = players.map(player => player.pushToken)
  console.log(pushTokens)
  sendPush(pushTokens)
}

// const sendPushNotification = (pushToken) => {
//   console.log(pushToken)
//   sendPush(pushToken)
// }

getActiveCompetitions()

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

module.exports = router;
