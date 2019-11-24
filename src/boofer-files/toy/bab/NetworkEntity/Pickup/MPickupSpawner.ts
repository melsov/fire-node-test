import { Vector3 } from "babylonjs";
import { Dictionary, Set } from "typescript-collections";
import { PickupType, MPickup } from "./MPickup";
import { MapPackage } from "../../MAssetBook";
import { MUtils } from "../../../Util/MUtils";

export class MPickupSpawner
{

    private distributionTable = new Dictionary<PickupType, number>();
    private usedPoints = new Set<Vector3>((v : Vector3) => {
        return `${MUtils.RoundVecString(v, 3)}`;
    });
    private unusedPoints = new Set<Vector3>((v : Vector3) => {
        return `${MUtils.RoundVecString(v, 3)}`;
    });

    private static SetTypeDistribution(spawner : MPickupSpawner, mapPackage : MapPackage) : void
    {
        spawner.distributionTable.setValue(PickupType.AMMO, 1);
        spawner.distributionTable.setValue(PickupType.GRENADE, 0);

        // normalize
        let total = 0;
        spawner.distributionTable.values().forEach((chance) => { total += chance });
        if(total === 0) return;

        const keys = spawner.distributionTable.keys();
        for(let i=0; i<keys.length; ++i) {
            let chance = spawner.distributionTable.getValue(keys[i]);
            if(chance) {
                spawner.distributionTable.setValue(keys[i], chance / total);
            }
        }
    }

    static MakeTestSpawner(mapPackage : MapPackage) : MPickupSpawner
    {
        const points = new Array<Vector3>();
        let v = Vector3.Zero();
        for(let i=0; i<16; ++i) {
            points.push(v.clone());
            v.addInPlace(Vector3.Right().scaleInPlace(2));
        }
        const spawner = new MPickupSpawner(points, 4, mapPackage);
        this.SetTypeDistribution(spawner, mapPackage);
        return spawner;
    }

    get PointCount() : number { return this.points.length; }

    constructor(
        private points : Vector3[],
        private respawnIntervalSeconds : number,
        private readonly mapPackage : MapPackage
    )
    {
        this.resetSpawnPoints();
    }
    
    private resetSpawnPoints() 
    {
        this.points.forEach((p) => {
            this.unusedPoints.add(p);
        });
        this.usedPoints.clear();
    }

    nextSpawnPoint() : Vector3 
    {
        const unused = this.unusedPoints.toArray();
        if(unused.length === 0) 
            this.resetSpawnPoints(); // not sure why were spawning in this case, but oh well

        const idx = Math.floor(Math.random() * unused.length);
        const p = unused[idx];
        this.unusedPoints.remove(p);
        return p;
    }

    recycleSpawnPoint(v : Vector3) 
    {
        if(this.usedPoints.remove(v))
        {
            this.unusedPoints.add(v);
        }
    }

    // Choose type
    nextType() : PickupType
    {
        const keys = this.distributionTable.keys();
        if(keys.length === 0) return PickupType.AMMO;

        let test = 0.0001;
        let choice = Math.random();
        const values = this.distributionTable.values();
        for(let i=0; i < keys.length; ++i) 
        {
            test += values[i];
            if(choice < test) {
                return keys[i];
            }
        }

        return keys[keys.length - 1];
    }


}