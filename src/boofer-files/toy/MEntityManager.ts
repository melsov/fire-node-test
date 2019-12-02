import { Dictionary } from 'typescript-collections';
import { MNetworkEntity, MNetworkPlayerEntity } from "./bab/NetworkEntity/MNetworkEntity";
import * as Collections from "typescript-collections";
import { Puppet } from "./bab/MPuppetMaster";
import { MUtils } from "./Util/MUtils";
import { Vector3, Scene, Ray, Tags, RayHelper, Nullable, Color3, Mesh, AbstractMesh } from "babylonjs";
import * as MServer  from "./MServer";
import { GameEntityTags } from "./GameMain";
import { MByteUtils } from "./Util/MByteUtils";
import { MPlayerAvatar } from "./bab/MPlayerAvatar";
import { MEntitySnapshot } from "./MEntitySnapshot";
import { MWorldState } from './MWorldState';
import { endianness } from 'os';
import { MapPackage } from './bab/MAssetBook';

export abstract class MEntityManager
{
    readonly lookup = new Dictionary<string, MNetworkEntity>();

    private static _debugRayHelper : RayHelper = new RayHelper(new Ray(Vector3.Zero(), Vector3.One(), 1));

   constructor(
        protected readonly mapPackage : MapPackage
   )
   {}
    // public purgeDeleted(state : MWorldState) : void
    // {
    //     // TODO: figure out what this means
    //     let deletables = new Array<string> ();
    //     state.lookup.forEach((key : string, ent : MNetworkEntity) => {
    //         let e = this.lookup.getValue(key);
    //         if(e !== undefined && ent.shouldDelete)
    //         {
    //             deletables.push(key);
    //         }
    //     });

    //     for(let i=0; i<deletables.length; ++i) {
    //         let ent = this.lookup.remove(deletables[i]);
    //         if(ent){
    //             ent.destroySelf();
    //         }
    //     }
    // }

    destroyEntity(netId : string) : void
    {
        const ent = this.lookup.remove(netId);
        if(ent) {
            ent.destroySelf();
        }
    }
}

export class ServerSideEntityManager extends MEntityManager
{
    clearTransientStates() : void
    {
        this.lookup.forEach((key : string, ent : MNetworkEntity) => {
            ent.clearTransientStates();
        });
    }

    rewindPlayers(a : MWorldState, b: MWorldState, lerper01 : number, skipUID ? : string) : void 
    {
        this.lookup.forEach((key : string, ent : MNetworkEntity) => {
            let plent = ent.getPlayerEntity();
            if(plent !== null && key !== skipUID)
            {
                let pA = <MEntitySnapshot> a.lookup.getValue(key);
                let pB = <MEntitySnapshot> b.lookup.getValue(key);
                if(pA !== undefined && pB !== undefined)
                {
                    // let pos = Vector3.Lerp(pA.position, pB.position, lerper01);
                    let pos = Vector3.Lerp(pA.interpData.getPosition(), pB.interpData.getPosition(), lerper01);
                    plent.rewind(pos);
                } 
            }
        });
    }
    
    resetPlayersToPresent() : void
    {
        this.lookup.forEach((key : string, ent : MNetworkEntity) => {
            let plent = ent.getPlayerEntity();
            if(plent)
            {
                plent.resetToThePresent();
            }
        });
    }

    stamp() : MWorldState
    {
        const ws = new MWorldState();
        const keys = this.lookup.keys();
        const ents = this.lookup.values();
        for(let i=0; i<keys.length; ++i)
        {
            ws.lookup.setValue(keys[i], ents[i].stamp());
        }
        return ws;
    }

    

}

export class CliSideEntityManager extends MEntityManager
{
    ackIndex : number = -1;
    // client side
    public pushStateChanges(absState : MWorldState) : void
    {
        absState.lookup.forEach((key : string, snap : MEntitySnapshot) => {
            let ent = this.lookup.getValue(key);
            if(ent !== undefined)
            {
                ent.pushStateChanges(snap.nonInterpData);
            }
        });
    }

     // TODO: what does the authoritative state do again?
     // still not sure that we need auth state...seems like duplicate data?
     public updateAuthStatePushInterpolationBuffers(update : MWorldState) : void
     {
         //throw new Error(`figure out what this means`);
         update.lookup.forEach((key : string, snap : MEntitySnapshot) => {
             let ent = this.lookup.getValue(key);
 
             if(ent === undefined) {
                 ent = MNetworkEntity.CreateFrom(snap, this.mapPackage);
                 this.lookup.setValue(key, ent);
                //  ent = this.makeNetEntFrom(key, snap);
             }
            
             ent.updateAuthState(snap);
             ent.pushInterpolationBuffer(update.ackIndex);
 
             // health, ammo
             ent.applyNonDelta(snap.nonInterpData);
         });
 
         // the update may not contain all entities
         // (some may have been deemed irrelevant or have had zero deltas)
         // push the interpolation buffers for these ents as well, to avoid repeatedly
         // replaying the last known from-to interpolation. 
         // WANT?
         // this.lookup.forEach((key, ent) => {
         //     if(!update.lookup.getValue(key)) {
         //         ent.pushInterpolationBuffer(update.ackIndex);
         //     }
         // });
     }

     
    public interpolate(ignore : MNetworkPlayerEntity) : void 
    {
        this.lookup.forEach((uid : string, ent : MNetworkEntity) => {

            // skip our own player avatar
            if(ent !== ignore)
            {
                ent.interpolate();
            } 
        });
    }
     

}