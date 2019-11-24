import { MBitArray } from "../../../helpers/MBitArray";
import { Vector3, Nullable } from "babylonjs";
import { MPickup, PickupType } from "./MPickup";
import { MByteUtils } from "../../../Util/MByteUtils";
import { MNetworkPlayerEntity } from "../MNetworkEntity";
import { MapPackage } from "../../MAssetBook";
import { MPickupSpawner } from "./MPickupSpawner";
import { Queue } from "typescript-collections";

const RedundantBroadcasts : number = 4;

export class MPickupManager
{

    private stateBook : MBitArray;
    // private pickups = new Array<MPickup>();

    // private isStateBookDirty : number = RedundantBroadcasts;
    // private isPickupGenDirty : number = RedundantBroadcasts;

    // private spawner : MPickupSpawner;
    private needRespawn = new Queue<[number, MPickup]>();
    private needBroadcast = new Queue<MPickup>();

    private lastRecycleTimestamp : number = 0;

    // CONSIDER: MPickupManager should be two different subclasses: MPMCli, MPMServer
    constructor(
        // maxPickups : number,
        private readonly respawnIntervalSeconds : number,
        private readonly maxRespawnsPerInterval : number,
        private readonly pickupReplacementChance01 : number,
        private readonly mapPackage : MapPackage,
        private readonly pickups : MPickup[]
    )
    {
        if(pickups.length > 256) { throw new Error(`max 256 pickups. ${pickups.length} is too many`); }
        this.stateBook = new MBitArray(Math.ceil(pickups.length/8));
        //this.spawner = MPickupSpawner.MakeTestSpawner(mapPackage);
    }

    static CreateTestManager(mapPackage : MapPackage) : MPickupManager
    {
        const pkups = new Array<MPickup>();
        let pos : Vector3;
        let type : PickupType;
        for(let i=0; i < 16; ++i) {
            pos = new Vector3(i * 8, .5, -12);
            type = PickupType.AMMO;
            const pk = MPickup.Create(type, i, pos, mapPackage);
            pk.available = i % 2 === 0; // randomly disable some pickups
            pkups.push(pk);
        }

        return new MPickupManager(12, 3, .5, mapPackage, pkups);
    }

    // server
    // initPickupsServer() : void 
    // {
    //     const howMany = this.spawner.PointCount; 
    //     for(let i=0; i<howMany; ++i) {
    //         const type = this.spawner.nextType();
    //         const pos = this.spawner.nextSpawnPoint();
    //         const pk = MPickup.Create(type, i, pos, this.mapPackage);
    //         this.pickups[i] = pk;
    //         pk.available = i % 2 === 0; // half available at start
    //         this.stateBook.set(i, pk.available);
    //         if(pk.available) {
    //             this.needBroadcast.enqueue(pk);
    //         }
    //     }
    //     this.isStateBookDirty = RedundantBroadcasts;
    // }

    // client
    // let clients calculate possible pickups; (essentially, server is off loading some work)
    // use a simple radius. They can send a pickup claim to the server
    pickupClaimsString(playerPos : Vector3) : string | undefined
    {
        let result = new Array<number>();

        this.pickups.forEach((pickup) => {
            if(pickup.available && pickup.collides(playerPos)) {
                pickup.available = false; // politely, preemptively unset on client
                result.push(pickup.bookIndex);
            }
        })

        
        if(result.length === 0) return undefined;
        
        console.log(`^^!!!***cli claims ${result.length} pickups`);

        let uints = new Uint8Array(result.length);
        result.forEach((bookIdx, idx) => {
            uints[idx] = bookIdx;
        })

        return MByteUtils.Uint8ArrayToString(uints);
    }

    // server
    // server checks whether pickups really happened
    validatePickupClaims(claimStr : string | undefined, player : MNetworkPlayerEntity) : void
    {
        if(!claimStr) {
             return;
        }
        const ppos = player.position;
        const claimIndices = MByteUtils.StringToUInt8s(claimStr);
        console.log(`SRV sees ${claimIndices.length} claims for plyr: ${player.netId}`);
        claimIndices.forEach((bookIdx) => {
            if(bookIdx < this.pickups.length) 
            {
                const p = this.pickups[bookIdx];
                if(p && p.available && p.collides(ppos)) {
                    console.log(`valid pk claim for ${player.netId}`);
                    p.apply(player);
                    this.stateBook.clear(bookIdx); 
                    // this.spawner.recycleSpawnPoint(p.position);
                    // this.needRespawn.enqueue([+ new Date(), p]);
                }

            }
        });
    }

    

    private nextByteIndexWithSomeZeros() : number
    {
        let offset = Math.floor(Math.random() * this.stateBook.byteLength);
        for(let i=0; i < this.stateBook.byteLength; ++i) {
            const idx = (offset + i) % this.stateBook.byteLength;
            if(~this.stateBook.byteAt(idx) !== 0) { return idx; }
        }
        return -1;
    }

    private flipSomeZerosAt(byteIdx : number) 
    {
        // let flipper = 0;
        // for(let i = 0; i < this.maxRespawnsPerInterval; ++i) {
        // }

        // test: turn them all back on
        this.stateBook.setByteAt(byteIdx, 255);
        // turn on pickups at this byte
        const startIdx = byteIdx * 8;
        for(let i=0; i < 8; ++i) {
            const idx = startIdx + i;
            if(idx < this.pickups.length) {
                this.pickups[idx].available = true;
            }
        }
    }

