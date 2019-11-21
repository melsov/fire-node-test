import { ListenServerRoomAgent } from './ListenServerRoomAgent';
import { RemotePlayer } from './MPlayer';
import * as tfirebase from '../shared/tfirebase';
import { Nullable, Color3 } from 'babylonjs';
import  {MClient} from './toy/MClient';
import  {MServer} from './toy/MServer';
import * as MLoader from './toy/bab/MAssetBook';
import {GameMain, TypeOfGame} from './toy/GameMain'
import {WelcomePackage, UnpackCommString} from './toy/comm/CommTypes';
// import * as UILabel from './toy/html-gui/UILabel';
import { UILabel } from './toy/html-gui/UILabel';
import { MStopWatch } from './toy/Util/MStopWatch';
import { MUtils } from './toy/Util/MUtils';
import { MDetectNode } from '../MDetectRunningInNode';
import { callbackify } from 'util';
import { GoodbyeData } from '../shared/GoodbyeData';


//
// MLocalPeer glues together a ListenServerRoomAgent
// and an MClient or an MServer
// TODO: be both (i.e. a true listen server)
//
export class MLocalPeer
{

    public readonly lsRoomAgent : ListenServerRoomAgent;
    private client : Nullable<MClient> = null;
    private server : Nullable<MServer> = null;
    
    private debugLabel = new UILabel('cli-peer-debug', "#99AA44");

    private debugStopWatch = new MStopWatch("MPeer");

    private debugRandomId : string;

    // TODO / DESIGN NOTE: 
    // With match maker service, we will already know whether we're the server
    // at constructor invocation
    constructor(
        room : string,
        user : tfirebase.FBUser,
        private readonly idToken : string,
        //public mapPackage : Nullable<MLoader.MapPackage>,
        private statusCallback : (isServer : boolean) => void,
    )
    { 
        this.debugRandomId = "" + Math.floor(Math.random() * 1000);
        this.debugStopWatch.name += this.debugRandomId;
        // TODO: import a few things before connecting? well, we probably want to check their id in firebase? (or will want to in the future).
        // so the importing / connecting process might want to interwoven more granularly

        this.debugStopWatch.logLap(`constructor`);
        
        this.lsRoomAgent = new ListenServerRoomAgent(room, user, (isServer : boolean) => {
            this.handleOnGotPlayerCount(isServer);
        });

        // TESTING CONVENIENCE: preemptively wipe the ENTIRE DB! 
        // so that this peer can be the first to arrive and be the server like its supposed to be
        // DEEP THOUGHT: server creation and room creation should go hand-in-hand more...
        // so that we can't have a serverless room
        // server can't leave without destroying its room, etc.
        if(MDetectNode.IsRunningInNode())
        {
            this.lsRoomAgent.debugWipeEntireFirebaseDB(() => {
                this.lsRoomAgent.init(); // then init
            });
        } else {
            this.lsRoomAgent.init();
        }
        
    }
 
    private handleOnGotPlayerCount(isServer : boolean)
    {
        // TODO: load assets
        // if(this.mapPackage === null)
        // {
            this.debugStopWatch.name += isServer ? "SRV" : "CLI";
            this.debugRandomId += isServer ? "SRV" : "CLI";

            // TODO: if node, must be a server. must have own room
            // TODO: actually detect whether we're node or not node
            let isRunningInNode = MDetectNode.IsRunningInNode();
            console.log(`isRunningInNode: ${isRunningInNode}`);
            if(isRunningInNode && !isServer) {
                console.warn(`in node but not server. will **WIPE THE FIREBASE DB** and exit now`);
                this.lsRoomAgent.debugWipeEntireFirebaseDB(() => {
                    process.exit();
                })
                return;
            }
            let wantNullEngine = isServer && (isRunningInNode || MUtils.QueryStringContains("NullEngine"));
            console.log(`null engine ? ${wantNullEngine}`);
            let mapPackage = new MLoader.MapPackage(MLoader.MapID.TheOnlyMap, isServer ? TypeOfGame.Server : TypeOfGame.ClientA, wantNullEngine);
            mapPackage.LoadAll((mpackage : MLoader.MapPackage) => {
                
                this.debugStopWatch.logLap(`loader-callback`);

                if(isServer) {
                    this.createServer(new GameMain(mpackage));
                } else {
                    this.createClient(new GameMain(mpackage));
                }
                // callback here if, in case we want a listen server client
                this.statusCallback(isServer);
            });
    }

    private createServer(game : GameMain) 
    {
        this.server = new MServer(this, game);

        this.lsRoomAgent.onChannelOpened = (rP : RemotePlayer) => {
            this.debugStopWatch.logLap('lsRoomAgent onChanOpen');
            console.log(`${this.debugRandomId} MPeer is server inside onCHanOpen callback server null? ${this.server == null} `);
            if(this.server != null)
                this.server.connect(rP);
        }
        this.lsRoomAgent.onChannelClosed = (rP : RemotePlayer) => {
            if(this.server != null) 
                this.server.disconnect(rP.user);
        }

        this.lsRoomAgent.handshake();

        this.server.begin();
    }

