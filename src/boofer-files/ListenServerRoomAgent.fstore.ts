import * as firebase from 'firebase/app';
import 'firebase/database';
import 'firebase/firestore';
import 'firebase/auth';

import { MSPeerConnection } from './MSPeerConnection';
import { RemotePlayer }  from './MPlayer';
import * as tfirebase from './tfirebase';
import { UILabel } from './toy/html-gui/UILabel';
import { NodeFriendlyDivElement } from './toy/html-gui/NodeFriendlyElement';
import { MDetectNode } from '../MDetectRunningInNode';

const RABaseRoomKey : string = "rooms";
const RAMaxPlayersPerRoom : Number = 8;

// TODO: use cloud firestore instead of the legacy database

export class ListenServerRoomAgent 
{
    
    get roomRef() : string {
        return `${RABaseRoomKey}/${this.room}`;
    }

    get roomCountRef() : string { return `${this.roomRef}/player-count`; }

    get playersRef() : string {
        return `${this.roomRef}/players`;
    }
    
    get messageBoothRef() : string {
        return `${this.roomRef}/booth`;
    }
    
    private inboxRefFor(_userid : string) : string {
        return `${this.roomRef}/inbox/${_userid}`;
    }

    private debugLabelSrv = new UILabel("room-agent-srv-debug", "#33FFFF", undefined, "RmAgS:");
    private debugLabelCli = new UILabel("room-agent-cli-debug", "#AAFFDD", undefined, "RmAgC:");

    private set dLabel(t : string) {
        if(MDetectNode.IsRunningInNode()) {
            console.log(t);
        }
        else if (this.user.isServer) {
            this.debugLabelSrv.text = t;
            console.log(t);
        } else {
            this.debugLabelCli.text = t;
            console.log(t);
        }
    }

    private debugPlayerListDiv : NodeFriendlyDivElement; // HTMLDivElement;
    private debugPlayerCount : NodeFriendlyDivElement; // HTMLDivElement;
    private debugIsServer : NodeFriendlyDivElement;

    private db : firebase.firestore.Firestore;
    // userDBRef : firebase.database.ThenableReference;
    userDBRef : firebase.firestore.DocumentReference;

    
    others : Array<RemotePlayer> = new Array<RemotePlayer>();
    readyOthers : Array<RemotePlayer> = new Array<RemotePlayer>(); // awkward // TODO: make both of these maps <uid, RemotePlayer> https://howtodoinjava.com/typescript/maps/

    // server / cli callbacks
    onChannelOpened : (remote : RemotePlayer) => void = (remote : RemotePlayer) : void => { throw (`**please no. EMPTY onChan opened...`); };
    onChannelClosed : (remote : RemotePlayer) => void = (remote : RemotePlayer) : void => { throw (`**kya what? ##EMPTY onChan closed`); };

    debugPlayerArrivalNumber : number = -1;

    private findReadyIndex(uid : string) : number
    {
        let ii = -1;
        this.readyOthers.forEach((o, i) => {
            console.log("found: " + o.user.UID + " other is: " + uid);
            if(o.user.UID == uid) 
            {
                ii = i; 
            }
        });
        return ii;
    }

    private debugUpdateReadyOthersDisplay() {
        let names = Array<string>();
        names.push(` me: ${this.user.UID} <br />`);
        for(let i=0; i < this.readyOthers.length; ++i){
            let other = this.readyOthers[i].user.UID;
            names.push(` ${other} <br />`);
        }

        this.debugPlayerListDiv.innerHTML = names.toString();
    }


    constructor(
        public readonly room : string, 
        public readonly user : tfirebase.User, 
        public  onGotPlayerCount : (isServer : boolean) => void
    ) 
    {
        if(this.user == undefined) { console.warn("THIS user (passed to RoomAgent constructor) is undefined"); throw new Error("user undefined"); }
    
        this.debugPlayerListDiv = new NodeFriendlyDivElement(document.getElementById('debugPlayerList'));
        this.debugPlayerCount = new NodeFriendlyDivElement(document.getElementById('debugPlayerCount'));
        this.debugIsServer = new NodeFriendlyDivElement( document.getElementById('debugIsServer'));

        this.db = firebase.firestore();
        // push our user to players
        let playersDoc = this.playersCollection().doc(this.user.UID); //.set(this.user);
        playersDoc.set(Object.assign({}, this.user)).then(() => { console.log(`wrote our user to players hopefully ?`)});
        this.userDBRef = playersDoc;
        // this.userDBRef = this.db.collection(this.playersRef).add(this.user);
        // this.userDBRef = firebase.database().ref(this.playersRef).push(this.user); 
        
        // this.userDBRef.then((doc) => { console.log("here's the doc.id: " + doc.id); });
        // this.userDBRef.then(() => { console.log("here's the key: " + this.userDBRef.key); });
    }

