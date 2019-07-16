const express = require('express');
const router = express.Router();
import { sendPush } from '../services/pushNotifications.js';
import { runGameEngine } from '../services/gameEngine.js';

const { admin } = require('../config/firebase.js');
import moment from 'moment-timezone';
const schedule = require('node-schedule');

// Set push scheduler rules
// Set to every hour when minutes are 0
const pushRule = new schedule.RecurrenceRule();
pushRule.minute = 1; // eslint-disable-line

// Push Scheduler job
const pushjob = schedule.scheduleJob(pushRule, (fireDate) => {
  getActiveCompetitions();
  // console.log('Push job was supposed to run at ' + fireDate + ', but actually ran at ' + new Date());
});

const updateGamejob = schedule.scheduleJob('*/7 * * * * *', (fireDate) => {
  runGameEngine();
  // console.log('Match engine job was supposed at ' + fireDate + ', but actually ran at ' + new Date());
});


// Get competitions and filter only active ( started and not ended ) competitions
const getActiveCompetitions = () => {
  const competitionRef = admin.database().ref('competitions');
  competitionRef.once('value')
    .then(snapshot => snapshotToArray(snapshot))
    .then(competitions => competitions.filter(x => x.started && !x.ended))
    .then(competitions => {
        checkTimezone(competitions);
    })
    .catch(err => console.log(err));
};

// Check what hour is in competition timezone
// Set notification type based on timezone
const checkTimezone = (competitions) => {
  competitions.map(competition => {
    const currentHour = moment().tz(competition.timezone).hours();
    if (currentHour === 6){
      getPlayers(competitions, 'breakfastStart');
    } else if (currentHour === 9) {
      getPlayers(competitions, 'breakfastEnd');
    } else if (currentHour === 11) {
      getPlayers(competitions, 'lunchStart');
    } else if (currentHour === 14) {
      getPlayers(competitions, 'lunchEnd');
    } else if (currentHour === 17){
      getPlayers(competitions, 'dinnerStart');
    } else if (currentHour === 19) {
      getPlayers(competitions, 'dinnerEnd');
    }
  });
};

// Get players from competition
const getPlayers = (competitions, type) => {
  competitions.map(competition => getPushToken(competition.players, type));
};

// Get push token from players and send push
const getPushToken = (players, type) => {
  const pushTokens = players.map(player => player.pushToken);
  sendPush(pushTokens, type);
};

// Transform firebase object to array
const snapshotToArray = (snap) => {
  const arr = [];
  snap.forEach(res => {
     arr.push(res.val()); // eslint-disable-line
  });
  return arr;
};

/* GET home page. */
// router.get('/', function(req, res, next) {
//   res.render('index', { title: 'Cateno' });
// });

module.exports = router;
