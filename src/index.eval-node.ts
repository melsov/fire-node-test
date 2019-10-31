// Node definitions
/*
global.XMLHttpRequest = require('xhr2').XMLHttpRequest; // xhr2.XMLHttpRequest;

const RTCPeerConnection = require('wrtc').RTCPeerConnection;

// get a DOM
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const fs = require('fs');
const idxhtml = fs.readFileSync("./index.html", "utf8");
const DOM = new JSDOM(idxhtml, {
  url: "http://localhost:8000",
  contentType: "text/html",
  runScripts: "outside-only"
});


// COULD TRY:
// packing for web. but use NullEngine
// run the packed script with window.eval('app.bundle-null.js'); which 'outside-only' enables

window = DOM.window;
document = DOM.window.document;
location = window.location;


const booferIndex = require('./boofer-files/index');
*/