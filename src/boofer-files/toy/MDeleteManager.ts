import { Set } from 'typescript-collections'


// keep track of players
// we need to delete (on the server)
export class MDeleteManager
{
    public deletables = new Set<string>();


    addLongId(dId : string) 
    {
        this.deletables.add(dId);
    }

    forEach(callback : (delId : string) => void) 
    {
        const vals = this.deletables.toArray();
        for(let i=0; i<vals.length; ++i) {
            callback(vals[i]);
        }
    }

    clear() 
    {
        this.deletables.clear();
    }

}