import Expo from 'expo-server-sdk';

// Create a new Expo SDK client
let expo = new Expo();

export const sendPush = (pushTokens, type, text) => {
  // Create the messages that you want to send to clents
  let messages = [];
  for (let pushToken of pushTokens) {
    // Each push token looks like ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]

    // Check that all your push tokens appear to be valid Expo push tokens
    if (!Expo.isExpoPushToken(pushToken)) {
      console.error(`Push token ${pushToken} is not a valid Expo push token`);
      continue;
    }

    // Construct a message (see https://docs.expo.io/versions/latest/guides/push-notifications.html)
    messages.push({
      to: pushToken,
      sound: 'default',
      body: notificationBody(type, text),
      data: { withSome: 'data' },
    });
  }

  // The Expo push notification service accepts batches of notifications so
  // that you don't need to send 1000 requests to send 1000 notifications. We
  // recommend you batch your notifications to reduce the number of requests
  // and to compress them (notifications with similar content will get
  // compressed).
  let chunks = expo.chunkPushNotifications(messages);
  let tickets = [];
  (async () => {
    // Send the chunks to the Expo push notification service. There are
    // different strategies you could use. A simple one is to send one chunk at a
    // time, which nicely spreads the load out over time:
    for (let chunk of chunks) {
      try {
        let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        console.log(ticketChunk);
        tickets.push(...ticketChunk);
        // NOTE: If a ticket contains an error code in ticket.details.error, you
        // must handle it appropriately. The error codes are listed in the Expo
        // documentation:
        // https://docs.expo.io/versions/latest/guides/push-notifications#response-format
      } catch (error) {
        console.error(error);
      }
    }
  })();
};


const notificationBody = (type, text) => {
  console.log(text);
  if (type === 'breakfastStart') {
    return 'Upload your breakfast';
  } else if (type === 'lunchStart') {
    return 'Upload your lunch';
  } else if (type === 'dinnerStart'){
    return 'Upload your dinner';
  } else if (type === 'breakfastEnd') {
    return 'You have one hour left to upload your breakfast';
  } else if (type === 'lunchEnd') {
    return 'You have one hour left to upload your lunch';
  } else if (type === 'dinnerEnd') {
    return 'You have one hour left to upload your dinner';
  } else if (type === 'ratingComplete') {
    return 'Your meal has been rated';
  } else if (type === 'lifeLost') {
    return text;
  }
};