    private updateUIWithCount(count : number) : void 
    {
        this.debugIsServer.innerText = (count === null || count === 0) ? `Server` : `Client ${count}`;
        this.user.isServer = !count || count === 0;
        this.debugPlayerArrivalNumber = count ? count : 0;
        this.dLabel = `transaction: count: ${count}. ${this.user.isServer?'SRV' : 'CLI'}`;
    }

    private roomDoc() { return this.db.collection(RABaseRoomKey).doc(this.room); }
    private playersCollection() { return this.roomDoc().collection("players"); }
    private countDoc() { return this.roomDoc().collection("player-count").doc("the-count"); }
    private inboxesCollection() { return this.roomDoc().collection("inbox"); }
    private inboxesDocFor(_uid : string) {
        return this.inboxesCollection().doc(_uid);
    }
    private inboxCollectionFor(_uid : string) {
        return this.inboxesDocFor(_uid).collection("messages"); // this.inboxRefFor(doc.data().UID))
    }
    
    public init()
    {
        // use a transaction to limit num players per room
        // Atomically update room count
        // this.db.collection(RABaseRoomKey).doc(this.room).collection("player-count").doc("the-count")
        // if we're first to the room,
        // we are the server.
        // NOTE: running this in two chrome tabs leads to odd behavior; (running in two chrome windows seems ok)
        // OBSERVATION: this seems to get called twice sometimes (with different values for count).
        // (Indeed, transaction are supposed to re-run if they fail, if data was changed externally during execution)
        // so don't init anything based on the value of count here. (e.g. don't call 'onGotPlayerCount')

        console.log(`welcome to LSRA init`);
        let pCountDocRef = this.countDoc();
        this.db.runTransaction((transaction) => {

            return transaction.get(pCountDocRef).then((pCountDoc) => {
                
                if(pCountDoc.exists) {
                    let data = pCountDoc.data();
                    if(data) {
                        let _count = data.count + 1;
                        transaction.update(pCountDocRef, { count : _count});
                        return Promise.resolve(_count);
                    }
                    return Promise.reject("odd. pCoundDoc.data() doesn't exist");
                }

                transaction.set(pCountDocRef, { count : 1 });
                return Promise.resolve(1);
            })
        })
        // firebase.database().ref(this.roomCountRef).transaction((count) => {
        //     this.updateUIWithCount(count);
        //     return count + 1;
        // })
        // .then(() => {
        .then((newPCount) => {
            console.log(`got new p count ${newPCount}`);
            this.updateUIWithCount((<number>(<unknown>newPCount)) - 1);
            
            // set user again (now with isServer)
            this.userDBRef.set(Object.assign({}, this.user))
            // this.userDBRef.set(this.user, (err : Error | null) => { 
            //     if(err) console.log(`${err}`); 
            //     this.dLabel = `userDBRef set err: ${err? err : 'null err object'}`;
            //     return null; 
            // })
            .then(() => {
                
                this.onGotPlayerCount(this.user.isServer);
                this.dLabel = `after set user again`;

                // DEBUG
                this.countDoc().onSnapshot((snap) => {
                    this.debugPlayerCount.innerText = `${snap.data()}`;
                    this.dLabel = (`on roomCount: ${snap.data()}`)
                })
                // firebase.database().ref(this.roomCountRef).on('value', (snap) => {
                //     this.debugPlayerCount.innerText = `${snap.val()}`;
                //     this.dLabel = (`on roomCount: ${snap.val()}`)
                // });
                // END DEBUG

                // this.handshake();

            }); // end of set isServer
        }); // end of count transaction .then()

    }

