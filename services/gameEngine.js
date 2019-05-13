const { admin } = require('../config/firebase.js');
import moment from 'moment-timezone';
import { sendPush } from './pushNotifications.js';

// import api from '../../../config/api.js';



export const runGameEngine = (competitions) => {
  competitions.map(competition => {
    calculateGameData(competition);
  });
};


// When any user opens competition
// Check if all users uploaded previous meal
// Player will lose a life if forget to upload
// activeMeal will update
const calculateGameData = (competition) => {

  const competitionRef = admin.database().ref(`competitions/${competition.uid}`);
  const imagesRef = admin.database().ref(`images/${competition.uid}`);


  const currentDate = moment().tz(competition.timezone);
  const startDate = moment(competition.startDate).tz(competition.timezone);
  const competitionDay = currentDate.diff(startDate, 'days');
  const currentHour = moment().tz(competition.timezone).hours();

  // const yesterdayDate = moment().subtract(1, 'days').tz(competition.timezone).format('ll');

  competitionRef.child('players')
    .once('value')
    .then(snapshot => {
      if (competitionDay === 30 && competition.started === true) {
        checkForWinners(competition, snapshot);
      } else if (competitionDay !== 30 && competition.started === true){
        snapshot.forEach(player => {
          const prevLives = player.val().lives;
          const prevStreak = player.val().streak;

          if (player.val().activeMeal === 'breakfast' && currentHour >= 10) {
            imagesRef
              .once('value')
              .then(snapshot => snapshotToArray(snapshot))
              .then(images => {
                images.some(img => isBreakfastUploaded(competition, img, player.val())) === false
                ? player.ref.update({
                    lives: prevLives - 1,
                    activeMeal: currentHour >= 10 && currentHour < 15
                                ? 'lunch'
                                : currentHour >= 15 && currentHour < 20
                                ? 'dinner'
                                : currentHour >= 20
                                ? 'breakfast'
                                : null
                  })
                  .then(() => {
                    sendSystemMessage(competition, `${player.val().name} lost a life for not uploading a breakfast!`);
                    sendPushNotification(competition, 'lifeLost', player.val().uid);
                  })
                  .then(() => checkForWinner(competition, snapshot))
                  .catch(err => console.log(err))

                : console.log('breakfast uploaded');
              });

          }

          if (player.val().activeMeal === 'lunch' && currentHour >= 15) {
            imagesRef
              .once('value')
              .then(snapshot => snapshotToArray(snapshot))
              .then(images => {
                images.some(img => isLunchUploaded(competition, img, player.val())) === false
                ? player.ref.update({
                    lives: prevLives - 1,
                    activeMeal: currentHour < 20
                                ? 'dinner'
                                : currentHour >= 20
                                ? 'breakfast'
                                : null
                  })
                  .then(() => {
                    sendSystemMessage(competition, `${player.val().name} lost a life for not uploading a lunch!`);
                    sendPushNotification(competition, 'lifeLost', player.val().uid);
                  })
                  .then(() => checkForWinner(competition, snapshot))
                  .catch(err => console.log(err))

                : console.log('lunch uploaded');
              });
          }

          if (player.val().activeMeal === 'dinner' && currentHour >= 20) {
            imagesRef
              .once('value')
              .then(snapshot => snapshotToArray(snapshot))
              .then(images => {
                images.some(img => isDinnerUploaded(competition, img, player.val())) === false
                ? player.ref.update({
                    lives: prevLives - 1,
                    activeMeal: 'breakfast'
                  })
                  .then(() => {
                    sendSystemMessage(competition, `${player.val().name} lost a life for not uploading a dinner!`);
                    sendPushNotification(competition, 'lifeLost', player.val().uid);
                  })
                  .then(() => checkForWinner(competition, snapshot))
                  .catch(err => console.log(err))

                : console.log('dinner uploaded');
              });

          }

          if (player.val().activeMeal === 'dinner' && currentHour < 6) {
            imagesRef
              .once('value')
              .then(snapshot => snapshotToArray(snapshot))
              .then(images => {
                images.some(img => isDinnerUploaded(competition, img, player.val())) === false
                ? player.ref.update({
                    lives: prevLives - 1,
                    activeMeal: 'breakfast'
                  })
                  .then(() => {
                    sendSystemMessage(competition, `${player.val().name} lost a life for not uploading a dinner!`);
                    sendPushNotification(competition, 'lifeLost', player.val().uid);
                  })
                  .then(() => checkForWinner(competition, snapshot))
                  .catch(err => console.log(err))

                : console.log('dinner uploaded');
              });

          }

          if (!player.val().activeMeal) {
            player.ref.update({
              activeMeal: currentHour < 10
                          ? 'breakfast'
                          : currentHour >= 10 && currentHour < 15
                          ? 'lunch'
                          : currentHour >= 15 && currentHour < 20
                          ? 'dinner'
                          : 'breakfast'
            });
          }
        });
      }
    });
};

