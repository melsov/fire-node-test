import { LagNetwork, LaggyPeerConnection, LAG_MS_FAKE } from "./LagNetwork";
import * as MServer from "./MServer";
//import { Fakebase } from "./Fakebase";
import { MNetworkPlayerEntity, MNetworkEntity, InterpData } from "./bab/NetworkEntity/MNetworkEntity";
import { GameMain, TypeOfGame } from "./GameMain";
import { MWorldState } from "./MWorldState";
import { MLoadOut } from "./bab/MPuppetMaster";
import { CliCommand, MPlayerInput } from "./bab/MPlayerInput";
import { DebugHud } from "./html-gui/DebugHUD";
import { Color3, Vector3, MeshAssetTask, TransformNode, Nullable } from "babylonjs";
import { MPlayerAvatar } from "./bab/MPlayerAvatar";
import { CheckboxUI } from "./html-gui/CheckboxUI";
import { MUtils } from "./Util/MUtils";
import { MTickTimer } from "./Util/MTickTimer"; 
import * as tfirebase from "../../shared/tfirebase";
import * as Collections from 'typescript-collections';
import { ClientControlledPlayerEntity } from "./bab/NetworkEntity/ClientControlledPlayerEntity";
import { FPSCam } from "./bab/FPSCam";
import { BHelpers } from "./MBabHelpers";
import { MMessageBoard } from "./bab/MAnnouncement";
import { ConfirmableMessageOrganizer, ConfirmableType, MAnnouncement, MPlayerReentry, MExitDeath, MAbstractConfirmableMessage, MDisconnectedPlayerCM } from "./helpers/MConfirmableMessage";
import { LifeStage, StageType } from "./MLifeCycle";
import * as Mel from "./html-gui/LobbyUI";
import { LagQueue } from "./helpers/LagQueue";
import * as MAudio from "./loading/MAudioManager";
import { UIVector3 } from "./html-gui/UIVector3";
import { MParticleManager } from "./loading/MParticleManager";
import { UILabel } from "./html-gui/UILabel";
import { MStateBuffer } from "./MStateBuffer";
import { ServerUpdate, WelcomePackage, UnpackCommString } from "./comm/CommTypes";
import { UINumberSet } from "./html-gui/UINumberSet";
import { UIDebugWorldState } from "./html-gui/UIDebugWorldState";
import { MMetronomeInput } from "./bab/MMetronomeInput";
import { MPickupManager } from "./bab/NetworkEntity/Pickup/MPickupManager";
import { CliSideEntityManager } from "./MEntityManager";
import { MEntitySnapshot } from "./MEntitySnapshot";
import { MDetectNode } from "../../MDetectRunningInNode";

import * as KeyMoves from "./bab/KeyMoves";



var fakeCommandsIndex = 0;
function MakeFakeCommand() : CliCommand
{
    let cc = new CliCommand();
        if ((fakeCommandsIndex++) % 2 == 0)
        {
            cc.horizontal = -.1;
        } else {
            cc.horizontal = .1;
        }
    return cc;
}


export function CommandToString(cmd : CliCommand) : string
{
    return JSON.stringify(cmd);
}

export function CommandFromString(str : string) : CliCommand
{
    const cmd = <CliCommand> JSON.parse(str);
    cmd.forward = BHelpers.Vec3FromJSON(cmd.forward);
    cmd.rotation = BHelpers.Vec3FromJSON(cmd.rotation);
    cmd.debugPosRoAfterCommand = InterpData.FromJSON(cmd.debugPosRoAfterCommand);
    return cmd;
}

export class MClient
{

    public readonly playerEntity : ClientControlledPlayerEntity;
    private clientViewState : CliSideEntityManager; // MWorldState = new MWorldState();
    private stateBuffer : MStateBuffer = new MStateBuffer();
    // private puppetMaster : MPuppetMaster;

