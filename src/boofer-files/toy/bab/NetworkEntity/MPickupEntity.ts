// import { MNetworkEntity, EntityType } from "./MNetworkEntity";
// import * as Babylon from "babylonjs";
// import * as KeyMoves from '../KeyMoves';
// import { CliCommand } from "../MPlayerInput";
// import { TransformNode, Vector3, Ray, Nullable, Mesh, MeshBuilder, Tags, StandardMaterial, Scene, NoiseProceduralTexture, SSAORenderingPipeline } from "babylonjs";
// import { BHelpers } from "../../MBabHelpers";
// import { Puppet, PlaceholderPuppet, MLoadOut } from "../MPuppetMaster";
// import { MPlayerAvatar, DEBUG_SPHERE_DIAMETER, MAX_HEALTH as MAX_HEALTH_PLAYER } from "../MPlayerAvatar";
// import { MProjectileHitInfo, ProjectileType } from "./transient/MProjectileHitInfo";
// import { GameEntityTags } from "../../GameMain";
// import { MUtils } from "../../Util/MUtils";
// import { MTransientStateBook, FireActionType } from "./transient/MTransientStateBook";
// import * as MAudio from "../../loading/MAudioManager";
// import { Float16Array, getFloat16, setFloat16, hfround } from "@petamoriken/float16";
// import { MByteUtils } from "../../Util/MByteUtils";
// // import { MServer } from "../../MServer";
// import * as MServr  from "../../MServer"
// import { MSelectiveSetValue } from "../../helpers/MSelectiveSetValue";

// // puppet imports
// import { GridMaterial } from "babylonjs-materials";
// import { MNetworkPlayerEntity, CliTarget, InterpData } from "./MNetworkEntity";
// import { MFlopbackTimer } from "../../helpers/MFlopbackTimer";
// // import { MAudio } from "../loading/MAudioManager";
// // import { WeaponMeshImport, MShotgun } from "./NetworkEntity/weapon/MWeapon";
// import * as MLoader from "../MAssetBook";
// import { MArsenal } from "./weapon/MArsenal";
// import { MParticleManager } from "../../loading/MParticleManager";

// export class MPickupPuppet implements Puppet
// {
//     applyNetEntityUpdateIngoreCollisions(ent: CliTarget): void {
//         throw new Error("Method not implemented.");
//     }    

//     applyNetworkEntityUpdate(ent: CliTarget): void {
//         throw new Error("Method not implemented.");
//     }

//     customize(skin: MLoadOut): void { }

//     getInterpData(): InterpData {
//         throw new Error("Method not implemented.");
//     }

//     setInterpData(id: InterpData): void {
//         throw new Error("Method not implemented.");
//     }

//     getBoundsCorners(): Babylon.Vector3[] {
//         throw new Error("Method not implemented.");
//     }
// }

// export class MPickupEntity extends MNetworkEntity
// {
//     public get entityType(): number { return EntityType.PICKUP; }
//     public puppet: Puppet = new PlaceholderPuppet();

//     public setupPuppet(pupp: Puppet): void {
//         throw new Error("Method not implemented.");
//     }
//     public applyCliCommand(cliCommand: CliCommand): void {
//         throw new Error("Method not implemented.");
//     }
//     public teleport(pos: Babylon.Vector3): void {
//         throw new Error("Method not implemented.");
//     }
//     public apply(update: MNetworkEntity): void {
//         throw new Error("Method not implemented.");
//     }
//     public applyNonDelta(update: MNetworkEntity): void {
//         throw new Error("Method not implemented.");
//     }
//     updateAuthState(update: MNetworkEntity): void {
//         throw new Error("Method not implemented.");
//     }
//     public pushInterpolationBuffer(debubAckIndex: number): void {
//         throw new Error("Method not implemented.");
//     }
//     public interpolate(): void {
//         throw new Error("Method not implemented.");
//     }
//     public clearTransientStates(): void {
//         throw new Error("Method not implemented.");
//     }
//     public pushStateChanges(ne: MNetworkEntity): void {
//         throw new Error("Method not implemented.");
//     }
//     public clone(): MNetworkEntity {
//         throw new Error("Method not implemented.");
//     }
//     cloneWithAuthStateOfOtherToInterpData(): MNetworkEntity {
//         throw new Error("Method not implemented.");
//     }
//     public minus(other: MNetworkEntity): MNetworkEntity {
//         throw new Error("Method not implemented.");
//     }
//     public addInPlaceOrCopyNonDelta(delta: MNetworkEntity): void {
//         throw new Error("Method not implemented.");
//     }
//     public plus(other: MNetworkEntity): MNetworkEntity {
//         throw new Error("Method not implemented.");
//     }
//     public renderLoopTick(deltaTime: number): void {
//         throw new Error("Method not implemented.");
//     }
//     public destroySelf(): void {
//         throw new Error("Method not implemented.");
//     }

    
// }