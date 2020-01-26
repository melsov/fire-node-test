import { Vector3, TransformNode, MeshBuilder } from "babylonjs";
import { MNetworkPlayerEntity } from "../MNetworkEntity";
import { MByteUtils } from "../../../Util/MByteUtils";
import { MapPackage, MeshFiles } from "../../MAssetBook";

export enum PickupType
{
    AMMO, GRENADE
}

export abstract class MPickup
{
    
    private _available : boolean = true;

    static get collisionRadius() : number { return 2; }

    abstract GetPickupType() : PickupType;

    protected abstract GetMeshName() : string;

    protected abstract GetItemTypeName() : string;

    get available() : boolean {
        return this._available;
    }

    set available(_available : boolean) {
        // if this is a new value
        // enable / disable children accordingly
        if(_available !== this.available) {
            this.root.getChildMeshes().forEach((mesh) => {
                mesh.setEnabled(_available);
            })
        }
        this._available = _available;
    }

    readonly root : TransformNode;

    get position() : Vector3 { return this.root.position; }

    set position(p : Vector3) {
        this.root.position = p.clone();
    }

    constructor(
        _position : Vector3,
        public bookIndex : number = 0,
        mapPackage : MapPackage
    )
    {
        this.root = new TransformNode(this.GetItemTypeName(), mapPackage.scene);
        this.root.position = _position;
        this.setupMesh(_position, mapPackage);
    }

    private setupMesh(position : Vector3, mapPackage : MapPackage) : void
    {
        // test mesh
        const cube = MeshBuilder.CreateBox(`pickup`, {
            size : 1.1
        });
        cube.parent = this.root;
        cube.setPositionWithLocalVector(Vector3.Zero());

        // WANT
        // const meshTask = mapPackage.assetBook.getMeshTask(this.GetMeshName());
        // if(meshTask === undefined) throw new Error(`no loaded mesh data for ${this.GetMeshName()}`);
        // if(meshTask.task === undefined) throw new Error(`no mesh task for ${this.GetMeshName()}`);

        // meshTask.task.loadedMeshes.forEach((m) => {
        //     // make a clone with root as parent
        //     const clone = m.clone(`${this.GetItemTypeName()}-clone`, this.root);
        //     if(clone) {
        //         clone.setPositionWithLocalVector(Vector3.Zero());
        //     }
        // });
    }

    ToPkString() : string
    {
        const typeStr = String.fromCharCode(this.GetPickupType()); 
        const bookIndexStr = String.fromCharCode(this.bookIndex);
        const posStr = MByteUtils.Vec3ToUint8String(this.position);
        return `${typeStr}${bookIndexStr}${posStr}`;
    }

    static get PkStringLength() : number { return MByteUtils.VecU8StringLength + 2; }

    static FromString(pkStr : string, offset : number, mapPackage : MapPackage) : MPickup
    {
        const pickupType = pkStr.charCodeAt(offset);
        const bookIndex = pkStr.charCodeAt(offset + 1);
        const pos = MByteUtils.Uint8StringToVec3(pkStr.substr(offset + 2, MByteUtils.VecU8StringLength));
        return MPickup.Create(pickupType, bookIndex, pos, mapPackage);
    }

    static Create(pickupType : PickupType, bookIndex : number, pos : Vector3, mapPackage : MapPackage) : MPickup
    {
        switch(pickupType)
        {
            case PickupType.AMMO:
                return new MAmmoPickup(pos, bookIndex, mapPackage);
            default:
                throw new Error(`Can't create pickup. ${pickupType} isn't a valid pickup type`);
        }
    }

    // funnily enough: pickups don;t need a mesh at all on the server
    // with this collision algorithm
    collides(pos : Vector3) {
        return pos.subtract(this.position).lengthSquared() < MPickup.collisionRadius * MPickup.collisionRadius;
    }

    apply(player : MNetworkPlayerEntity) : void 
    {
        this._apply(player);
        this.available = false;
    }

    protected abstract _apply(player : MNetworkPlayerEntity) : void;

    destroySelf() : void
    {
        this.available = false;
    }
}


export class MAmmoPickup extends MPickup
{
    GetPickupType(): PickupType {
        return PickupType.AMMO;
    } 
    
    GetMeshName() : string {
        return MeshFiles.Instance.shotgun.getKey();
    }

    GetItemTypeName() : string { return 'AmmoPickup'; }
    
    protected _apply(player: MNetworkPlayerEntity): void {
        player.playerPuppet.arsenal.equipped().addAmmo();
        console.log(`pickup gave ammo ${player.netId}`);
    }

}
