import { MNetworkEntity, MNetworkPlayerEntity } from "./bab/NetworkEntity/MNetworkEntity";
import * as Collections from "typescript-collections";
import { Vector3, Scene, Ray, Tags, RayHelper, Nullable, Color3, Mesh, AbstractMesh } from "babylonjs";
import * as MServer  from "./MServer";
import { GameEntityTags } from "./GameMain";
import { MEntityManager } from './MEntityManager';

export class Relevancy
{
    static Filter(
        observer : MNetworkPlayerEntity | undefined, 
        entityManager : MEntityManager,
        scene : Scene, 
        relevantBook : Collections.Dictionary<string, number>, 
        closeByRadius : number,
        callback : (relevancy : MServer.Relevancy, key : string, ent : MNetworkEntity, prevRelevancy : MServer.Relevancy) => void
        ) : void
    {
        if(observer === undefined) { return; } // ws; }
        
        let keys = entityManager.lookup.keys();
        let key : string = '';
        let relevancy : number | undefined = 0;
        let prevRelevancy : MServer.Relevancy = MServer.Relevancy.NOT_RELEVANT;
        let ent : MNetworkEntity | undefined = undefined;
        for(let j=0; j<keys.length; ++j)
        {
            key = keys[j];
            ent = <MNetworkEntity> entityManager.lookup.getValue(key);
            relevancy = relevantBook.getValue(key);

            if(relevancy !== undefined) { prevRelevancy = relevancy; }

            if(ent === observer) { relevancy = prevRelevancy = MServer.Relevancy.RECENTLY_RELEVANT; }
            else if(relevancy === undefined) { 
                relevancy = MServer.Relevancy.NOT_RELEVANT; 
            }
            // CONSIDER: clients can request relevancy for net ents that they might be about to encounter (they think)
            // without this we risk getting 'statues': never updated other players that stay in their last seen spot in the cli players view
            // could use a simple (fairly wide) radius (or a box since we foresee a boxy world? or some cleverly bounced rays) to determine which n-ents to request
            // within this radius, only need to ask for others who were not seen in the last update.
            // OR (BETTER): Simply mark irrelevant players as irrelevant in server updates and make them invisible on the client
            else if (relevancy <= -MServer.Relevancy.RECENTLY_RELEVANT) { // They haven't been relevant for a while. force relevance. 
                relevancy = MServer.Relevancy.NOT_RELEVANT + 2; 
            } 
            relevancy = <number> relevancy;

            if(relevancy < MServer.Relevancy.RECENTLY_RELEVANT) 
            {
                let corners = ent.puppet.getBoundsCorners();
                for(let i=0;i<corners.length; ++i) 
                {
                    let dif = corners[i].subtract(observer.position);
                    let distSq = dif.lengthSquared();
                    if(distSq < closeByRadius * closeByRadius) {
                        relevancy = MServer.Relevancy.RECENTLY_RELEVANT;
                        break;
                    }

                    let ray = new Ray(observer.position.clone(), dif, 1.1);

                    let pinfo = scene.pickWithRay(ray, (mesh : AbstractMesh) => {
                        if(mesh === null) return false; 
                        if(mesh.name === observer.netId) return false; // pass through this player
                        let tgs = <string | null> Tags.GetTags(mesh, true); 
                        if(tgs === null) return false;
                        return (tgs.indexOf(GameEntityTags.PlayerObject) >= 0 || tgs.indexOf(GameEntityTags.Terrain) >= 0) 
                    }, true); // want fastCheck

                    if(pinfo && pinfo.hit && pinfo.pickedMesh) {
                        if(pinfo.pickedMesh.name === ent.netId) {
                            relevancy = MServer.Relevancy.RECENTLY_RELEVANT;
                            // could call break here. except debug rays
                        }
                    }

                    if(relevancy === MServer.Relevancy.RECENTLY_RELEVANT) {
                        break;
                    }

                } // END OF CORNERS LOOP
            }

            relevancy--;
            relevantBook.setValue(key, relevancy);

            callback(relevancy, key, ent, prevRelevancy);

        }
    }

}
