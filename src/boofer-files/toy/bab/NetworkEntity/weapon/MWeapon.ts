import { MServer, ServerSimulateTickMillis } from "../../../MServer";
//import { Mesh } from "babylonjs/Meshes/mesh";
import { Mesh, TransformNode, Node, Scene, SceneLoader, AbstractMesh, IParticleSystem, Skeleton, Animation, AnimationGroup, Nullable, MeshBuilder, Vector3, AbstractAssetTask, MeshAssetTask, AnimationRange, TargetedAnimation, EventState, ParticleSystem, Texture } from "babylonjs";
import { MUtils } from "../../../Util/MUtils";
import * as KeyMoves from "../../KeyMoves"; // "../../MPlayerInput";
// import * as MAudio from "../../../loading/MAudioManager";
import * as MLoader from "../../MAssetBook";
import * as MAnimator from "../../../loading/MAnimator";
import { MSkeletonAnimator } from "../MSkeletonAnimator";
import * as MSoundType from "../../../manager/SoundType";
import { MParticleType } from "../../../manager/MParticleType";



// export namespace WeaponMeshImport
// {

    

    export function FindMeshSet(task : MeshAssetTask, rootNodeName : string, scene : Scene) : [WeaponMeshSet, Skeleton]
    {
        let muzzle : Nullable<TransformNode> = null; 
        let muzzleFlashRoot : Nullable<TransformNode> = null;
        MUtils.Assert(task.loadedSkeletons.length === 1, `we were assuming exactly one skeleton. multiple skeletons per .bab file seems needlessly complicated`);
        let skelClone = task.loadedSkeletons[0].clone(`skel-${rootNodeName}`, `skel-id-${rootNodeName}`);
        let root = MUtils.RootifiedClone(rootNodeName, task.loadedMeshes, scene, (clone : Node, orig : Node) => {
            if(orig instanceof Mesh && clone instanceof Mesh) {
                if(orig.skeleton) {
                    // assuming only one skeleton
                    clone.skeleton = skelClone;
                }
            }

            if(orig.name.toLowerCase() === "muzzle") {
                muzzle = new TransformNode(clone.name, scene);
                muzzle.position = (<TransformNode>clone).position;
                muzzle.parent = clone.parent;
                clone.dispose();
            }
            else if (clone.name.toLowerCase().endsWith("muzzle-flash")) {
                muzzleFlashRoot =  <TransformNode> clone;
                //TODO: implement some scheme for multiple muzzle flash options
                // hide muzzle flash
            }
        });
        
 

        if(!muzzle || !muzzleFlashRoot) throw new Error(`didn't find a muzzle and a muzzle-flash. There must be a mesh 
            named 'mUzZLE' and one named 'muzzle-FLAsh' (case insensitive) in the mesh list. (Muzzle will turn into a transform node during import)`);

        let flashes = (<TransformNode> muzzleFlashRoot).getChildMeshes(true);

        return [new WeaponMeshSet(root, muzzle, flashes, "shotgunimpact"), skelClone];

    }
    
// }


export type MWAnimType=MSkeletonAnimator;

export class GunAnimator
{
    constructor(
        public skelAnimator : MWAnimType
    ){}

    playReload() : void 
    {
        this.skelAnimator.play("Reload");
    }

    playFire() : void 
    {
        this.skelAnimator.play("Fire");
    }
}

export class GunEffects
{
    constructor(
        public fireSoundType : MSoundType.SoundType,
        public animations : GunAnimator
        // TODO: Loadable particles <--actually specify-able particles blender exporter doesn't export particles
    ) 
    {}
}


class WeaponMeshSet 
{
    constructor(
        public main : TransformNode,
        public muzzle : TransformNode,
        public muzzleFlashes : TransformNode[],
        public impactParticleType : string
        ) {
            this.muzzleFlashes.forEach((flashMesh) => {
                flashMesh.setEnabled(false);
            })
        }


    dispose() {
        throw new Error('not implemented');
        if(this.main)
            this.main.dispose();
        if(this.muzzle)
            this.muzzle.dispose();
    }
}

export abstract class MAbstractWeapon
{

    constructor(
        public meshSet : WeaponMeshSet,
        public effects : GunEffects
    )
    {
        effects.animations.skelAnimator.addEndActionCallback("Reload", (ag : AnimationGroup, eventState : EventState) => {
            this.handleReloadFinished();
        });
        
        this._uiTotalAmmo = this._totalAmmo;
    }
 

    // we think fireRate needs to be a multiple of the simulate tick rate
    protected fireRateM : number = ServerSimulateTickMillis * 50;
    protected abstract get isAutomatic() : boolean;

    protected _totalAmmo : number = this.MaxAmmo(); 
    MaxAmmo() : number { return 10; }
    
    PerPickupAmmoIncrease() : number { return 4; }
    addAmmo() {  this.setTotalAmmo(this._totalAmmo + this.PerPickupAmmoIncrease()); }
    get totalAmmo() : number { return this._totalAmmo; }
    setTotalAmmo(_total : number) { this._totalAmmo = Math.min(this.MaxAmmo(), _total); }

    // private _uiTotalAmmo : number = 0;
    public getUIAmmo = () => { return this._totalAmmo; }
    // get uiTotalAmmo() : number { return this._uiTotalAmmo; }

    protected hasAnotherClip() : boolean { return this.totalAmmo > this.PerClipAmmo(); }

    private refill : number = 0;

    private decrementTotalAmmo()
    {
        const refill = Math.min(this.PerClipAmmo(), this._totalAmmo);
        this._totalAmmo -= refill;
        this.refill = refill;
    }

