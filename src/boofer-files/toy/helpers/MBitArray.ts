import { MByteUtils } from "../Util/MByteUtils";

export class MBitArray
{
    private readonly stor : Uint8Array;

    constructor(
        byteLength : number
    )
    {
        const buff = new ArrayBuffer(byteLength);
        this.stor = new Uint8Array(buff);
    }

    get lengthBits() : number { return this.stor.length * 8; }

    get byteLength() : number { return this.stor.length; }

    get AllOn() : boolean {
        for(let i=0; i<this.stor.length; ++i) {
            if(~this.stor[i] !== 0) { return false; }
        }
        return true;
    }

    get AllOff() : boolean {
        for(let i=0;i<this.stor.length; ++i) {
            if(this.stor[i] !== 0) { return false; }
        }
        return true;
    }

    byteAt(byteIndex : number) : number {
        return this.stor[byteIndex];
    }

    setByteAt(byteIndex : number, _byte : number) {
        this.stor[byteIndex] = _byte;
    }

    get(idx : number) : boolean {
        const bit = idx % 8;
        const b = this.stor[Math.floor(idx/8)];
        return ((b >> bit) & 1) === 1;
    }

    private static GetBit(uint8s : Uint8Array, idx : number) : boolean {
        const bit = idx % 8;
        const b = uint8s[Math.floor(idx/8)];
        return ((b >> bit) & 1) === 1;
    }

    set(idx : number, val : boolean) 
    {
        const bit = idx % 8;
        const pos = Math.floor(idx/8);
        const b = this.stor[pos];
        this.stor[pos] ^= ((val ? -1 : 0) ^ b) & (1 << bit);
    }

    clear(idx : number) 
    {
        this.set(idx, false);
    }

    copyFrom(uint8s : Uint8Array) 
    {
        const len = Math.min(uint8s.length, this.stor.length);
        for(let i=0; i < len; ++i) {
            this.stor[i] = uint8s[i];
        }
    }

    copyFromUint8String(u8str : string) 
    {
        const len = Math.min(u8str.length, this.stor.length);
        for(let i=0; i < len; ++i)
        {
            this.stor[i] = u8str.charCodeAt(i);
        }
    }

    toUint8String() : string { 
        return MByteUtils.Uint8ArrayToString(this.stor); 
    }

    iterateMismatches(otherUint8s : Uint8Array, callback : (next : boolean, idx : number) => void) {
        const len = Math.min(otherUint8s.length, this.stor.length) * 8;
        let next = false, currVal = false;
        for(let i=0; i < len; ++i) {
            next = MBitArray.GetBit(otherUint8s, i);
            currVal = this.get(i);
            if(next !== currVal) {
                callback(next, i);
            }
        }
    }


}