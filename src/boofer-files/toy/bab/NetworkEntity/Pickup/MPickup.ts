import { Vector3, TransformNode } from "babylonjs";
import { MNetworkPlayerEntity } from "../MNetworkEntity";
import { MByteUtils } from "../../../Util/MByteUtils";
import { MAmmoPickup } from "./MAmmoPickup";
import { MapPackage } from "../../MAssetBook";

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
        // if this is a new value...
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
        this.setupMesh(_position, mapPackage);
    }

    private setupMesh(position : Vector3, mapPackage : MapPackage) : void
    {
        const meshTask = mapPackage.assetBook.getMeshTask(this.GetMeshName());
        if(meshTask === undefined) throw new Error(`no loaded mesh data for ${this.GetMeshName()}`);
        if(meshTask.task === undefined) throw new Error(`no mesh task for ${this.GetMeshName()}`);

        meshTask.task.loadedMeshes.forEach((m) => {
            // make a clone with root as parent
            const clone = m.clone(`${this.GetItemTypeName()}-clone`, this.root);
        });
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

    private static Create(pickupType : PickupType, bookIndex : number, pos : Vector3, mapPackage : MapPackage) : MPickup
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

