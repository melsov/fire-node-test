import { MBitArray } from "./MBitArray";

export class MBitLookup<T>
{

    private readonly stateBook : MBitArray;

    constructor(
        private readonly stor : T[]
    ) 
    {
        this.stateBook = new MBitArray(Math.ceil(stor.length/8));
    }

    get(idx : number) : boolean {
        return this.stateBook.get(idx);
    }

    set(idx : number, val : boolean, callback ? : (prev : boolean, next : boolean, item : T) => void) 
    {
        const prev = this.get(idx);
        const item = this.stor[idx];
        this.stateBook.set(idx, val);
        if(callback) {
            callback(prev, val, item);
        }
    }

    clear(idx : number, callback ? : (prev : boolean, next : boolean, item : T) => void) 
    {
        this.set(idx, false, callback);
    }

    
}