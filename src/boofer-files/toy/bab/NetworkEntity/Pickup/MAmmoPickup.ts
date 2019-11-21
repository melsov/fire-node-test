import { MPickup, PickupType } from "./MPickup";
import { MNetworkPlayerEntity } from "../MNetworkEntity";
import { MapPackage, MeshFiles } from "../../MAssetBook";
import { Vector3 } from "babylonjs";

export class MAmmoPickup extends MPickup
{
    GetPickupType(): PickupType {
        return PickupType.AMMO;
    } 
    
    GetMeshName() : string {
        return MeshFiles.Instance.ammoPickup.getKey();
    }

    GetItemTypeName() : string { return 'AmmoPickup'; }
    
    protected _apply(player: MNetworkPlayerEntity): void {
        console.log(`pretending to apply pickup to ${player.netId}`);
    }

}