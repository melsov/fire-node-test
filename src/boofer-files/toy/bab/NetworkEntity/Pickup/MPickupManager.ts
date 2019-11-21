import { MBitArray } from "../../../helpers/MBitArray";
import { Vector3, Nullable } from "babylonjs";
import { MPickup } from "./MPickup";
import { MByteUtils } from "../../../Util/MByteUtils";
import { MNetworkPlayerEntity } from "../MNetworkEntity";
import { MapPackage } from "../../MAssetBook";
import { MPickupSpawner } from "./MPickupSpawner";
import { Queue } from "typescript-collections";

const RedundantBroadcasts : number = 4;

export class MPickupManager
{

    private stateBook : MBitArray;
    private pickups = new Array<MPickup>();

    private isStateBookDirty : number = RedundantBroadcasts;
    // private isPickupGenDirty : number = RedundantBroadcasts;

    private spawner : MPickupSpawner;
    private needRespawn = new Queue<[number, MPickup]>();
    private needBroadcast = new Queue<MPickup>();

    constructor(
        maxPickups : number,
        private readonly respawnIntervalSeconds : number,
        private readonly pickupReplacementChance01 : number,
        private readonly mapPackage : MapPackage
    )
    {
        this.stateBook = new MBitArray(Math.ceil(maxPickups/8));
        this.spawner = MPickupSpawner.MakeTestSpawner(mapPackage);
    }

    // client
    // let clients calculate possible pickups; (essentially, server is off loading some work)
    // use a simple radius. They can send a pickup claim to the server
    pickupClaimsString(playerPos : Vector3) : string | undefined
    {
        let result = new Array<number>();

        this.pickups.forEach((pickup) => {
            if(pickup.collides(playerPos)) {
                result.push(pickup.bookIndex);
            }
        })

        if(result.length === 0) return undefined;

        let uints = new Uint8Array(result.length);
        result.forEach((bookIdx, idx) => {
            uints[idx] = bookIdx;
        })

        return MByteUtils.Uint8ArrayToString(uints);
    }

    // server
    // server checks whether pickups really happened
    validatePickupClaims(claimStr : string, player : MNetworkPlayerEntity) : void
    {
        const ppos = player.position;
        const claimIndices = MByteUtils.StringToUInt8s(claimStr);
        claimIndices.forEach((bookIdx) => {
            if(bookIdx < this.pickups.length) 
            {
                const p = this.pickups[bookIdx];
                if(p && p.available && p.collides(ppos)) {
                    p.apply(player);
                    this.stateBook.clear(bookIdx); 
                    this.spawner.recycleSpawnPoint(p.position);
                    this.isStateBookDirty = RedundantBroadcasts;
                    this.needRespawn.enqueue([+ new Date(), p]);
                }
            }
        });
    }

    // server
    recycle() : void
    {
        const now = + new Date();
        while(true)
        {
            let claimed = this.needRespawn.peek();
            if(!claimed || now - claimed[0] < this.respawnIntervalSeconds * 1000) break;

            this.needRespawn.dequeue();
            // Don't always invent a new pickup (it's more network expensive)
            // Instead, most times, just reenable the claimed pickup
            if(Math.random() < this.pickupReplacementChance01) {
                this.respawn(claimed[1].bookIndex);
            } else {
                this.reenable(claimed[1].bookIndex);
            }

        }

    }

    // server
    private reenable(bookIndex : number)
    {
        if(!this.stateBook.get(bookIndex))
        {
            this.stateBook.set(bookIndex, true);
            this.isStateBookDirty = RedundantBroadcasts;
        }
    }

    // server
    private respawn(bookIndex : number) : void
    {
        this.pickups[bookIndex].position = this.spawner.nextSpawnPoint();
        this.pickups[bookIndex].available = true;
        this.stateBook.set(bookIndex, true);
        this.needBroadcast.enqueue(this.pickups[bookIndex]);
    }

    // client
    private cliUpdateEnabled(bookIndex : number, enabled : boolean)
    {
        this.pickups[bookIndex].available = enabled;
        this.stateBook.set(bookIndex, enabled);
    }

    // client
    private cliAddPickup(pk : MPickup) : void
    {
        if(pk.bookIndex < this.pickups.length && this.pickups[pk.bookIndex])
        {
            this.pickups[pk.bookIndex].destroySelf();
            this.pickups[pk.bookIndex] = pk;
            pk.available = true;
            this.stateBook.set(pk.bookIndex, true);
        }
    }

    // server side player entity applies pickup effects
    // propagates them to the client


    // server updates its Pickup manager state book and propagates that to the client
    // when a pickup needs to respawn, the server respawns it. 
    // records the respawns any pickups that need to respawn each state recalc. (after procesesing cli commands)
    // any pickup respawns are sent out to clients

    // server
    appendToBroadcast(broadcast : any) : void
    {
        if(this.needBroadcast.size() > 0)
        {
            let pickupStr = '';
            while(true)
            {
                const pickup = this.needBroadcast.dequeue();
                if(!pickup) {
                    break;
                }
                pickupStr += pickup.ToPkString();
            }
            if(pickupStr.length > 0) {
                if(broadcast.pg !== undefined) {
                    throw new Error(`don't want to overwrite field 'pg'. current value: ${broadcast.pg}`);
                }
                broadcast.pg = pickupStr; // 'pg': 'Pickup Gen'
            }
        }

        if(this.isStateBookDirty > 0)
        {
            if(broadcast.ps !== undefined) {
                throw new Error(`don't want to overwrite field 'ps'. current value: ${broadcast.ps}`);
            }
            broadcast.ps = this.stateBook.toUint8String();
            this.isStateBookDirty = 0; // ok. just kidding. isStateBookDirty is a boolean at the moment
        }
    }

    //client
    copyFromBroadcast(broadcast : any) : void
    {
        if(broadcast.pg)
        {
            let idx = 0;
            const pgenStrs = <string> broadcast.pg;
            if(pgenStrs.length % MPickup.PkStringLength !== 0) { throw new Error(`bad gen str len: ${pgenStrs.length} not a multiple of ${MPickup.PkStringLength}`); }
            
            while(idx < pgenStrs.length) {
                const pick = MPickup.FromString(pgenStrs, idx, this.mapPackage);
                this.cliAddPickup(pick);
                idx += MPickup.PkStringLength;
            }
        }

        if(broadcast.ps)
        {
            const bookString = <string> broadcast.ps;
            const nextStateU8s = MByteUtils.StringToUInt8s(bookString);
            this.stateBook.iterateMismatches(nextStateU8s, (curr, next, idx) => {
                this.cliUpdateEnabled(idx, next);
            });
        }
    }

}