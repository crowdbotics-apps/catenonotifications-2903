var admin = require("firebase-admin");

var serviceAccount = require("./catenoapp-firebase-adminsdk-dafky-23a2b8ebae.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://catenoapp.firebaseio.com"
});

module.exports.admin = admin