    public readonly fpsCam : FPSCam;
    private input : MPlayerInput;
    private inputSequenceNumber : number = 0;
    private pendingInputs : Array<CliCommand> = new Array<CliCommand>();

    private debugHud : DebugHud;
    private debugHudInfo : DebugHud;

    private debugDeltaUpdates = new UILabel("debugDeltaUpdates", "#33FF88");

    private entityInterpolation : CheckboxUI = new CheckboxUI('interpolation', true);
    private serverReconciliation : CheckboxUI = new CheckboxUI('reconciliation', true);
    private clientSidePrediction : CheckboxUI = new CheckboxUI('prediction', true);
    private justIgnoreServer : CheckboxUI = new CheckboxUI('ignoreServer', false); 

    private lobbyUI : Mel.LobbyUI = new Mel.LobbyUI();

    private NoLongerMeaningfulClientNumber : number = 0;

    private sampleInputTimer : MTickTimer = new MTickTimer(MServer.ServerSimulateTickMillis);

    private pickupManager : MPickupManager;

    private fromServer : LagQueue<string> = new LagQueue<string>(LAG_MS_FAKE, 0, 0, 6); 
    // private fromServer : Collections.Queue<string> = new Collections.Queue<string>();
    // private reliableFromServer : Collections.Queue<string> = new Collections.Queue<string>();

    private gotFirstServerMessage : boolean = false;

    private messageBoard : MMessageBoard = new MMessageBoard();

    private confirmMessageOrganizer : ConfirmableMessageOrganizer = new ConfirmableMessageOrganizer();

    private stageOfLifeType : StageType = StageType.DeadConfigureLoadout; // TODO: should be 'not connected'

    private loop : () => void = () => {};

    private requestLoadOutFunc : () => void = () => {};

    private debugWeapOffsetUI : UIVector3;
    private debugCliDataBeforeReconciliation : InterpData = new InterpData();

    // private debugWorldState : UIDebugWorldState = new UIDebugWorldState("ClientViewState", this.clientViewState);

    private debugMetroPosLabel = new UILabel("DebugMetronomePos", "#FFFFFF", undefined, "", "18px");
    private lastDebugMetroNow : number = 0;

    private debugLagQUI : UINumberSet = new UINumberSet("LagQ", 4,
        ["lagMS", "drop01", "OofO01", "OofORange"],
        [this.fromServer.lagMillis, this.fromServer.dropChance01, this.fromServer.outOfOrderChance01, this.fromServer.outOfOrderSkipRange],
        (ns) => {
            this.fromServer.lagMillis = ns[0];
            this.fromServer.dropChance01 = ns[1];
            this.fromServer.outOfOrderChance01 = ns[2];
            this.fromServer.outOfOrderSkipRange = ns[3];
        });


    private debugIsAMetronome : boolean = false;

