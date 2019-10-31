
// import XMLHttpRequest_ = require('xhr2');
// var XMLHttpRequest = XMLHttpRequest_.XMLHttpRequest;
// globalThis.XMLHttpRequest = XMLHttpRequest;
// import * as  XMLHttpRequest  from "../node_modules/xhr2"
// import getXHR = require('xhr2');
import  { Engine,  Scene, Vector3, FreeCamera, HemisphericLight, Mesh, 
    TransformNode, SceneLoader, MeshBuilder, Color4, Color3, Tags, Ray, AssetsManager, 
    AbstractAssetTask, MeshAssetTask, Nullable, Material, ShaderMaterial, AbstractMesh, 
    Texture, TextFileAssetTask, Skeleton, StandardMaterial, VertexBuffer, AnimationGroup, 
    AnimationRange, Bone, Animation, Quaternion, ParticleSystem, ParticleHelper, NullEngine } from 'babylonjs';
import { GridMaterial } from 'babylonjs-materials';

// import * as Gui from 'babylonjs-gui';
// import { MAnimator } from './MAnimtor';
// import { Dictionary } from 'typescript-collections';
// import { MEntiyBabListLookup, MEnityBabFileList } from './MBabFileList';

//import * as wrtc from './WebRTCConnection';
//import {RoomAgent} from './RoomAgent';

//import * as firebase from 'firebase/app';
//import 'firebase/auth';
//import { Checkbox } from 'babylonjs-gui';
//import { LocalPlayer, tfirebase } from './MPlayer';

function testXhr2() {
    let re = 2; //getXHR.XMLHttpRequest;
    console.log("test xhr2");
    console.log(re);
}

testXhr2();

const g_render_canvas : string = "render-canvas";

function LOG(str : string) { console.log(str); }

export const g_main_camera_name : string = "main-camera";

export class GameEntityTags
{
    public static readonly Terrain = "Terrain";
    public static readonly PlayerObject = "PlayerObject";
    public static readonly MousePickPlane = "MousePickPlane";
    public static readonly Shadow = "Shadow";

    public static HasTag(oo : object, tag : string) : boolean
    {
        let o = Tags.GetTags(oo, true);
        if(o == null) return false;
        return o.indexOf(tag) >= 0;
    }

}

// export const TestActionSpecs : MAnimator.MActionSpec[] = [
//     // new MAnimator.MActionSpec(101, 120, "Reload")
// ];

export enum TypeOfGame
{
    Server, ClientA, ClientB
}

export class NullEngineGameMain
{
    
    
    // Associate a Babylon Engine to it.
    public readonly engine : Engine; // = new Engine(canvas);

    // Create our first scene.
    public scene : Scene; // = new Scene(engine);

    // This creates and positions a free camera (non-mesh)
    public readonly camera : FreeCamera; // = new FreeCamera("camera1", new Vector3(0, 5, -10), scene);

    //public readonly playerRoot : TransformNode;

    // public sphere : Mesh;
    // public box : Mesh;

    private shouldRenderDEBUG : boolean = true;
    stopRenderLoop() : void { this.shouldRenderDEBUG = false; }
    startRenderLoop() : void { this.shouldRenderDEBUG = true; }
    togglePaused() : void { this.shouldRenderDEBUG = !this.shouldRenderDEBUG; }

    clearColor : Color4;

    // private gunRoot : Nullable<TransformNode> = null;
    // private skelRoot : Nullable<Skeleton> = null;
    // private boneRoot : TransformNode;

    private showBonesMat : GridMaterial;

