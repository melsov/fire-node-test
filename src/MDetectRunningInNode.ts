
export function IsRunningInNode() : boolean {
    return (typeof process !== 'undefined') && (process.release !== undefined) && (process.release.name === 'node');
}

export class MDetectNode
{
    static IsRunningInNode() { 
        //return (typeof process !== 'undefined') && (process.release.name === 'node'); 
        return IsRunningInNode();
    }

    static Argv() : string[]
    {
        if(IsRunningInNode()) 
        {
            return process.argv;
        }

        return new Array<string>();
    }

    static GetCmdLineArg(arg : string) : any 
    {
        return process.argv[process.argv.indexOf(arg)];
    }
}