    //
    // CONSIDER: maybe the client doesn't do much
    // until it gets an update from the server
    // a special -- first time -- update that
    // will contain its in game (say) two byte handle
    // 
    constructor(
        public readonly user : tfirebase.FBUser,
        public readonly game : GameMain,
        welcomePackage : WelcomePackage,
        debugPlayerArrivalNumber : number,
        private send : (msg : string) => void
    ) 
    {
        this.lobbyUI.showHide(true);
        this.NoLongerMeaningfulClientNumber = 0; 

        this.clientViewState = new CliSideEntityManager(this.game.mapPackage);
        
        this.playerEntity = new ClientControlledPlayerEntity(welcomePackage.shortId, this.game.mapPackage); // MNetworkPlayerEntity(this.user.UID);

        this.debugIsAMetronome = MDetectNode.IsRunningInNode() || MUtils.QueryStringContains('metronome') 
        this.input = this.debugIsAMetronome ? new MMetronomeInput(false) : new MPlayerInput(false);
        this.input.useScene(this.game.canvas, this.game.scene);

        this.pickupManager = MPickupManager.CreateTestManager(this.game.mapPackage); // new MPickupManager(55, 4, .5, this.game.mapPackage);
        
        this.playerEntity.setupShadow(this.game.scene, this.NoLongerMeaningfulClientNumber);
        // this.clientViewState.getPuppet = (ent : MNetworkEntity) => {
        //     return this.puppetMaster.getPuppet(ent);
        // }

        this.clientViewState.lookup.setValue(this.playerEntity.netId, this.playerEntity);
        // this.clientViewState.setEntity(this.playerEntity.netId, this.playerEntity);
        
        MUtils.Assert(this.playerEntity.playerPuppet.mesh !== undefined, "surprising!");
        
        //customize puppet
        let skin = MLoadOut.DebugCreateLoadout(this.NoLongerMeaningfulClientNumber);
        
        let playerPuppet = <MPlayerAvatar> this.playerEntity.playerPuppet; // this.puppetMaster.getPuppet(this.playerEntity);
        playerPuppet.customize(skin);
        playerPuppet.addDebugLinesInRenderLoop();
        this.setupManagers();

        this.fpsCam = new FPSCam(this.game.camera, playerPuppet.mesh, Vector3.Zero());

        playerPuppet.setupClientPlayer(this.fpsCam.cam);

        this.debugWeapOffsetUI = new UIVector3("weapOffsetContainer");
        this.debugWeapOffsetUI.setValues(playerPuppet.weaponRoot.getPositionExpressedInLocalSpace());
        this.debugWeapOffsetUI.doInputChanged = (v : Vector3) => {
            console.log(`set weapon root to: ${v}`);
            playerPuppet.debugSetWeaponRootPos(v);
        };
        

        this.input.rightMouseToggle.callback = (isOn : boolean) => {
            this.fpsCam.toggleFOV(isOn);
        }

        this.loop = this.chooseLoadOutRenderLoop;

        this.game.engine.runRenderLoop(() => {
            this.loop();
        });

        this.debugHud = new DebugHud(this.NoLongerMeaningfulClientNumber == 0 ? "cli-debug-a" : "cli-debug-b");
        this.debugHudInfo = new DebugHud(this.NoLongerMeaningfulClientNumber == 0 ? "cli-debug-a-info" : "cli-debug-b-info");
        this.debugHudInfo.show(this.user.UID);


       this.awaitEnterGamePressed();
    }

    private awaitEnterGamePressed() 
    {
        // if we're a 'metronome' (articially unintelligent monkey client)
        // just jump into the game
        if(this.debugIsAMetronome)
        {
            this.handleEnterGamePressed();
            if(!MDetectNode.IsRunningInNode())
                MAudio.MAudioManager.Instance.enable(true);
            return;
        }

        this.lobbyUI.handleEnterGamePressed = (ev: MouseEvent) => {
            this.handleEnterGamePressed();
            MAudio.MAudioManager.Instance.enable(true);
        }
    }
   

    private setupManagers() : void 
    {
        MAudio.MAudioManager.SetSingleton(new MAudio.MAudioManager(this.game.scene, this.playerEntity.playerPuppet.mesh, this.game.mapPackage.assetBook));
        MParticleManager.SetSingleton(new MParticleManager(this.game.mapPackage, this.playerEntity.playerPuppet.mesh));
    }

    public init() : void
    {
        this.game.init();
        this.input.init(window);
    }