    constructor()
    {
        this.engine = new NullEngine();
        this.scene = new Scene(this.engine);
        this.camera = new FreeCamera(g_main_camera_name, new Vector3(0, 23, -17), this.scene);

        // this.boneRoot = MeshBuilder.CreateSphere(`boneRoot`, { diameter : 1});
        // this.boneRootTargetPos = this.boneRoot.position;
        // this.boneRootTargetRot = this.boneRoot.rotation;
        
        // This targets the camera to scene origin
        this.camera.setTarget(Vector3.Zero());

        this.camTargetPos = this.camera.position.clone();
        
        // This attaches the camera to the canvas
        
        // this.camera.attachControl(this.canvas, true);

        // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
        var light = new HemisphericLight("light1", new Vector3(0, 1, 0), this.scene);
    
        // Default intensity is 1. Let's dim the light a small amount
        light.intensity = 0.7;

        this.clearColor = Color4.FromHexString('#22AAFFFF') ;
        this.scene.clearColor = this.clearColor;
       
        let standardMat = new StandardMaterial(`stan`, this.scene);

        this.showBonesMat = new GridMaterial('showBonesMat', this.scene);

        //test file loader
        let testCloneParent = new TransformNode('clone-node', this.scene); 

        // TODO: per: https://doc.babylonjs.com/features/nullengine
        // add a custom impl on XHTML request for node...then we can use asset manager like normal we hope
        
        // let entLoader = MListLoader.Test();

        // UNCOMMENT FOR TESTING XHR2
        let specMan = new AssetsManager(this.scene);
        let specTask = specMan.addTextFileTask('load-task', 'http://localhost:9000/models/LoaderSpec/LoaderSpec.json');
        specMan.load();
        console.log(`specMan.load called`);

        // TODO: test using webrtc in node also

        specMan.onFinish = () => { // TEST
            console.log("specman finished");
            console.log(`got text: ${specTask.text}`);
            process.exit();
        }

        // specMan.onFinish = () =>
        // {
        //     let aman = new AssetsManager(this.scene);
            
        //     let vertTask = aman.addTextFileTask('vert-task', "./shaders/vert.glsl");
        //     let fragTask = aman.addTextFileTask('frag-task', "./shaders/frag.glsl");

        //     let specListLoader = MEntiyBabListLookup.CreateLoader(specTask.text);
        //     specListLoader.lookup.forEach((entityName, babFileList) => {

        //         // testing purposes: throw all actions into TestActionSpecs
        //         babFileList.files.forEach((babFileList) => {
        //             babFileList.actionSpecs.forEach((acspec) => {
        //                 TestActionSpecs.push(acspec);
        //             })
        //         });


        //     });
        //     let animLoader = new MAnimator.MAnimLoader();
        //     let skelAnimator : Nullable<MAnimator.MSkeletonAnimator> = null;

        //     let sgTask = aman.addMeshTask("import-some-mesh", null, "./models/", "shotgun.babylon");
        //     sgTask.onSuccess = (task : MeshAssetTask) => {
        //         task.loadedMeshes.forEach((mesh) => {
        //             if(!mesh.parent)
        //                 mesh.parent = this.boneRoot;
        //         });

                
        //     };
            
            
        //     aman.onFinish = (tasks : AbstractAssetTask[]) => {
        //         console.log(`finished`);
                
        //         this.findParticles(sgTask);
        //         // this.setupCustomShader(sgTask, vertTask, fragTask);
                
                
        //         animLoader.addToBookWithSkeletons('shotgun', sgTask.loadedSkeletons, TestActionSpecs);
        //         console.log(`num skels in sgTask: ${sgTask.loadedSkeletons.length}`);
        //         skelAnimator = new MAnimator.MSkeletonAnimator(this.scene, sgTask.loadedSkeletons[0]);
        //         let book = animLoader.getAnimationBookUnsafe('shotgun');
        //         skelAnimator.addActionsFromBook(book);
                
        //         // show bones add geom children
        //         sgTask.loadedSkeletons[0].bones.forEach((bone) => {
        //             this.attachDebugGeomToBone(bone);
        //         });

        //         //TEST clone skel and animate
        //         let otherSkelA = new MAnimator.MSkeletonAnimator(this.scene, sgTask.loadedSkeletons[0].clone('skel-clone', 'some-skel-id'));
        //         let oRootBone = otherSkelA.skeleton.getChildren()[0];
                
        //         let oSkelRoot = new TransformNode('oskelroot', this.scene);
        //         oRootBone.parent = oSkelRoot;
        //         oSkelRoot.position.addInPlace(Vector3.Right().scale(3));
        //         otherSkelA.addActionsFromBook(book);

        //         // let rootClone = <Mesh> this.boneRoot.clone('bone-root-clone', testCloneParent);
        //         // rootClone.skeleton = otherSkelA.skeleton;
        //         // clmesh.applySkeleton(otherSkelA.skeleton);

        //         otherSkelA.play(TestActionSpecs[0].actionName, true);
        //         // END TEST
                
        //         console.log(`after add action from book`);

        //         let whichAnimIdx = 0;
        //         //TEST
        //         if(skelAnimator) {
        //             skelAnimator.addEndActionCallback(TestActionSpecs[0].actionName, (ag, es) => {
        //                 console.log(`end callback`);
        //                 console.log(`got end ation: ${ag ? ag.name : 'undef ag'}.`);
        //             });
        //             skelAnimator.play(TestActionSpecs[0].actionName, true);
        //             // document.addEventListener('keydown', (ev : KeyboardEvent) => {
        //             //     if(ev.key=== 'r') {
        //             //         console.log(`r pressed. skel animator? ${skelAnimator !== null}`);
        //             //         if(skelAnimator)
        //             //         {
        //             //             skelAnimator.stop(TestActionSpecs[whichAnimIdx].actionName);
        //             //             whichAnimIdx = (whichAnimIdx + 1) % TestActionSpecs.length;
        //             //             skelAnimator.play(TestActionSpecs[whichAnimIdx].actionName, true);
        //             //             // skelAnimator.togglePlay(TestActionSpecs[0].actionName, true);
        //             //         }
        //             //     }
        //             // });
        //         }
                    
        //     }

        //     aman.load();
        // }//);

        // this.setupCameraKeys();

        this.makeAParticleSystem();
    }

