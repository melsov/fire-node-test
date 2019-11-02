import { AssetsManager, MeshAssetTask, Scene, TextFileAssetTask, BinaryFileAssetTask, Nullable, TextureAssetTask, AbstractAssetTask } from "babylonjs";

//
// We may not want to use the AssetManager
// to load files in all cases. Doesn't seem to work
// when running in node, specifically.
// Hide the particular loading method from outsiders.
//
// export namespace MMultiLoader
// {
    //export var G_RUNNING_IN_NODE : boolean | undefined = undefined;

    export class MNodeWorkAroundAM
    {
        private am : AssetsManager;
        private nodeMode : boolean = false;
        private serverUrl : string | undefined;

        private static get  AssetsRootPath() : string { return "assets"; }

        // private static IsGlobalNodeFlagSet() : boolean{
        //     return G_RUNNING_IN_NODE !== undefined && G_RUNNING_IN_NODE;
        // }

        constructor(
            scene : Scene,
            nodeMode ? : boolean,
            serverUrl ? : string
        ) {
            this.am = new AssetsManager(scene);
            if(nodeMode) { 
                this.nodeMode = nodeMode; 
                this.serverUrl = serverUrl ? serverUrl : "http://localhost:8000";
            }
        }

        set onProgress(onProg : (remaining : number, total : number, task : AbstractAssetTask) => void) {
            this.am.onProgress = onProg;
        }

        set onFinish(onFin : (tasks : AbstractAssetTask[]) => void) {
            this.am.onFinish = onFin;
        }


        addTextFileTask(taskName : string, url : string) : TextFileAssetTask
        {
            return this.am.addTextFileTask(taskName, this.FormatURL(url));
        }

        addBinaryFileTask(taskName : string, url : string) : BinaryFileAssetTask
        {
            return this.am.addBinaryFileTask(taskName, this.FormatURL(url));
        }

        addMeshTask(taskName : string, meshNames : Nullable<string[]>, rootUrl : string, sceneFilename : string) : MeshAssetTask
        {
            return this.am.addMeshTask(taskName, meshNames, this.FormatURL(rootUrl), sceneFilename);
        }

        addTextureTask(taskName : string, url : string, noMinimap ? : boolean, invertY ? : boolean, samplingMode ? : number) : TextureAssetTask
        {
            return this.am.addTextureTask(taskName, this.FormatURL(url), noMinimap, invertY, samplingMode);
        }

        load() : AssetsManager
        {
            return this.am.load();
        }

        static AddAssetRootToPath(path : string) : string {
            return `${MNodeWorkAroundAM.AssetsRootPath}/${path}`;
        }

        private FormatURL(url : string) : string
        {
            // if 'node-mode' add server url to path type urls
            let fullPath = MNodeWorkAroundAM.AddAssetRootToPath(url);
            if(this.nodeMode) {
                if(url.indexOf('http') !== 0) {
                    return `${this.serverUrl}/${fullPath}`;
                }
            }
            return fullPath;
        }
    }
// }