    private createClient(game : GameMain) : void 
    {
        console.log(`${this.debugRandomId} MPeer is CLIENT inside onCHanOpen callback. is CLI null? ${this.client == null} `);

        new PreGameClient(this.lsRoomAgent, game);
        // this.lsRoomAgent.onChannelOpened = (serverPeerRP : RemotePlayer) => {
        //     this.client = new MClient(this.lsRoomAgent.user, game, (msg : string) => {
        //         serverPeerRP.peer.send(msg);
        //     });

        //     serverPeerRP.peer.recExtraCallback = (uid : string, e : MessageEvent) => {
        //         if(this.client !== null)
        //             this.client.handleServerMessage(e.data);
        //     };

        //     this.client.init();
        // }
        // this.lsRoomAgent.onChannelClosed = (serverPeerRP : RemotePlayer) => {
        //     if(this.client != null){
        //         this.client.teardown();
        //     }
        // }
    }

    public onClose() : void 
    {
        this.exitBeacon();
        this.lsRoomAgent.tearDown();
    }

    private exitBeacon()
    {
        console.log(`will call goodbye func`);
        console.log(`sending id token ${this.idToken}`);
        let goodbye = new GoodbyeData();
        goodbye.token = this.idToken;
        goodbye.debugUIDWithExtras = this.lsRoomAgent.user.UID;
        goodbye.isServer = this.server !== undefined; 
        let sendData = JSON.stringify(goodbye);
        // CONSIDER: can we send beacon twice?
        // TODO: if node mode
        // send an http req. the normal way?
        // probably can't use sendBeacon
        navigator.sendBeacon('https://us-central1-webrtcrelay2.cloudfunctions.net/signalGoodbyeHttp', sendData); 
    }
}

//
// Wait around until the server
// sends us a WelcomePackage
//
export class PreGameClient
{
    private welcomePackage : WelcomePackage | undefined;
    private debugLabel = new UILabel("pre-game-debug", "#CCDD22", undefined, "PREGAME:");

    constructor
    (
        private lsRoomAgent : ListenServerRoomAgent,
        private game : GameMain
    ){

        let _serverPeerRP : any = undefined;

        this.debugLabel.text = 'constructor';
        this.lsRoomAgent.onChannelOpened = (serverPeerRP : RemotePlayer) => {

            console.log(`ls RA on chann open`);
            this.debugLabel.text='onChanOpened';
            serverPeerRP.peer.recExtraCallback = (uid : string, e : MessageEvent) => {
                console.log(`rem p peer rec extra callback`);
                let comm = UnpackCommString(e.data);
                if(comm[0] !== WelcomePackage.Prefix) {
                    this.debugLabel.text = `not a welcome package`;
                    console.log(`peer got wrong comm type? ${comm[0]}`);
                    return;
                }
                let welcomePackage = JSON.parse(comm[1]);
                this.debugLabel.text = `parsing wpack`;
                if(welcomePackage && welcomePackage.shortId) 
                {
                    _serverPeerRP = serverPeerRP;
                    this.welcomePackage = welcomePackage;
                    this.debugLabel.text = `setting this wpack`;
                }
            };
        };

        // TODO: we never want to call handshake without setting 
        // lsRoomAgent.onChannelOpened first (formalize this)
        // Here's the catch however: we don't know what onCO should be until we know whether we're server of cli.
        // Our handling of this previously (or lack thereof, lol) created a race condition. Race between 
        // setting onChannelOpened and getting the WebRTC callback that triggers it.
        this.lsRoomAgent.handshake();


        let tHandle = window.setInterval(() => {

            //console.log(`await welcome package`);
            if(this.welcomePackage) 
            {
                console.log(`got welc pkg : ${this.welcomePackage.shortId}`);
                this.debugLabel.text = 'will create in game client';
                this.createInGameClient(_serverPeerRP);
                window.clearInterval(tHandle);
            }
        }, 10);

    }

    private createInGameClient(serverPeerRP : RemotePlayer | undefined) 
    {
        if(!serverPeerRP || !this.welcomePackage) throw new Error(`no server peer or welcome package`);

        let client = new MClient(this.lsRoomAgent.user, this.game, this.welcomePackage, this.lsRoomAgent.debugPlayerArrivalNumber, (msg : string) => {
            serverPeerRP.peer.send(msg);
        });

        serverPeerRP.peer.recExtraCallback = (uid : string, e : MessageEvent) => {
            if(client !== null)
                client.handleServerMessage(e.data);
        };

        this.lsRoomAgent.onChannelClosed = (serverPeerRP : RemotePlayer) => {
            if(client !== null) {
                client.teardown();
            }
        }

        client.init();
    
    }
}