    // server
    recycle() : void
    {
        const now = + new Date();
        if(now - this.lastRecycleTimestamp < this.respawnIntervalSeconds * 1000) {
            return;
        }
        this.lastRecycleTimestamp = now;

        const byteIdx = this.nextByteIndexWithSomeZeros();
        if(byteIdx < 0) { return; }

        this.flipSomeZerosAt(byteIdx);
        
        // while(true)
        // {
        //     let claimed = this.needRespawn.peek();
        //     if(!claimed || now - claimed[0] < this.respawnIntervalSeconds * 1000) break;

        //     this.needRespawn.dequeue();
        //     // Don't always invent a new pickup (it's more network expensive)
        //     // Instead, most times, just reenable the claimed pickup
        //     if(Math.random() < this.pickupReplacementChance01) {
        //         this.respawn(claimed[1].bookIndex);
        //     } else {
        //         this.reenable(claimed[1].bookIndex);
        //     }

        // }

    }

    // server
    // private reenable(bookIndex : number)
    // {
    //     if(!this.stateBook.get(bookIndex))
    //     {
    //         this.stateBook.set(bookIndex, true);
    //         this.isStateBookDirty = RedundantBroadcasts;
    //     }
    // }

    // // server
    // private respawn(bookIndex : number) : void
    // {
    //     this.pickups[bookIndex].position = this.spawner.nextSpawnPoint();
    //     this.pickups[bookIndex].available = true;
    //     this.stateBook.set(bookIndex, true);
    //     this.needBroadcast.enqueue(this.pickups[bookIndex]);
    // }


    // client
    // private cliAddPickup(pk : MPickup) : void
    // {
    //     if(pk.bookIndex < this.pickups.length && this.pickups[pk.bookIndex])
    //     {
    //         this.pickups[pk.bookIndex].destroySelf();
    //         this.pickups[pk.bookIndex] = pk;
    //         pk.available = true;
    //         this.stateBook.set(pk.bookIndex, true);
    //     }
    // }

    // server side player entity applies pickup effects
    // propagates them to the client


    // server updates its Pickup manager state book and propagates that to the client
    // when a pickup needs to respawn, the server respawns it. 
    // records the respawns any pickups that need to respawn each state recalc. (after procesesing cli commands)
    // any pickup respawns are sent out to clients

    // server
    appendToBroadcast() : any 
    {
        // if(this.needBroadcast.size() === 0 && this.isStateBookDirty === 0) {
        //     return undefined;
        // }
        const broadcast : any = {};
      
        // console.log(`%%%% WILL append pickups. nBroad:  ${this.needBroadcast.size()} dirty: ${this.isStateBookDirty}`);
        // if(this.needBroadcast.size() > 0)
        // {
        //     let pickupStr = '';
        //     while(true)
        //     {
        //         const pickup = this.needBroadcast.dequeue();
        //         if(!pickup) {
        //             break;
        //         }
        //         pickupStr += pickup.ToPkString();
        //     }
        //     if(pickupStr.length > 0) {
        //         if(broadcast.pg !== undefined) {
        //             throw new Error(`don't want to overwrite field 'pg'. current value: ${broadcast.pg}`);
        //         }
        //         broadcast.pg = pickupStr; // 'pg': 'Pickup Gen'
        //     }
        //     console.log(`PGEN string now: [ ${broadcast.pg} ]`);
        // }

        broadcast.ps = this.stateBook.toUint8String();
        return broadcast;
    }

    //client
    copyFromBroadcast(broadcast : any) : void
    {
        if(!broadcast) {
            return;
        }
        // console.log(`*****PKUP in CLI*****`);
        // if(broadcast.pg)
        // {
        //     console.log(`%%%% got a pk gen`);
        //     let idx = 0;
        //     const pgenStrs = <string> broadcast.pg;
        //     console.log(`pk gen: ${pgenStrs}`);
        //     if(pgenStrs.length % MPickup.PkStringLength !== 0) { throw new Error(`bad gen str len: ${pgenStrs.length} not a multiple of ${MPickup.PkStringLength}`); }
            
        //     while(idx < pgenStrs.length) {
        //         const pick = MPickup.FromString(pgenStrs, idx, this.mapPackage);
        //         this.cliAddPickup(pick);
        //         idx += MPickup.PkStringLength;
        //     }
        // }

        if(broadcast.ps)
        {
            const bookString = <string> broadcast.ps;
            // DEBUG
            if(this.stateBook.toUint8String() !== bookString) {
                console.log(`$$$$ CLI meaningful pkup state update`);
            }

            const nextStateU8s = MByteUtils.StringToUInt8s(bookString);
            this.stateBook.iterateMismatches(nextStateU8s, (next, idx) => {
                console.log(`CLI ${next ? 'enjoying' : 'resetting'} a validated pickup at ${idx}`);
                this.cliUpdateEnabled(idx, next);
            });
        }
    }

    // client
    private cliUpdateEnabled(bookIndex : number, enabled : boolean)
    {
        this.pickups[bookIndex].available = enabled;
        this.stateBook.set(bookIndex, enabled);
    }

}