    private handleLifeTransition(next : StageType) : void 
    {
        if (this.stageOfLifeType === next) 
        {
            console.log(`same life stage: ${next} RETURN`);
            return;
        }

        // TODO: fix: respawning players are stuck in some kind of 'send lo req' purgatory
        // CONSIDER: at least in test deaths, health allowed to become negative. 
        // leads to bizarre health reports. Not sure if this matters. MAYBE: make sure death happens only once per death?

        if(this.stageOfLifeType === StageType.DeadConfigureLoadout && next === StageType.Alive) {
            console.log(`DeadCL to ALIVE`);
            this.requestLoadOutFunc = () => {};
            this.loop = this.inGameRenderLoop;
        }
        else if(this.stageOfLifeType === StageType.Alive && next === StageType.Bardo) {
            console.log(`ALIVE to BARDO`);
            this.lobbyUI.showHide(true);
            this.input.exitPointerLock(this.game.canvas, this.game.scene);
            this.stageOfLifeType = next;
            this.doBardoTimeout(() => {
                this.handleLifeTransition(StageType.DeadConfigureLoadout);
            });
        }
        else if(this.stageOfLifeType === StageType.Bardo && next === StageType.DeadConfigureLoadout) {
            console.log(`Bardo to DeadCL`);
            // TODO: be dead for a bit
            this.lobbyUI.showEnterButton();
            this.lobbyUI.showHide(true);
            this.input.exitPointerLock(this.game.canvas, this.game.scene);
            this.requestLoadOutFunc = () => {};
            this.loop = this.chooseLoadOutRenderLoop;
        }
        this.stageOfLifeType = next;
    }

    private doBardoTimeout(callback : () => void) : void 
    {
        let handle = -1;
        let remaining = MServer.AwaitRespawnExpandedSeconds;
        this.lobbyUI.showCountDown(remaining);
        handle = window.setInterval(() => {
            console.log(`bardo: ${remaining}`);
            this.lobbyUI.showCountDown(remaining);
            if(--remaining === 0) {
                window.clearInterval(handle);
                callback();
            }
        }, MServer.MillisPerExpandedSeconds);
    }

    private handleEnterGamePressed() : void 
    {
        if(this.stageOfLifeType === StageType.DeadConfigureLoadout) {
            this.lobbyUI.showHide(false);
            this.input.enterPointerLock(this.game.canvas, this.game.scene);
            this.requestLoadOutFunc = () => { this.sendLoadOutRequest(); }
        }
    }

    private chooseLoadOutRenderLoop() : void
    {
        this.sampleInputTimer.tick(this.game.engine.getDeltaTime(), () => {
            this.requestLoadOutFunc();
            this.processServerUpdates();
            // TODO: check whether we log out of firebase if we leave during this loop
        });
    }

    private debugWaitThenSendLOTimer = new MTickTimer(5);

    private sendLoadOutRequest() : void 
    {

        let lo = MLoadOut.DebugCreateLoadout(this.NoLongerMeaningfulClientNumber);
        if(!lo) { return; }

        let cmd = new CliCommand();
        cmd.loadOutRequest = lo;
        cmd.confirmHashes = this.confirmMessageOrganizer.consumeHashes();

        let strcmd = CommandToString(cmd);
        console.log(`send lo req cmd:`);

        this.send(strcmd);
        
    }

    private debugUpdateMetronomePosLabel()
    {
        /* // BROKEN ATM
        let other = this.clientViewState.debugFindAnotherPlayer(this.playerEntity.netId);
        if(other) {
            
            let opiPair = other.debugLastOPIPair;
            if(opiPair) 
            {
                let now = opiPair[0].debugAckIndex;
                if(now - this.lastDebugMetroNow > MServer.DEBUG_SHADOW_UI_UPDATE_RATE) 
                {
                    this.debugMetroPosLabel.text = `${(opiPair[0].debugAckIndex % 100)}`
                    this.lastDebugMetroNow = now;
                }
               
            }
        }
        */
    }

    
    private inGameRenderLoop() : void
    {
        this.sampleInputTimer.tick(this.game.engine.getDeltaTime(), () => {
            this.processServerUpdates();
            if(this.gotFirstServerMessage)
                this.processInputs();

            this.debugUpdateMetronomePosLabel();
        });

        // Consider: do we need gotFirstServerMessage at this point?
        if(this.gotFirstServerMessage)
        {
            this.interpolateOthers();
            this.playerEntity.renderTick(this.game.engine.getDeltaTime());
            this.fpsCam.renderTick();
        }

        MAudio.MAudioManager.Instance.playAny();
        MParticleManager.Instance.playAny();
    }

