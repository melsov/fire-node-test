import  { Engine,  Scene, Vector3, FreeCamera, HemisphericLight, Mesh } from 'babylonjs';
import { GridMaterial } from 'babylonjs-materials';
import * as Gui from 'babylonjs-gui';

//import * as wrtc from './WebRTCConnection';
//import {RoomAgent} from './RoomAgent';

import * as firebase from 'firebase/app';
import 'firebase/auth';
import { Checkbox } from 'babylonjs-gui';
import * as tfirebase from "../shared/tfirebase"; // { tfirebase } from './MPlayer';
import { MLocalPeer } from './MPeer';
import { MDetectNode } from '../MDetectRunningInNode';
import { Newcomer, RoomAssignment } from '../shared/Newcomer';

let localPeer : MLocalPeer;
let localClientPeerListenServer : MLocalPeer;

var fbaseUser : tfirebase.FBUser;

var _wantListenServer : boolean = false;

const killGameButton = <HTMLButtonElement> document.getElementById("kill-game");

export function init()
{
    SetupClient();
}

function SetupClient()
{
    firebase.auth().signInAnonymously().catch(err  => {
        console.warn("Sign in err: " +  err.code + " :  " + err.message);
    });

    firebase.auth().onAuthStateChanged(usr => {
        if(usr){
            
            // TEST SEND AUTHORIZED HTTPS REQ
            const startFunctionsRequest = () => {
                let helloUserUrl = 'https://us-central1-webrtcrelay2.cloudfunctions.net/app';
                helloUserUrl += '/hello';
                usr.getIdToken().then((token) => {
                  console.log('Sending request to', helloUserUrl, 'with ID token in Authorization header.');
                  var req = new XMLHttpRequest();
                  req.onload = () => {
                      console.log(`got a response: ${req.responseText}`);
                    //this.responseContainer.innerText = req.responseText;
                  }//.bind(this);
                  req.onerror = () => {
                      console.log(`got an err from hello app`);
                      // this.responseContainer.innerText = 'There was an error';
                  }//.bind(this);
                  req.open('GET', helloUserUrl, true);
                  req.setRequestHeader('Authorization', 'Bearer ' + token);
                  req.send();
                }); //.bind(this));
            };
            // startFunctionsRequest();
            // END TEST SAHR

            usr.getIdToken().then((token) => 
            {
                
                console.log(`fb auth user: chars: ${usr.uid.length} . ${usr.uid} `);
                // for testing, use a fake UID (firebase.Auth gives same UID per browser)
                fbaseUser = fakeUserConfig(usr.uid);  // usr;
                
                // TODO: allow clients to opt in to hosting
                // TODO: maintain a list of available rooms
                // need a mechanism for detecting server health
                // a ping every 5 seconds or something?
                
                // clients can just hit a big 'play' button (room chosen for them)
                // or choose a 'host/server'
                
                // add an entry to 'newcomers' 
                // await a 'response' from server: an entry in 'assignment/{our(fake)uid}'
                // the response will contain our room and whether we're the server.
                let raPath = `${RoomAssignment.dbRoot}/${fbaseUser.UID}`;
                firebase.database().ref(raPath).on('value', (snap) => 
                {
                    let roomAssignment = <RoomAssignment> snap.val();
                    if(roomAssignment) {
                        console.log(`got r assignment: ${Object.keys(roomAssignment)}`);

                        firebase.database().ref(raPath).off();
                        EnterLobby(roomAssignment, token); 
                    } 
                    else { console.log(`null room assigment. i'll keep waiting`); }
                });
                
                let newcomer = new Newcomer(fbaseUser.UID, "s'blood");
                // firebase.database().ref(`${Newcomer.dbRoot}`).push(newcomer)
                const newcomerPath =`${Newcomer.dbRoot}/${fbaseUser.UID}`;
                firebase.database().ref(newcomerPath).set(newcomer) // push(newcomer)
                .then(() => {
                    // immediately remove
                    firebase.database().ref(newcomerPath).remove().catch(err => { console.log(`err removing new comer ref`); })
                }).catch(err => {
                    console.log(`err adding newcomer ${err}`);
                });
            }); // end getIdToken
                
        } else { 
            console.log("user signed out"); 
        }
    });
}

function EnterLobby(roomAssignment : RoomAssignment, token : string)
{
    fbaseUser.isServer = roomAssignment.shouldBeLS;
    localPeer = new MLocalPeer(roomAssignment.roomName, fbaseUser, token, (isServer : boolean) => {

        // add a client for listen server
        if(fbaseUser.isServer /*&& _wantListenServer */ && !MDetectNode.IsRunningInNode()) {
            let userClone = fbaseUser.clone();
            userClone.isServer = false;
            userClone.UID = `${userClone.UID}-LS`;
            console.log(`***^^^creating listen server client`);

            localClientPeerListenServer = new MLocalPeer(roomAssignment.roomName, userClone, token, (isServer : boolean) => {});
        } 
        else {
            console.log(`***WONT create a listen server. isServer? ${fbaseUser.isServer} isNode? ${MDetectNode.IsRunningInNode()}`);
        }
    });


    const closeDown = () => {

        // only call onClose for local peer (don't bother with calling on localClientPeerLS)
        // because: if local peer is the server, the whole room will be wiped
        // if not, localClientPeerLS is null
        localPeer.onClose();
        
    }

    const testNavBeacon = () => {
        
    };

    if(!MDetectNode.IsRunningInNode())
    {
        window.onbeforeunload = () => {
            testNavBeacon();
            closeDown();
        };

        killGameButton.onclick = () => {
            console.log(`kill game clicked`);
            closeDown();
        }
    } 
    else // is running node 
    {   
        // intercept CTRL+C
        process.on('SIGINT', () => {
            console.log(`interrupt signal`);
            try {
                closeDown(); // uh oh. this is probably broken (doubt Navigator.sendBeacon is defined in node's runtime env)
                // luckily, the routine for close down is simple for node since we know we're the server...
                // or we could trigger the cloud function by other means ( i.e. some normal way, not with sendBeacon)
            } 
            catch(err) {
                console.log(`close down err: ${err}`);
            }
            finally {
                process.exit();
            }
        });
    }
    
}

var readyCount = 0;
var isSendReady = false;
const readyCallback = function(readyState : RTCDataChannelState) {
    console.log("got ready " + (readyCount++));
    if(readyState === 'open') {
        isSendReady = true;
    } else {
        isSendReady = false;
    }
}

// TODO: plan. how many PI wedges do we need for rotations
// lower wedge resolution leads to greater compression

const fakeNames : Array<string> = ['jill', 'bill', 'greg', 'mofo'];
function fakeUID() : string {
    return `${fakeNames[Math.floor(Math.random()*fakeNames.length)]}-${Math.ceil(Math.random()*10000)}`;
}

function fakeUserConfig(baseName : string, omitSuffix ? : boolean) : tfirebase.FBUser 
{
    let c = new tfirebase.FBUser("", "", 0);

    let name = baseName; // fakeNames[Math.floor(Math.random()*fakeNames.length)];
    c.UID = `${name}${omitSuffix ? '' : '-' + Math.ceil(Math.random()*10000)}`;
    c.color = Math.floor(Math.random()*5);
    c.displayName = name;
    return c;
}




// function SetupClientFake()
// {
//     fbaseUser = fakeUserConfig(); //  new tfirebase.User(fakeUID());
//     EnterLobby();
// }