    public handshake() : void
    {
        console.log(`welcome to lsroomAgent handshake()`);
        const addPeer = (rUserConfig : tfirebase.User) => { 
            console.log(`^^WELCOME TO addPeer! ${this.user.isServer ? "IM THE SERVER" : "IM A CLI"} ^^`);
            console.log(`remote user config: ${rUserConfig.displayName} color: ${rUserConfig.color}`);

            // init an MSPeerConnection between us and them
            const peer = new MSPeerConnection(this.user, rUserConfig.UID, this.messageBoothRef);

            const other = new RemotePlayer(peer, rUserConfig);
            const len : number = this.others.push(other); 

            this.others[len - 1].peer.SendChanStateChangedCallback = (rs : RTCDataChannelState, _peer : MSPeerConnection) => {
                console.log("RoomAgent: Send state is now: " + rs.toString());
                if(rs == "open") {
                    //this.others[len - 1].peer.send("hi hi " + len);
                    this.readyOthers.push(this.others[len - 1]);

                    console.log(`***** ${this.user.isServer ? "SRV" : "CLI"} about to send on chann open`);
                    this.onChannelOpened(this.others[len - 1]);
                }
                else if(rs == "closing" || rs == "closed") 
                {
                    //remove from readyOthers 
                    let i = this.findReadyIndex(other.user.UID);
                    if(i >= 0){
                        // this.readyOthers[i].cleanup();
                        this.onChannelClosed(this.readyOthers[i]);
                        this.readyOthers.splice(i,1);
                    }
                    console.log("found disconnector (Send chnnl) at: "+i+". rOthers len now: " + this.readyOthers.length);
                    this.readyOthers.forEach((other) => {
                        console.log(other.user.UID);
                    });
                }
                this.debugUpdateReadyOthersDisplay();
            };

            this.others[len - 1].peer.ReceiveChanStateChangedCallback = (rs : RTCDataChannelState, _peer : MSPeerConnection) => {
                console.log("Receive state is now: " + rs.toString());
                if(_peer)
                {
                    if(rs == "closed" || rs == "closing")
                    {
                        let i = this.findReadyIndex(_peer.user.UID);
                        if(i >= 0) {
                            // this.readyOthers[i].cleanup();
                            this.onChannelClosed(this.readyOthers[i]);
                            this.readyOthers.splice(i, 1);
                        }
                        console.log("found disconnector (Rece chnnl) at: "+i+". rOthers len now: " + this.readyOthers.length);
                    }
                }
                this.debugUpdateReadyOthersDisplay();
            };

            return len - 1;
        }; // END ADD_PEER

        // say 'hi' to the server, if we're not the server: 
        this.playersCollection().where("isServer", "==", true).get()
        .then((querySnapshot) => {
            querySnapshot.forEach((doc) => {
                if(doc.data().UID !== this.user.UID) // not us
                {
                    this.dLabel = `will add peer`;
                    console.log(`cli found server ${JSON.stringify(doc.data())}`);
                    addPeer(<tfirebase.User> doc.data());
                    this.inboxCollectionFor(doc.data().UID).doc(this.user.UID).set(Object.assign({}, this.user));
                }
            })
        }).catch((err) => { 
            console.log(`err getting server to say 'hi' ${err}`);
        });
        /* // OLD say 'hi'
        // say 'hi' to the server, if we're not the server: 
        firebase.database().ref(this.playersRef).once('value')
        .then(snap => {
            
            let debugFoundServer = 0;
            // foreach player listed under players
            snap.forEach((child) => {
                let rUserConfig = <tfirebase.User>(<unknown> child.val());

                if(rUserConfig.UID == undefined) console.warn("got an undefined user");

                if(rUserConfig.isServer) // only notify the server
                {
                    if(rUserConfig.UID !== undefined && rUserConfig.UID !== this.user.UID)
                    {
                        this.dLabel = `will add peer`

                        addPeer(rUserConfig); 
                        firebase.database().ref(this.inboxRefFor(rUserConfig.UID)).push(this.user); 
                    }
                }
            });
        });
        */

        // NOTE: should we be calling this inside of a then?
        // if we're the server...now that we're in the game / room
        // listen for messages from new players ('child-added') in our 'in-box'
        this.inboxCollectionFor(this.user.UID).onSnapshot((snapshot) => {
            if(this.user.isServer) 
            {
                snapshot.docChanges().forEach((change) => {
                    if(change.type === "added") 
                    {
                        let rUserConfig = <tfirebase.User>(<unknown> change.doc.data()); // data.val());
                        console.log("from my inbox: " + change.doc.data()+ " user: " + rUserConfig.UID);
                        var index : number = addPeer(rUserConfig);
                        this.others[index].peer.createConnection();
                    } 
                    else if(change.type === 'modified') {
                    } 
                    else if(change.type === 'removed') {
                    }              
                })
            }
        });
        // OLD VERSION if we're the server...now that we're in the game / room
        // listen for messages from new players ('child-added') in our 'in-box'
        // firebase.database().ref(this.inboxRefFor(this.user.UID)).on('child_added', (data) => {
        //     if(this.user.isServer)
        //     {
        //         let rUserConfig = <tfirebase.User>(<unknown> data.val());
        //         console.log("from my inbox: " + data.val()+ " user: " + rUserConfig.UID);

        //         var index : number = addPeer(rUserConfig);
        //         this.others[index].peer.createConnection();
        //     }
        // });

        // DEEP THOUGHT: really need a ServerLSRA class and ClientLSRA class
        // their behavior is pretty different...
        this.playersCollection().onSnapshot((snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if(change.type === 'removed') {
                    let rUserConfig = change.doc.data(); // <tfirebase.User>(<unknown> change.doc.data());
            
                    // CONSIDER: We are finding unremoved players here exactly sometimes. 
                    // We probably want to learn which cases make this happen; 
                    // when do the channel state changed callbacks not catch this.
                    let i = this.findReadyIndex(rUserConfig.UID);
                    if(i >= 0){
                        // this.readyOthers[i].cleanup();
                        this.onChannelClosed(this.readyOthers[i]);
                        this.readyOthers.splice(i, 1);
                        this.debugUpdateReadyOthersDisplay();
                    }
                    
                    console.log(`on child_removed. removed player? ${i}. `);
                }
            })
        });
        // OLD VERSION
        // listen for players leaving
        // firebase.database().ref(this.playersRef).on('child_removed', (data) => {

        //     let rUserConfig = <tfirebase.User>(<unknown> data.val());
            
        //     // CONSIDER: We are finding unremoved players here exactly sometimes. 
        //     // We probably want to learn which cases make this happen; 
        //     // when do the channel state changed callbacks not catch this.
        //     let i = this.findReadyIndex(rUserConfig.UID);
        //     if(i >= 0){
        //         // this.readyOthers[i].cleanup();
        //         this.onChannelClosed(this.readyOthers[i]);
        //         this.readyOthers.splice(i, 1);
        //         this.debugUpdateReadyOthersDisplay();
        //     }
            
        //     console.log(`on child_removed. removed player? ${i}. `);
        // });

    }

    debugWipeEntireFirebaseDB(callback : () => void) 
    {
        // keep for now: MSPeerConnection still uses
        firebase.database().ref().remove()
        .then((snap) => {
        })
        .then(() => {
            this.roomDoc().delete();
        })
        .catch((err) => { 
            console.log(`an error deleting everyythinnng ${err}`); 
        })
        .finally(() => {
            callback();
        })
    }

    // clean up
    public onDisconnect(callback : () => void) 
    {
        this.others.forEach((other) => {
            other.peer.closeDataChannels();
        });

        this.removeFromFirebase(callback);
    }

    private removeFromFirebase(callback : () => void)
    {
        let pCountDocRef = this.countDoc();
        this.db.runTransaction((transaction) => {
            return transaction.get(pCountDocRef).then((pCountDoc) => {
                if(pCountDoc.exists) {
                    let data = pCountDoc.data();
                    if(data)
                    {
                        let newPCount = data.count - 1;
                        transaction.update(pCountDocRef, { count : newPCount });
                    }
                }
            }).then(() => {
                // remove my inbox
                let myInboxDocRef = this.inboxesDocFor(this.user.UID); 
                console.log(`will delete inbox at path ${myInboxDocRef.path}`);
                transaction.delete(myInboxDocRef);
                
            }).then(() => {
                let playerDocRef = this.playersCollection().doc(this.user.UID);
                transaction.delete(playerDocRef);
            });
        }).then(() => {
            console.log(`remove success`);
        }).catch((err) => {
            console.log(`remove from firebase err: ${err}`);
        }).finally(() => {
            callback();
        })
    }

    private batchRemoveFromFB() 
    {
        let batch = this.db.batch();

    }

    private removeFromFirebaseOldRTDatabaseWay(callback : () => void)
    {
        // // Looks like this doesn't entirely execute when
        // // the window closes (sometimes).
        // // Try batching???
        // // 
        // firebase.database().ref(this.roomCountRef).transaction((count) => { 
        //     if(!count || count === 0) { // hope not
        //         console.log(`count already null or zero? ${count}`);
        //         //throw `what the heck? we're still here but count was: ${count}`;
        //         return null;
        //     } 
        //     if(count === 1) 
        //         return null;
        //     return count - 1;
        // }).then((count ) => {
        //     console.log(`success decrementing count. count now: ${count ? count : "undef"}`);

        //     firebase.database().ref(this.inboxRefFor(this.user.UID)).remove()
        //     .then(() => {

        //         if(this.userDBRef.key)
        //             firebase.database().ref(this.playersRef + "/" + this.userDBRef.key).remove()
        //             .then(() => { 
                        
        //                 console.log("removed: " + this.userDBRef.key); 
        //                 callback();
        //             });
        //         else {
        //             console.warn("our room ref was undefined");
        //             callback();
        //         }
        //     });

        // }).catch((reason) => {
        //     console.log(`decrement room count failed: ${reason}`);
        //     callback();
        // });
    }
}