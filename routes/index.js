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
    .then(competitions => console.log(competitions))
    .catch(err => console.log(err));
}

const getPlayers = (competitions) => {
  competitions.map(competition => competition)
}

const sendPushNotification = (type) => {

}

getActiveCompetitions()

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

module.exports = router;