    // protected decrementAmmoFillClip() : void 
    // {
        
    // }
    
    private consumeRefill()
    {
        // odd case where they are pretty low but have some ammo in the clip too (let's not worry too much)
        this._clipAmmo = Math.min(this._clipAmmo + this.refill, this.PerClipAmmo()); 
        this.refill = 0;
    }

    //
    // region could-would fire
    //
    public PerClipAmmo() : number { return 3; }
    protected _clipAmmo : number = this.PerClipAmmo();
    public get clipAmmo() : number { return this._clipAmmo; }
    public isAmmoInClip() : boolean { return this._clipAmmo > 0; }
    protected decrementClipAmmo() : void { this._clipAmmo = Math.max(0, this._clipAmmo - 1);}

    public abstract keyAllowsFire(duh : KeyMoves.DownUpHold) : boolean;
    
    public hasAmmoAndKeyAllowsFire(duh : KeyMoves.DownUpHold) : boolean {
        return this.isAmmoInClip() && this.keyAllowsFire(duh);
    }
    // end region could-would fire


    protected handleReloadFinished() : void 
    {
        this.consumeRefill();
        this.getUIAmmo = () => { return this._totalAmmo; }
        // this.decrementAmmoFillClip();
    }

    protected isReloading() {
        return this.effects.animations.skelAnimator.isPlaying("Reload");
    }

    // play reload. triggers fill clip callback
    public playReload() 
    {
        if(!this.isReloading()) // this.effects.animations.skelAnimator.isPlaying("Reload"))
        {
            if(this.totalAmmo > 0) 
            {
                this.decrementTotalAmmo();
                const tammo = this._totalAmmo;
                this.getUIAmmo = () => { return tammo; }
                this.effects.animations.playReload();
            }
            else 
            {
                // TODO: play an out of ammo sound, perhaps a soft 'tink'
            }
        }
    }


    // protected playEffects : () => void = () => {};
    // enableClientSideEffects() : void {
    //     this.playEffects = this.playClientSideEffects;
    // }

    // Please don't call this from sub classes. thank you
    public abstract playClientSideFireEffects() : void;

    public fire(duh : KeyMoves.DownUpHold) : boolean 
    {
        // assume we 'should fire', checked externally
        console.log(`total ammo: ${this.totalAmmo}. clip: ${this._clipAmmo}`);
        // TODO: UI for ammo / clip

        this._fire();
        this.decrementClipAmmo();
        this.flashMuzzleFlash();
        return true;
    }

    protected abstract _fire() : void;

    protected abstract flashMuzzleFlash() : void;
    
    
    // TODO: reload animation


}

export abstract class MVoluntaryWeapon extends MAbstractWeapon
{
    private isTimeoutFinished : boolean = true;
    protected get isAutomatic() : boolean { return false; }

    public keyAllowsFire(duh : KeyMoves.DownUpHold) : boolean { 
        return this.isTimeoutFinished && duh === KeyMoves.DownUpHold.Down; 
    }

    protected _fire() : void 
    {
        if(!this.isTimeoutFinished) { console.warn("weapon fired before timeout?");}

        this.isTimeoutFinished = false;
        
        window.setTimeout(() => {
            this.isTimeoutFinished = true;
        }, this.fireRateM);

        this.doFire();

        this.effects.animations.skelAnimator.playIfNotAlready("Fire");
    }

    protected abstract doFire() : void;

    protected flashMuzzleFlash() : void 
    {
        // CONSIDER: using a shader for flash effects probably won't tank performance and might allow for more expressiveness

        let start = MUtils.RandIntMaxExclusive(this.meshSet.muzzleFlashes.length);
        
        for(let i=0; i< 2; ++i)
        {
            this.meshSet.muzzleFlashes[(start + i) % this.meshSet.muzzleFlashes.length].setEnabled(true);
            window.setTimeout(() => {
                this.meshSet.muzzleFlashes[(start + i) % this.meshSet.muzzleFlashes.length].setEnabled(false);
            }, 40 + i * 10);
        }
    }
}

export class MShotgun extends MVoluntaryWeapon
{

    static CreateShotgun(mapPackage : MLoader.MapPackage) : MShotgun
    {
        let loadedMeshData = mapPackage.assetBook.getMeshTask(MLoader.MeshFiles.Instance.shotgun.getKey());
        if(loadedMeshData === undefined) throw new Error(`couldn't find ${MLoader.MeshFiles.Instance.shotgun.getKey()} asset`);
        
        let meshSetAndSkel = FindMeshSet(loadedMeshData.task, "shotgun-root", mapPackage.scene);
        
        let skelAnimator = new MSkeletonAnimator(mapPackage.scene, meshSetAndSkel[1], meshSetAndSkel[0].main );

        if(!loadedMeshData.animationBook) throw new Error(`null animation book?`);
        skelAnimator.addActionsFromBook(loadedMeshData.animationBook);

        let anims = new GunAnimator(skelAnimator);
        let effects = new GunEffects(
            MSoundType.SoundType.ShotgunFire,
            anims);

        return new MShotgun(meshSetAndSkel[0], effects);
    }

    public playClientSideFireEffects() : void 
    {
        // audio should play with animation spec
        // MAudio.MAudioManager.Instance.enqueue(this.effects.fireSoundType, this.meshSet.muzzle.position);

        // TODO: play particles
    }
 
    protected doFire(): void // need a way to only create fire effects client side
    {
        
    }
    
}