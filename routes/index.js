var express = require('express');
var router = express.Router();
import { sendPush } from '../services/pushNotifications.js';
const { admin } = require('../config/firebase.js');
import moment from 'moment-timezone';
var schedule = require('node-schedule');

// Set scheduler rules
// Every hour when minutes are 0
var rule = new schedule.RecurrenceRule();
rule.minute = 0;

// Scheduler job
var job = schedule.scheduleJob(rule, (fireDate) => {
  getActiveCompetitions()
  console.log('This job was supposed to run at ' + fireDate + ', but actually ran at ' + new Date());
});

// Transform firebase object to array
const snapshotToArray = (snap) => {
  const arr = [];
  snap.forEach(res => {
     arr.push(res.val()); // eslint-disable-line
  });
  return arr;
};

// Get competitions and filter only active ( started and not ended )
const getActiveCompetitions = () => {
  const competitionRef = admin.database().ref('competitions');
  competitionRef.once('value')
    .then(snapshot => snapshotToArray(snapshot))
    .then(competitions => competitions.filter(x => x.started && !x.ended))
    .then(competitions => checkTimezone(competitions))
    .catch(err => console.log(err));
}

// Check what hour is in competition timezone
// Set notification type based on timezone
const checkTimezone = (competitions) => {
  competitions.map(competition => {
    const currentHour = moment().tz(competition.timezone).hours();
    if (currentHour === 6){
      getPlayers(competitions, 'breakfastStart')
    } else if (currentHour === 11) {
      getPlayers(competitions, 'lunchStart')
    } else if (currentHour === 17){
      getPlayers(competitions, 'dinnerStart')
    } else if (currentHour === 9) {
      getPlayers(competitions, 'breakfastEnd')
    } else if (currentHour === 14) {
      getPlayers(competitions, 'lunchEnd')
    } else if (currentHour === 19) {
      getPlayers(competitions, 'dinnerEnd')
    }
  })
}

// Get players from competition
const getPlayers = (competitions, type) => {
  competitions.map(competition => getPushToken(competition.players, type))
}

// Get push token from players and send push
const getPushToken = (players, type) => {
  const pushTokens = players.map(player => player.pushToken)
  console.log(pushTokens, type)
  sendPush(pushTokens, type)
}

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

module.exports = router;