// Transform admin object to array
const snapshotToArray = (snap) => {
  const arr = [];
  snap.forEach(res => {
     arr.push(res.val()); // eslint-disable-line
  });
  return arr;
};


const isBreakfastUploaded = (competition, img, player) => {
  const currentDate = moment().tz(competition.timezone).format('ll');
  return (
    img.date === currentDate && img.type === 'breakfast' && img.userId === player.uid
  );
};


const isLunchUploaded = (competition, img, player) => {
  const currentDate = moment().tz(competition.timezone).format('ll');
  return (
    img.date === currentDate && img.type === 'lunch' && img.userId === player.uid
  );
};


const isDinnerUploaded = (competition, img, player) => {
  const currentHour = moment().tz(competition.timezone).hours();
  const currentDate = moment().tz(competition.timezone).format('ll');
  const yesterdayDate = moment().subtract(1, 'days').tz(competition.timezone).format('ll');

  if (currentHour >= 20) {
    return (
      img.date === currentDate && img.type === 'dinner' && img.userId === player.uid
    );
  } else if (currentHour < 6) {
    return (
      img.date === yesterdayDate && img.type === 'dinner' && img.userId === player.uid
    );
  }
};


const checkForWinners = (competition, snapshot) => {
  snapshot.val()
    .filter(player => player.lives > -1)
    .map(player => {
      // player.uid === currentUser.uid && alert(`Congratulations ${player.name}, you are the WINNER!`);
      sendSystemMessage(competition, `${player.name} won the competition!`);
    });

    const competitionRef = admin.database().ref(`competitions/${competition.uid}`);

    competitionRef.update({
      ended: true
    })
    // .then(() => endCompetitionAction())
    .catch(err => console.log(err));
};


const checkForWinner = (competition, snapshot) => {
  const activePlayers = snapshot.val().filter(player => player.lives > -1);
  if (activePlayers.length === 1) {
    // alert(`Congratulations! ${activePlayers[0].name} won the competition.`);
    sendSystemMessage(competition, `${activePlayers[0].name} won the competition!`);

    const competitionRef = admin.database().ref(`competitions/${competition.uid}`);

    competitionRef.update({
      ended: true
    })
    // .then(() => endCompetitionAction())
    .catch(err => console.log(err));
  }
};


// Send system message
// Store it to admin
const sendSystemMessage = (competition, message) => {
  const messageId = moment().tz(competition.timezone).format('MM/DD/YYYY h:mm:ss.SSS');
  const timeNow = moment().tz(competition.timezone).format();

  const systemMessage = {
    _id: messageId,
    text: message,
    dateCreated: timeNow,
    // createdAt: timeNow,
    system: true,
    // Any additional custom parameters are passed through
  };
  const messagesRef = admin.database().ref('messages/' + competition.uid); // eslint-disable-line
  messagesRef.push(systemMessage) // eslint-disable-line
    .catch(err => console.log(err));
};


// Get push token and send notification
const sendPushNotification = (competition, type, userId) => {
  const competitionRef = admin.database().ref(`competitions/${competition.uid}`);

  competitionRef.child('players')
    .once('value')
    .then(snapshot => {
      snapshot.forEach(player => {
        if (player.val().uid === userId) {
          const pushToken = player.val().pushToken;
          sendPush([pushToken], type);
        }
      });
    })
    .catch(err => console.log(err));
};
