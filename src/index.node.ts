// require firebase here?
// import * as firebase from 'firebase/app';
// import 'firebase/auth';
// let nothing = firebase.firestore;
// console.log(`${nothing}`);

// Node definitions
global.XMLHttpRequest = require('xhr2').XMLHttpRequest; 
 
RTCPeerConnection = require('wrtc').RTCPeerConnection;
RTCSessionDescription = require('wrtc').RTCSessionDescription;

// get a DOM
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const fs = require('fs');
const idxhtml = fs.readFileSync("./index.html", "utf8");
const DOM = new JSDOM(idxhtml, {
  url: "http://localhost:8000",
  contentType: "text/html",
  runScripts: "outside-only" // don't think we need these options actually
});

// cheese: define win, doc, loc, HTMLElement
// WANT
window = DOM.window;
document = DOM.window.document;
location = window.location;
HTMLElement = window.HTMLElement;

// Start an express server
// so that (for example) AssetManager requests work
function FindAPortForGETServer() {
  return 8000;
}
const express = require('express');
const app = express();
const PORT_EXPRESS = FindAPortForGETServer();
app.get('/', (req, res) => { res.send('hi world'); });
app.use(express.static('./'));

app.listen(PORT_EXPRESS, () => {
  console.log(`listening on ${PORT_EXPRESS}`);
})

// game start
const booferIndex = require('./boofer-files/index');

//
// OLD TEST CODE

/*
// firebase (non-admin) imports
// Firebase App (the core Firebase SDK) is always required and
// must be listed before other Firebase SDKs
import * as firebase from "firebase/app";

// Add the Firebase services that you want to use
import "firebase/auth";
import "firebase/firestore";
import { NullEngineGameMain } from "./common/GameMain";

var firebaseConfig = {
    apiKey: "AIzaSyAX4D923B9MCTxdjwaqk0zs94l5kNNKAcw",
    authDomain: "fire-node-test.firebaseapp.com",
    databaseURL: "https://fire-node-test.firebaseio.com",
    projectId: "fire-node-test",
    storageBucket: "fire-node-test.appspot.com",
    messagingSenderId: "501848287070",
    appId: "1:501848287070:web:84bebb3e8337a2eb4cd1cf",
    measurementId: "G-Y7DQ4HVSXV"
  };
  // Initialize Firebase
firebase.initializeApp(firebaseConfig);

// auth
firebase.auth().signInAnonymously().catch(function(error) {
    // Handle Errors here.
    var errorCode = error.code;
    var errorMessage = error.message;
    console.log(`twas an error ${errorCode} : ${errorMessage}`);
    // ...
  });

  firebase.auth().onAuthStateChanged(function(user) {
      console.log("on auth state changed");
    if (user) {
      // User is signed in.
      var isAnonymous = user.isAnonymous;
      var uid = user.uid;
      console.log(`got a user ${isAnonymous ? 'anon' : 'not anon'} ${uid}`);
      writeToDB();
      // ...
    } else {
      // User is signed out.
      // ...
      console.log("user is undefined");
      //writeToDB();
    }
    // ...
  });  

function doBabThings()
{
  let game = new NullEngineGameMain();
  game.init();
}


const servers = {'iceServers': [
  {'urls': 'stun:stun.services.mozilla.com'}, 
  {'urls': 'stun:stun.l.google.com:19302'}, 
  {'urls': 'turn:numb.viagenie.ca','credential': 'thisisagoldennugget','username': 'mattpoindexter@gmail.com'}
  ]};

function TestWebRTCExists()
{
    let pconn = new RTCPeerConnection(servers);
    pconn.onicecandidate = (event) => {
        console.log("this won't get called");
    };

    console.log("end of TestWebRTCExists");
}

TestWebRTCExists();


function writeToDB() 
{
    let fire = firebase;

    var db = fire.firestore(); // firebase.database();
    // TODO: work out some actually safe db access rules
    // e.g. a scheme where users can write to fields only 
    // with paths containing their uid
    var ref = db.collection("restricted");

    var usersRef = ref.doc("users");

    console.log('will set some things??');
    usersRef.set({
        alanisawesome:{
            date_of_birth: "June 23, 1912",
            full_name: "Alan Turing"
        },
        gracehop: {
            date_of_birth: "December 9, 1906",
            full_name: "Grace Hopper" + (Math.floor(Math.random() * 1000))
        }
    }).then(() => {
        console.log("guess that went well. bye");
        doBabThings();
        //process.exit();
    }).catch((reason) => {
        console.log(`something didn't go well ${reason}`);
        process.exit();
    })
}

// ADMIN WAY
// import * as FireAdmin from "firebase-admin";
// var fire = firebase; // FireAdmin; // require("firebase-admin");

// var serviceAccount = require("E:/dev/ssh/fire-node-test-firebase-adminsdk-1tmfu-511abea3be.json");

// fire.initializeApp({
//     credential: fire.credential.cert(serviceAccount),
//     databaseURL: "https://fire-node-test.firebaseio.com"
// });

// console.log('hi');
// var db = fire.firestore(); // firebase.database();
// var ref = db.collection("restricted");

// var usersRef = ref.doc("users");

// console.log('will set some things??');
// usersRef.set({
//     alanisawesome:{
//         date_of_birth: "June 23, 1912",
//         full_name: "Alan Turing"
//     },
//     gracehop: {
//         date_of_birth: "December 9, 1906",
//         full_name: "Grace Hopper"
//     }
// });
*/