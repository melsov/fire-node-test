// invoke game start
// TODO: games cant seem to start anymore
// running with node server or otherwise...?
// diagnose what is happening

const booferIndexB = require('./boofer-files/index');


//  OLD TEST
// // firebase (non-admin) imports

// // Firebase App (the core Firebase SDK) is always required and
// // must be listed before other Firebase SDKs
// import * as firebase from "firebase/app";

// // Add the Firebase services that you want to use
// import "firebase/auth";
// import "firebase/firestore";

// function getSayHiDiv() : HTMLDivElement { return <HTMLDivElement> document.getElementById("sayHi"); }

// function writeToSayHiDiv(str : string) {
//   let sd = getSayHiDiv();
//   sd.innerText = str;
// }

// // Test webrtc exists
// const servers = {'iceServers': [
//   {'urls': 'stun:stun.services.mozilla.com'}, 
//   {'urls': 'stun:stun.l.google.com:19302'}, 
//   {'urls': 'turn:numb.viagenie.ca','credential': 'thisisagoldennugget','username': 'mattpoindexter@gmail.com'}
//   ]};

// function TestWebRTCExists()
// {
//     let pconn = new RTCPeerConnection(servers);
//     pconn.onicecandidate = (event) => {
//         console.log("this won't get called");
//     };

//     console.log("end of TestWebRTCExists");
// }

// TestWebRTCExists();

// var firebaseConfig = {
//     apiKey: "AIzaSyAX4D923B9MCTxdjwaqk0zs94l5kNNKAcw",
//     authDomain: "fire-node-test.firebaseapp.com",
//     databaseURL: "https://fire-node-test.firebaseio.com",
//     projectId: "fire-node-test",
//     storageBucket: "fire-node-test.appspot.com",
//     messagingSenderId: "501848287070",
//     appId: "1:501848287070:web:84bebb3e8337a2eb4cd1cf",
//     measurementId: "G-Y7DQ4HVSXV"
//   };
//   // Initialize Firebase
// firebase.initializeApp(firebaseConfig);

// // auth
// firebase.auth().signInAnonymously().catch(function(error) {
//     // Handle Errors here.
//     var errorCode = error.code;
//     var errorMessage = error.message;
//     console.log(`twas an error ${errorCode} : ${errorMessage}`);
//     // ...
//   });

//   firebase.auth().onAuthStateChanged(function(user) {
//       console.log("on auth state changed");
//     if (user) {
//       // User is signed in.
//       var isAnonymous = user.isAnonymous;
//       var uid = user.uid;
//       console.log(`got a user ${isAnonymous ? 'anon' : 'not anon'} ${uid}`);

//       writeToSayHiDiv(`here's their uid: ${uid}`);
//       writeToDB();
//       // ...
//     } else {
//       // User is signed out.
//       // ...
//       console.log("user is undefined");
//       writeToSayHiDiv(`user undefined`);
//       //writeToDB();
//     }
//     // ...
//   });  


// function writeToDB() 
// {
//     let fire = firebase;

//     var db = fire.firestore(); // firebase.database();
//     // TODO: work out some actually safe db access rules
//     // e.g. a scheme where users can write to fields only 
//     // with paths containing their uid
//     var ref = db.collection("restricted");

//     var usersRef = ref.doc("users");

//     console.log('will set some things??');
//     usersRef.set({
//         alanisawesome:{
//             date_of_birth: "June 23, 1912",
//             full_name: "Alan Turing"
//         },
//         gracehop: {
//             date_of_birth: "December 9, 1906",
//             full_name: "Grace Hopper" + (Math.floor(Math.random() * 1000))
//         }
//     }).then(() => {
//         console.log("guess that went well. bye");
//         //process.exit();
//     }).catch((reason) => {
//         console.log(`something didn't go well ${reason}`);
//         //process.exit();
//     })
// }

// // ADMIN WAY
// // import * as FireAdmin from "firebase-admin";
// // var fire = firebase; // FireAdmin; // require("firebase-admin");

// // var serviceAccount = require("E:/dev/ssh/fire-node-test-firebase-adminsdk-1tmfu-511abea3be.json");

// // fire.initializeApp({
// //     credential: fire.credential.cert(serviceAccount),
// //     databaseURL: "https://fire-node-test.firebaseio.com"
// // });

// // console.log('hi');
// // var db = fire.firestore(); // firebase.database();
// // var ref = db.collection("restricted");

// // var usersRef = ref.doc("users");

// // console.log('will set some things??');
// // usersRef.set({
// //     alanisawesome:{
// //         date_of_birth: "June 23, 1912",
// //         full_name: "Alan Turing"
// //     },
// //     gracehop: {
// //         date_of_birth: "December 9, 1906",
// //         full_name: "Grace Hopper"
// //     }
// // });