    private findParticles(sgTask : MeshAssetTask) : Nullable<ParticleSystem>
    {
        let result : Nullable<ParticleSystem> = null;

        for(let i=0; i<sgTask.loadedParticleSystems.length; ++i)
        {
            let ps = sgTask.loadedParticleSystems[i];
            // ...
        }

        return result;
    }

    private makeAParticleSystem() : void
    {
        let psMesh = MeshBuilder.CreatePlane('ps-plane', {
            size : 3
        }, this.scene);
        psMesh.position = Vector3.Left().scale(4);

        let ps = ParticleHelper.CreateDefault(psMesh, 200, this.scene); // new ParticleSystem(`ps`, 200, this.scene);
        ps.particleTexture = new Texture("./shaders/cyos/phong/amiga.jpg", this.scene);
        

        ps.start();
        
    }

    private attachDebugGeomToBone(bone : Bone) : void
    {
        let box = MeshBuilder.CreateCylinder(`cyl-${bone.name}`, {
            height : 3,
            diameterTop : .5,
            diameterBottom : 1
        }, this.scene);

        box.position.copyFrom(bone.position);
        box.parent = bone;
        box.material = this.showBonesMat;
    }

    private camTargetPos : Vector3 = Vector3.Zero();
    private camSpeed : number = .9;

    private boneRootTargetPos : Vector3 = Vector3.Zero();
    private boneRootTargetRot : Vector3 = Vector3.Zero();