    public teardown() : void 
    {
        this.gotFirstServerMessage = false;
        this.game.tearDown();
        // clearInterval(this.serverTickProcessHandle);
    }

    private static MonkeyWanderRadius = 11;
    private static _MWRSq = MClient.MonkeyWanderRadius * MClient.MonkeyWanderRadius;

    private debugMonkeyClientInput() : CliCommand
    {
        const command = new CliCommand();
        command.vertical = 1.0;

        const pos = this.playerEntity.position;
        const distSq = MUtils.LengthXZSquared(pos); // ground dist from the origin
        if(distSq < MClient._MWRSq)
        {
            command.forward = pos.normalizeToNew();
        }
        else 
        {
            const circularFwd = Vector3.Cross(Vector3.Up(), pos).normalizeToNew();
            command.forward = circularFwd;
            // const homing = distSq / MClient._MWRSq;
            // const fwd = this.playerEntity.playerPuppet.mesh.forward;
            // const turn = Vector3.Cross(fwd, Vector3.Up());
            // turn.addInPlace(turn.scale(-2.0 * Math.random() * homing));
            // turn.scaleInPlace(1 - 2 * Math.random() * homing);
    
            // command.forward = fwd.add(turn);
            // command.forward.normalize();
        }

        command.jump = Math.random() > .99;
        command.fire = Math.random() < .01 ? KeyMoves.DownUpHold.StillUp : KeyMoves.DownUpHold.Down;

        command.timestamp = +new Date();

        return command;
    }

    private getInput() : CliCommand
    {
        let command : CliCommand;
        if(this.debugIsAMetronome) 
        {
            // TODO: generate some more interesting movements
            // perhaps circles generated from cross products. 
            // the further out they get the closer 'right' vector
            // points to the center
            command = this.debugMonkeyClientInput();

        }
        else 
        {
            command = this.input.nextInputAxes();
            command.forward = this.fpsCam.forward();
            command.rotation = this.game.camera.rotation.clone(); // ? not fps cam rotation?
        }

        return command;
    }
    
    private processInputs() : void
    {
        const command = this.getInput(); // this.input.nextInputAxes();  
        command.inputSequenceNumber = this.inputSequenceNumber++;
        command.lastWorldStateAckPiggyBack = this.clientViewState.ackIndex;
        // if(!command.hasAMove) { 
        //     this.send(CommandToString(command)); // // still send a cmd for ack index // TODO: compress in this case
        //     return; 
        // }

        if (this.clientSidePrediction.checked)
        {
            this.playerEntity.applyPredictionOnlyCommand(command);
            this.playerEntity.applyCliCommand(command); // with collisions
            this.playerEntity.createImmediateEffectsFromInput(command);
        }

        //if(command.fire <= KeyMoves.DownUpHold.Hold) console.log(command.fire);

        command.claimY = this.playerEntity.position.y;

        // Pickups
        command.pickupClaimStr = this.pickupManager.pickupClaimsString(this.playerEntity.position);

        this.confirmMessageOrganizer.debugConsumeCheckClear(true);
        command.confirmHashes = this.confirmMessageOrganizer.consumeHashes();

        // if(command.debugGoWrongPlace){
        //     this.playerEntity.teleport(this.playerEntity.position.add(new Vector3(0, 0, 3)));
        //     console.log(`go wrong place ${this.playerEntity.position}`);
        // }

        if(command.debugTriggerKey) 
        {
            // if(this.fpsCam.offset.lengthSquared() > .00001) {
            //     this.fpsCam.offset = Vector3.Zero();
            // } else {
            //     this.fpsCam.offset = new Vector3(0, 3, -3);
            // }
        }
        
        //TODO: instead send the pos before prediction is applied
        // referencing this with last ack index 
        // the server should be able to check if the position 
        // matches the position it sees at that ack
        command.debugPosRoAfterCommand = this.debugCliDataBeforeReconciliation; // this.playerEntity.position;

        this.send(CommandToString(command));
        this.pendingInputs.push(command);
    }

