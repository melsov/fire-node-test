import { Vector3, Ray, Camera, Matrix, Color3, Material, Nullable, expandToProperty, AbstractMesh, Scene, TransformNode, Node, Skeleton, Mesh, MeshBuilder, Epsilon } from "babylonjs";
import { BHelpers } from "../MBabHelpers";
import { GridMaterial } from "babylonjs-materials";
import { Set } from "typescript-collections";
import { Float16Array, getFloat16, setFloat16, hfround } from "@petamoriken/float16";

const MEU : number = .001;

export class MUtils 
{


    // uh oh: circular references not tracked
    //
    // static DeepCopy(obj : any)
    // {
    //     if(obj == null || typeof(obj) != 'object')
    //     return obj;

    //     var temp = new obj.constructor(); 
    //     for(var key in obj)
    //         temp[key] = DeepCopy(obj[key]);

    //     return temp;
    // }

    static Assert(theTruth : boolean, err ? : string){
        if(!theTruth) {
            throw new Error(err != undefined ? err : "assertion error");
        }
    }

    static RandomString(len ? : number) {
        if(len === undefined) len = 10;
        var result           = '';
        var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        var charactersLength = characters.length;
        for ( var i = 0; i < len; i++ ) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    }

    static RandIntMaxInclusive(max : number) : number 
    {
        max = Math.floor(max);
        return Math.floor(Math.random() * (max + 1)); 
    }

    static RandIntMaxExclusive(max : number) : number 
    {
        max = Math.floor(max);
        return Math.floor(Math.random() * max);    
    }

    // export const Epsilon : number = .0000001;

    static IsWithinEpsilon(f : number) : boolean 
    {
        return f < Epsilon && f > -Epsilon;
    }

    static AbsGreaterThanEpsilon(f:number) : boolean 
    {
        return f > Epsilon || f < -Epsilon;    
    }

    static VecHasNonEpsilon(v:Vector3) : boolean 
    {
        return MUtils.AbsGreaterThanEpsilon(v.x) || MUtils.AbsGreaterThanEpsilon(v.y) || MUtils.AbsGreaterThanEpsilon(v.z);
    }

    static AssertVecNotNan(v : Vector3, err ? : string) { MUtils.Assert(!MUtils.VecContainsNan(v), err != undefined ? err : `vec was nan ${v}`); }

    static VecContainsNan(v : Vector3) : boolean
    {
        return (isNaN(v.x) || isNaN(v.y) || isNaN(v.z));
    }

    static RoundToReasonable(f:number) : number {
        return Math.round(f * 300)/300;
    }

    static RoundMoveVecInPlace(v:Vector3) 
    {
        v.x = MUtils.RoundToReasonable(v.x);
        v.y = MUtils.RoundToReasonable(v.y);
        v.z = MUtils.RoundToReasonable(v.z);
    }

    static FormatFloat(f:number, places : number) : string {
        return (Math.round(f * Math.pow(10, places))/Math.pow(10, places)).toFixed(places);
    }

    static FormatVector(v:Vector3, places : number) : string {
        return `[${MUtils.FormatFloat(v.x, places)},${MUtils.FormatFloat(v.y, places)},${MUtils.FormatFloat(v.z,places)}]`;
    }

    static WriteVecToFloatArray(fsrView : any, v : Vector3, offset : number) : void 
    {
        fsrView[offset] = v.x;
        fsrView[offset + 1] = v.y;
        fsrView[offset + 2] = v.z;
    }

    static ReadVec(floatArray: any, offset : number) : Vector3 
    {
        return new Vector3(
            floatArray[offset],
            floatArray[offset + 1],
            floatArray[offset + 2]
        );    
    }


    static CopyXZInPlace(to : Vector3, from : Vector3) : void
    {
        to.x = from.x; to.z = from.z;
    }

    static AddXZInPlace(target : Vector3, increment : Vector3) : void 
    {
        target.x += increment.x; target.z += increment.z;
    }

    static LengthXZSquared(v : Vector3) : number
    {
        return v.x * v.x + v.z * v.z;
    }

    //
    // Returns a 'shadow' vector on the plane represented by normal
    // assume normal is normalized
    //
    static ProjectOnNormal(incoming : Vector3, normal : Vector3) : Vector3
    {
        let nProj = Vector3.Dot(incoming, normal);

        // in = nP + shadow
        return incoming.subtract(normal.scale(nProj));
    }

    static RayFromTo(from : Vector3, to : Vector3) : Ray
    {
        let dif = to.subtract(from);
        return new Ray(from, dif.normalizeToNew(), dif.length());
    }

    static IsVerySmall(n : number) : boolean { return Math.abs(n) < MEU; }

    static roundToPlace(n : number, places ? : number) : number {
        let mult = Math.pow(10, places ? places : 2);
        return Math.round(n * mult) / mult;
    }

    static RoundedString(n : number, places ? : number) : string 
    {
        return  MUtils.roundToPlace(n, places).toFixed(places ? places : 2);
    }