    // private setupCameraKeys() : void
    // {
    //     let handleKeys = (ev : KeyboardEvent) => {
    //         let delta = Vector3.Zero();
    //         let fwd = this.camera.getForwardRay().direction.normalizeToNew();
    //         let right = Vector3.Cross(Vector3.Up(), fwd);
    //         switch(ev.key) {
    //             case 'w':
    //                 delta.addInPlace(fwd);
    //                 break;
    //             case 's':
    //                 delta.addInPlace(fwd.scale(-1));
    //                 break;
    //             case 'a':
    //                 delta.addInPlace(right.scale(-1));
    //                 break;
    //             case 'd':
    //                 delta.addInPlace(right);
    //                 break;
    //             case 'q':
    //                 delta.addInPlace(Vector3.Up());
    //                 break;
    //             case 'e':
    //                 delta.addInPlace(Vector3.Down());
    //                 break;
    //             case 'y':
    //                 this.camSpeed = Math.min(4, this.camSpeed + .3);
    //                 break;
    //             case 't':
    //                 this.camSpeed = Math.max(.001, this.camSpeed - .3);
    //                 break;

    //             //MOVE BONE ROOT
    //             case 'i':
    //                 this.boneRootTargetPos.addInPlace(Vector3.Forward().scale(this.camSpeed / 2));
    //                 break;
    //             case 'k':
    //                 this.boneRootTargetPos.addInPlace(Vector3.Backward().scale(this.camSpeed / 2));
    //                 break;
    //             case 'p':
    //                 let rotSpeed = .01;
    //                 this.boneRootTargetRot.addInPlace(Vector3.Up().scale(rotSpeed));
    //                 break;

    //         }

    //         this.camTargetPos.addInPlace(delta.scale(this.camSpeed));
    //     };

    //     document.addEventListener('keydown',handleKeys);
    //     document.addEventListener('keypress', handleKeys);
    // }
   

    public static DebugMeshVertBuffs(mesh : Mesh) : void 
    {
        this.DebugVertexBuffer(mesh.getVertexBuffer(VertexBuffer.PositionKind), `${mesh.name} positions`);

        let indexArray = mesh.getIndices();
        if(indexArray) { console.log(`${mesh.name} indices len: ${indexArray.length}`); }

        this.DebugVertexBuffer(mesh.getVertexBuffer(VertexBuffer.MatricesWeightsKind), `${mesh.name} mat weights`);
        this.DebugVertexBuffer(mesh.getVertexBuffer(VertexBuffer.MatricesIndicesKind), `${mesh.name} mat indices`);
    }

    public static DebugVertexBuffer(vb : Nullable<VertexBuffer>, comment ? : string) : void 
    {
        comment = comment ? comment : "";
        if(!vb) { console.log(`${comment} null buffer`); return; }

        let data = vb.getData();
        if(data) {
            let str = data.toString();
            let arr = str.split(',');
            let len = arr.length;
            let sz = vb.getSize();
            let perDataSize = "no size?";
            if (sz > 0) perDataSize = "" + (len/sz);
            console.log(`${comment} len: ${arr.length} / size: ${sz} = per: ${perDataSize}`);
        }
        else {
            console.log(`${comment} no data`);
        }
    }

    private setupCustomShader(sgTask : MeshAssetTask, vertTask : TextFileAssetTask, fragTask : TextFileAssetTask) : void 
    {
        
        BABYLON.Effect.ShadersStore["customVertexShader"] = vertTask.text;
        BABYLON.Effect.ShadersStore["customFragmentShader"] = fragTask.text;

         // Compile
         var shaderMaterial = new ShaderMaterial("shader", this.scene, {
            vertex: "custom",
            fragment: "custom",
        },
            {
                attributes: ["position", "normal", "uv", "colors", BABYLON.VertexBuffer.MatricesIndicesKind, BABYLON.VertexBuffer.MatricesWeightsKind],
                uniforms: ["world", "worldView", "worldViewProjection", "viewProjection", "view", "projection"]
            });

        var refTexture = new Texture("shaders/cyos/phong/ref.jpg", this.scene);
        refTexture.wrapU = BABYLON.Texture.CLAMP_ADDRESSMODE;
        refTexture.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;

        var mainTexture = new Texture("shaders/cyos/phong/amiga.jpg", this.scene);

        shaderMaterial.setTexture("textureSampler", mainTexture);
        shaderMaterial.setTexture("refSampler", refTexture);
        shaderMaterial.setFloat("time", 0);
        shaderMaterial.setVector3("cameraPosition", Vector3.Zero());
        shaderMaterial.backFaceCulling = false;

        
        
        for (var index = 0; index < sgTask.loadedMeshes.length; index++) {
            var mesh = sgTask.loadedMeshes[index];
            mesh.material = shaderMaterial;
        }
    }