    public handleServerMessage(msg : string) : void
    {
        this.fromServer.enqueue(msg);
    }

    private processServerUpdates() : void
    {
        while(true)
        {
            let msg = this.fromServer.dequeue(); 
            if(msg === null || msg === undefined || this.justIgnoreServer.checked)
            {
                break;
            }
            
            let comm = UnpackCommString(msg);
            switch(comm[0]) {
                case ServerUpdate.Prefix:
                    this.processServerUpdate(comm[1]);
                    break;
                case WelcomePackage.Prefix:
                    console.log(`ignoring welcome package in game client`);
                default:
                    break;
                    // ignore
            }
            
        } // END WHILE TRUE

        if(!this.clientSidePrediction) { this.pendingInputs.splice(0, this.pendingInputs.length); } // just clear pending inputs (we shouldn't really need to do this...)

        this.debugHud.show(`pos: ${MUtils.RoundVecString((<MNetworkPlayerEntity>this.clientViewState.lookup.getValue(this.playerEntity.netId)).position)}`); //  this.user.UID)).position)}`);
    }
    
    private processServerUpdate(msg : string) : void
    {
        console.log(`got a server update in mclient`);
            // BUT... need to determine a structure / pattern
            // for client side entity states in a buffer (for interpolation).
            // either: 
            //   a buffer of world states (client side)
            // or: 
            //   a per network entity state buffer
            //   which should not be sent across the network
            // favoring 
            // the former ? since it would seem to mesh
            // well with server side lag compensation? but
            // they should both work...

            // the latter ? would seem to involve fewer dictionary lookups?

            let serverUpdate : ServerUpdate = ServerUpdate.Unpack(msg);
            let nextState = serverUpdate.ws;
            
            // this.debugWorldState.update(); 
            if(nextState.ackIndex % 10 === 0) // slow down a bit
            {
                this.debugDeltaUpdates.text = `VALID: ${nextState.ackIndex < this.clientViewState.ackIndex ? "N" : "Y"} CLI-NEXT: ${this.clientViewState.ackIndex - nextState.ackIndex} Q Len: ${MUtils.PadToString(this.fromServer.length)} MSG size ${MUtils.PadToString(msg.length, 4)} `; 
                // | ${JSON.stringify(nextState)}`;
            }
            
            // curate state buffer
            // get an abs state
            let absNextState : Nullable<MWorldState> = null;
            if(!nextState.isDelta) { //FOR NOW: it never is a delta 
                absNextState = nextState;
            } else {
                // **** NOT IN USE ***** //
                throw new Error(`this certainly won't happen ever`);
                // find the base state 
                /*
                let baseState = this.stateBuffer.stateWithAckDebug(nextState.deltaFromIndex, "CLI");
                if(!baseState) {
                    // NOTE: 'relevancy shaking' does not trigger this condition it would seem
                    console.warn(`we probably want to deal with this case`);
                    // CONSIDER: we could tell the server that we need an abs update?
                    // could lengthen our state buffer if we're getting deltas from too long ago
                    return;
                }

                absNextState = new MWorldState();

                // CONSIDER: we could clone/create only the entities that exist in next State (it might have relevancy filtering)
                absNextState.cloneFrom(baseState);
                absNextState.addInPlaceCopyOrCloneCreate(nextState);
                absNextState.ackIndex = nextState.ackIndex;
                */
            }

            
            // let debugDeltaWithCli = this.clientViewState.ackIndex - nextState.deltaFromIndex;
            // this.debugDeltaUpdates.text = `cli ack: ${this.clientViewState.ackIndex} cli - delta: ${debugDeltaWithCli} next - delta: ${nextState.ackIndex - nextState.deltaFromIndex}`;
            // this.debugDeltaUpdates.text += `**abs state delta? ${absNextState.debugHasDeltaEntities()} | `;
            // this.debugDeltaUpdates.text += `pending cmds: ${this.pendingInputs.length}. ${(<MPlayerAvatar>this.playerEntity.puppet).debugTargets()}`;

            // updates may arrive out of order.
            // throw out any that are older than the latest one we've seen.
            if(nextState.ackIndex < this.clientViewState.ackIndex) 
            { 
                // this.clientViewState.updateAuthStatePushInterpolationBuffers(absNextState, true); // [No need to] update only new arrivals
                // CONSIDER: state changes? purge deleted? are these ok to do with out of date next states?
                this.consumeConfirmables(serverUpdate.confirmableMessages);
                this.pickupManager.copyFromBroadcast(serverUpdate.pickupData);
                return; 
            }

            this.consumeConfirmables(serverUpdate.confirmableMessages);
            this.pickupManager.copyFromBroadcast(serverUpdate.pickupData);

            this.clientViewState.ackIndex = absNextState.ackIndex;

            if(this.entityInterpolation.checked) // it had better be
            {
                // TODO: smooth out other player interpolation (we're seeing slight choppiness). might require 
                // rewinding further back in the buffer
                this.clientViewState.updateAuthStatePushInterpolationBuffers(absNextState); // nextState);

                // SERMON:
                // the following method call (cloneAuthStateToInterpDatax) is a regrettable 
                // side effect of having both 'lastAuthState' and puppet 'interpdata'
                // really have to re-design the whole relationship between sent data and 
                // in-game applied data.
                // Thinking that: sent data should not be tied to anything in game; should just be a spreadsheet.
                // In game things 'stamp' themselves as send data (on the server)
                // In game things update their interpdata with received send data (on the client).
                // ...what am forgetting...? both cli and server have a collection of puppets
                // and a buffer of world states (collections of send data organized by ackIndex)
                // would need send data classes (?) for each type of puppet (players, pickups)
                /*
                // LUCKILY: stateBuffer is only needed with deltas
                let pushClone = this.clientViewState.cloneAuthStateToInterpData();
                pushClone.ackIndex = this.clientViewState.ackIndex;
                // push the latest client view state
                this.stateBuffer.push(pushClone);
                */
            }
            else 
            {
                // turned off (always entity interpolate)
                // MAYBE TODO: if we didn't entity interpolate, and there were deltas (not abs updates)
                // we'd need to not apply a delta twice to our own player ent,
                // which we would be doing at the moment if the lines below were uncommented

                // if(nextState.isDelta)
                //     this.worldState.applyDelta(nextState);
                // else 
                //     this.worldState.applyAbsState(nextState);
            }

            // RANDOM INSIGHT: We can truncate decimals of plentity positions (for bandwidth minimization) 
            // would have to do it everywhere (even for cli-owned player)

            //
            // Push state changes (fire, health pickup, etc.)
            //
            this.clientViewState.pushStateChanges(nextState);
            // this.clientViewState.purgeDeleted(nextState); // removed method (now deletes are confirmable msgs)
            
            //
            // Cli owned player
            //
            let nextCliPlayerState = <MEntitySnapshot> absNextState.lookup.getValue(this.playerEntity.netId);

            if(!nextCliPlayerState) { // DEBUG
                console.log(`absNextStateKeys: ${absNextState.lookup.keys()}`);
            }
            // put the cli controlled player in the server authoritative state
            this.playerEntity.applyAuthStateToCliTargets();

            // this.playerEntity.applyNonDeltaData(nextCliPlayerState); // did nothing
            
            if(!this.gotFirstServerMessage) {
                this.playerEntity.teleport(nextCliPlayerState.interpData.getPosition());
                this.gotFirstServerMessage = true;
            }
            
            this.debugCliDataBeforeReconciliation = this.playerEntity.lastAuthoritativeState.clone(); // getInterpData();
            //
            // server reconciliation
            // purge cli commands older than server update 
            // re-apply cli commands past the server update
            //

            if(this.serverReconciliation.checked && this.clientSidePrediction.checked)
            {
                // reapply newer inputs
                let j = 0;
                while(j < this.pendingInputs.length)
                {
                    let input = this.pendingInputs[j]; 
                    if(input.inputSequenceNumber <= serverUpdate.lastInputNumber)
                    {
                        // server has already seen this input
                        this.pendingInputs.splice(j,1);
                    }
                    else 
                    {   
                        // reapply inputs beyond what server has seen
                        this.playerEntity.applyCliCommand(input);
                        j++;
                    }
                }
            }
       
        
    }