    static RoundVecString(v : Vector3, places ? : number) : string
    {
        return `x: ${MUtils.RoundedString(v.x, places)}, y: ${MUtils.RoundedString(v.y, places)}, z: ${MUtils.RoundedString(v.z, places)}`;
    }

    static GetMVP(cam : Camera) : Matrix
    {
        return Matrix.GetFinalMatrix(
            cam.viewport,
            cam.getWorldMatrix(),
            cam.getViewMatrix(),
            cam.getProjectionMatrix(),
            cam.minZ,
            cam.maxZ
        );
    }

    static CreateGridMaterial(scene : Scene, mainColor : Color3, lineColor ? : Color3) : GridMaterial
    {
        let result = new GridMaterial('util-grid-mat', scene);
        result.mainColor = mainColor;
        if(lineColor) {
            result.lineColor = lineColor;
        }
        return result;
    }

    static CreateGridMatSphere(scene : Scene, mainColor : Color3, lineColor ? : Color3, diameter ? : number) : Mesh
    {
        let sphere = MeshBuilder.CreateSphere('util-sphere', {
            diameter : diameter ? diameter : 1
        }, scene);

        sphere.material = MUtils.CreateGridMaterial(scene, mainColor, lineColor);
        return sphere;
    }

    static InverseLerp(from : number, to : number, t : number) : number
    {
        if(Math.abs(to - from) < .00001) return 0;
        return (t - from) / (to - from);
    }

    // credit: https://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript
    static StringToHash(str : string) : number 
    {
        let hash = 0, i, chr;
        if (str.length === 0) return hash;
        for (i = 0; i < str.length; i++) {
            chr   = str.charCodeAt(i);
            hash  = ((hash << 5) - hash) + chr;
            hash |= 0; // Convert to 32bit integer
        }
        return hash;
    }

    static Clamp(t : number, min : number, max : number) : number
    {
        return Math.max(min, Math.min(t, max));
    }

    static Clamp01(t : number) { return MUtils.Clamp(t, 0, 1); }

    static RandomBrightColor() : Color3 
    {
        let c = Color3.Random();
        // TODO: use HSV instead
       
        return c;
    }

    static SetGridMaterialColor(mat : Nullable<Material>, c : Color3, lineColor ? : Color3) : void 
    {
        if(!mat) return;
        let gmat = <GridMaterial> mat;
        gmat.mainColor = c;
        if(lineColor) gmat.lineColor = lineColor;
    }

    static StringArrayContains(arr : string[], searchStr : string) : boolean
    {
        for(let i=0; i<arr.length; ++i) { if(arr[i] === searchStr) return true; }
        return false;
    }


    static RootifiedClone(rootName : string, meshes : AbstractMesh[], scene : Scene, extraProcessing ? : (m : Node, orig : Node) => void) : TransformNode
    {
        let root = new TransformNode(rootName, scene);

        for(let i=0; i < meshes.length; ++i) 
        {
            let mesh = meshes[i];
            if(mesh.parent === null) {
                let clone = mesh.clone(`${mesh.name}`, root);

                // extra processing
                if(extraProcessing && clone) {
                    extraProcessing(clone, mesh);
                    let children = clone.getChildren((n : Node) => { return true}, false);
                    let origChildren = mesh.getChildren((n : Node) => { return true}, false);
                    for(let j=0; j < children.length; ++j) {
                        extraProcessing(children[j], origChildren[j]);
                    }
                }
            }

        }
        return root;
    }

    static GetAllChildren(node : Node) : Node[]
    {
        // params: filter predicate , only direct children (default true)
        return node.getChildren((n : Node) => { return true; }, false);
    }

    static GetAllMeshChildren(node : Node) : Mesh[]
    {
        return <Mesh[]> node.getChildren((n : Node) => {
            return n instanceof Mesh;
        }, false);
    }

    static JSONStringifyDiscardCircular(o:any) : string {
        // Note: cache should not be re-used by repeated calls to JSON.stringify.
        var cache : any = []; 
        let result = JSON.stringify(o, function(key, value) {
            if (typeof value === 'object' && value !== null) { 
                if (cache.indexOf(value) !== -1) {
                    // Duplicate reference found, discard key
                    return;
                }
                // Store value in our collection
                cache.push(value);
            }
            return value;
        });
        cache = null; // Enable garbage collection
        return result;
    }

    static PadToString(n:number, padding : number = 3, padChar : string = '0') {
        let str = `${n}`;
        while(str.length < padding) str = padChar + str;
        return str;
    }

    static GetQueryStrings() : string[] 
    {
        let split = document.location.toString().split('?');
        if(split.length < 2) { return [] };
        return split[1].split('&');
    }

    static QueryStringContains(param:string) : boolean 
    {
        return MUtils.GetQueryStrings().some(x => x === param);
    }

    

}

export class JHelpers
{
    static RayFromJ(jray : any) : Ray
    {
        return new Ray(BHelpers.Vec3FromJSON(jray.origin), BHelpers.Vec3FromJSON(jray.direction), jray.length);
    }
}