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

    private static GetTypeDistribution(spawner : MPickupSpawner, mapPackage : MapPackage) : void
    {
        
    }

    static MakeTestSpawner(mapPackage : MapPackage) : MPickupSpawner
    {
        const points = new Array<Vector3>();
        let v = Vector3.Zero();
        for(let i=0; i<16; ++i) {
            points.push(v.clone());
            v.addInPlace(Vector3.Right().scaleInPlace(2));
        }
        return new MPickupSpawner(points, 4, mapPackage);
    }

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


}