    private consumeConfirmables(confirmableMessages : Nullable<MAbstractConfirmableMessage[]>)
    {
        //announcements
        if(confirmableMessages)
        {
            this.confirmMessageOrganizer.addArray(confirmableMessages);
            this.messageBoard.push(<MAnnouncement[]> this.confirmMessageOrganizer.consume(ConfirmableType.Announcement)); 
            this.handlePlayerReentry(<MPlayerReentry[]> this.confirmMessageOrganizer.consume(ConfirmableType.PlayerReentry));
            this.handleExitDeath(<MExitDeath[]> this.confirmMessageOrganizer.consume(ConfirmableType.ExitDeath));
            this.handlePlayerDC(<MDisconnectedPlayerCM[]> this.confirmMessageOrganizer.consume(ConfirmableType.DisconnectedPlayer));
        }

    }
 

    private interpolateOthers()
    {
        this.clientViewState.interpolate(this.playerEntity);
    }

    private handlePlayerReentry(prs :  MPlayerReentry[]) : void 
    {
        for(let i=0; i<prs.length; ++i)
        {
            let preentry = prs[i];

            // if(preentry.netId === this.user.UID) {
            //     this.setPlayerEntShortId(preentry.shortId);
            // }

            let pl = this.clientViewState.lookup.getValue(preentry.netId);
            if(pl === undefined) { continue; }

            let plent = pl.getPlayerEntity();
            if(plent === null) { continue; }

            plent.teleport(preentry.spawnPos);
            plent.playerPuppet.customize(preentry.loadOut);

            console.warn(`someone got a player reentry`);

            if(preentry.netId === this.playerEntity.netId) { // this.user.UID) {
                console.log(`new life transition for me: Alive`);
                this.handleLifeTransition(StageType.Alive);
            }
        }
    }


    private handlePlayerDC(dcMessages : MDisconnectedPlayerCM[]) 
    {
        for(let i=0; i< dcMessages.length; ++i)
        {
            const dcmsg = dcMessages[i];
            this.clientViewState.destroyEntity(dcmsg.dcId);

            // CONSIDER: will the player still exists in our UI etc?
        }
    }

    private handleExitDeath(eds : MExitDeath[]) : void 
    {
        for(let i=0; i<eds.length; ++i)
        {
            let ed = eds[i];
            let pl = this.clientViewState.lookup.getValue(ed.deadNetId);
            if(pl == undefined) { continue; }

            let plent = pl.getPlayerEntity();
            if(plent == undefined) { continue; }

            console.log(`player ${plent.netId} died`);
            if(ed.deadNetId === this.playerEntity.netId) {
                console.log(`we died`);
                // we died
                this.handleLifeTransition(StageType.Bardo);
                // TODO: mid screen bold announcement
            }
            this.messageBoard.add( new MAnnouncement(`${ed.killerName} ${ed.colorCommentary} ${ed.deadNetId}`) );

        }
    }
}