    private applyStandardMat(stanMat : Material, sgTask : MeshAssetTask) : void 
    {
        sgTask.loadedMeshes.forEach((mesh) => {
            mesh.material = stanMat;
        })
    }

    private shellSetupMesh(mesh : any) 
    {
        if(!mesh || !mesh.material) { console.log(`${mesh.name} didnt have a material proprty`); return; }
        var effect = mesh.material.getEffect();
        if(!effect) { return; }
		var scene = mesh.getScene();
		effect.setFloat4("vFogInfos", scene.fogMode, scene.fogStart, scene.fogEnd, scene.fogDensity); 
		effect.setColor3("vFogColor", Color3.Green()); // scene.fogColor);
		effect.setColor3('colorMult', mesh.colorMult || BABYLON.Color3.White());

		if (mesh.useBones && mesh.computeBonesUsingShaders && mesh.skeleton) {
            var matrices = mesh.skeleton.getTransformMatrices(mesh);
            if (matrices && effect) {
                effect.setMatrices('mBones', matrices);
            }
        }
    }

    public init()
    {
        this.restartRenderLoop();
    }

    public restartRenderLoop()
    {
        let i = 0;
        this.engine.runRenderLoop(() => {
            if(this.shouldRenderDEBUG)
            {
                this.doStuff();
                this.scene.render();

                if(++i % 50 === 0) {
                    console.log(`still running ${i}`);
                }
                // this.camera.position = Vector3.Lerp(this.camera.position, this.camTargetPos, .2);
                // this.boneRoot.position = Vector3.Lerp(this.boneRoot.position, this.boneRootTargetPos, .2);
                // this.boneRoot.rotation = Vector3.Lerp(this.boneRoot.rotation, this.boneRootTargetRot, .2);
            }
        });

    }

    private doStuff() : void
    {
        // let radMillis = (+ new Date()) / 3141.0;
        // if(this.gunRoot) {
        //    // this.gunRoot.rotate(Vector3.Up(), .004);
        //    //this.gunRoot.position.x = Math.sin( radMillis) * 3;
        // }
        // if(this.skelRoot) {
        //     // this.skelRoot.bones[0].rotate(Vector3.Up(), .007);
        //     // this.skelRoot.bones[0].position.x = Math.cos(radMillis) * 2.5
        //     this.boneRoot.rotate(Vector3.Up(), .007);
        //     this.boneRoot.position.x = Math.cos(radMillis) * 2.5
        // }
        // this.rayPicking();
    }

    // private rayPicking() : void{
    //     // move ray move back
    //     let bpos = this.box.position.clone();
    //     this.box.position = this.sphere.position.add(Vector3.Right().scale(4));
    //     let ray = new Ray(this.sphere.position.clone(), Vector3.Right(), 20);

    //     //this.scene.render();
    //     let pick = this.scene.pickWithRay(ray, (mesh) => {
    //         return mesh.name != this.sphere.name;
    //     });

    //     if(pick && pick.pickedMesh) {
    //         pick.pickedMesh.scaling.y += .01;
    //     }

    //     this.box.position = bpos;
    // }

    // private makeRayPickGeom() : void 
    // {
         
    //     //Create a grid material
    //     var material =  new GridMaterial("grid", this.scene);

