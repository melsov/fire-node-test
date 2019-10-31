
export function IsRunningInNode() : boolean {
    return (typeof process !== 'undefined') && (process.release !== undefined) && (process.release.name === 'node');
}

export class MDetectNode
{
    static IsRunningInNode() { 
        //return (typeof process !== 'undefined') && (process.release.name === 'node'); 
        return IsRunningInNode();
    }
}