    //     //Sphere
    //     //Our built-in 'sphere' shape. Params: name, subdivs, size, scene
    //     var sphere = Mesh.CreateSphere("sphere1", 16, 2, this.scene);

    //     //Move the sphere upward 1/2 its height
    //     sphere.position.y = 2;

    //     //Affect a material
    //     sphere.material = material;

    //     this.sphere = sphere;

    //     this.box = MeshBuilder.CreateBox('boxy', {
    //         size : 1
    //     }, this.scene);

    //     this.box.position = this.sphere.position.add(new Vector3(5, 0, 5));
    // }

    // BABYLON.SceneLoader.Append("./models/", "city.babylon", <BABYLON.Scene>(<unknown> scene), (_scene) => {
    //     console.log("appended the mesh");
    // });

    //
    // Factory methods
    //
    private makeMousePickPlane()
    {
        let plane = MeshBuilder.CreatePlane('mouse-pick-plane', {
            width : 500,
            height : 400
        }, this.scene);

        // plane.setParent(this.camera); // better if not attached, given our current 'top-down-ish' situation
        let plMat = new GridMaterial('mpickplane-mat', this.scene);
        plane.material = plMat;
        Tags.AddTagsTo(plane, GameEntityTags.MousePickPlane);
        
        plane.setPositionWithLocalVector(new Vector3(0, -2, 0));
        plane.rotate(Vector3.Right(), Math.PI / 2);

    }

    private get funColors() : Color4[] {
       let colors : Array<Color4> = new Array<Color4>();
       colors.push(Color4.FromColor3(Color3.White()));
       colors.push(Color4.FromColor3(Color3.Yellow()));
       colors.push(Color4.FromColor3(Color3.Red()));
       colors.push(Color4.FromColor3(Color3.Blue()));
       colors.push(Color4.FromColor3(Color3.Green()));
       colors.push(Color4.FromColor3(Color3.Purple()));
       return colors;
    }

    private makeBoxWalls() : void
    {
        let long = 15;
        let h = 2;
        let shrt = 2;

        let out = long / 2.0;
        let vx = new Vector3(1, 0, 0);
        let vz = new Vector3(0, 0, 1);

        for(let i=0; i<4;++i)
        {
            let ww = long; let dd = shrt;
            let pos = vz.clone();
            if(i%2==1){
                dd = long; ww = shrt;
                pos = vx.clone();
            }
            if (i > 1) {
                pos.scaleInPlace(-1.0);
            }
            pos.scaleInPlace(out + shrt / 2.0);

            let box = MeshBuilder.CreateBox(`box-wall-${i}`, {
                width: ww,
                height: h,
                depth: dd,
                faceColors: this.funColors
            }, this.scene);
            box.position.copyFrom(pos);

            Tags.AddTagsTo(box, GameEntityTags.Terrain);

            let boxMat = new GridMaterial(`box-mat-${i}`, this.scene);
            boxMat.gridRatio = .25;
            box.material = boxMat;

            
        }

        let floor = MeshBuilder.CreateBox('box-floor', {
            width : long,
            height : h,
            depth : long
        }, this.scene);
        floor.position = new Vector3(0, -h, 0);
        Tags.AddTagsTo(floor, GameEntityTags.Terrain);
        let flMat = new GridMaterial('floor-mat', this.scene);
        flMat.gridRatio = .5;
        flMat.mainColor = Color3.Black();
        flMat.lineColor = Color3.White();
        floor.material = flMat;

    }

    private ofInterestCopyPastedFromShellNotReallyAnythin() 
    {
        // WebAudio API doesn't like it when we try to allocate a lot of sounds,
        // even when only a few are getting played at any one time. This gets
        // around that with small pools of sounds that get played and interrupted, 
        // prioritized by the origin's distance from the player
        
        var spatialSoundOpts = { spatialSound: true, distanceModel: 'exponential', rolloffFactor: 1 };
        // ......
    }

}
