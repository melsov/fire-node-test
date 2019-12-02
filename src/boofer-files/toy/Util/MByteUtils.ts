import { Vector3 } from "babylonjs";

export class MByteUtils
{

    static ByteSizeNumberToString(n:number) : string 
    {
        return String.fromCharCode(n);
    }

    static ByteSizeNumbersToString(ns : number[]) : string
    {
        let result = '';
        for(let i=0; i<ns.length; ++i) result += String.fromCharCode(ns[i]);
        return result;
    }


    static Uint8ArrayToString(uint8Buffer : Uint8Array) : string
    {
        let result = "";
        uint8Buffer.forEach((v) => {
            result += String.fromCharCode(v);    
        })
        return result;
    }

    static StringToUInt8s(str : string) : Uint8Array
    {
        let result = new Uint8Array(str.length);

        for(let i=0; i<str.length; ++i) {
            result[i] =str.charCodeAt(i);
        }
        return result;
    }

    static MaxConvertibleFloat : number = Math.pow(2, 23) - 1;

    static CanVecConvertReliably(v : Vector3) : boolean
    {
        return Math.abs(v.x) < this.MaxConvertibleFloat &&  Math.abs(v.y) < this.MaxConvertibleFloat && Math.abs(v.z) < this.MaxConvertibleFloat;
    }

    static Vec3ToArrayBuffer(v : Vector3) : ArrayBuffer
    {
        // if(!this.CanVecConvertReliably(v)){
        //     throw new Error(`${v} can't be converted reliably`);
        // }
        const floats = new Float32Array(3);
        v.toArray(floats, 0);
        return floats.buffer;
    }

    static get VecU8StringLength() : number { return 12; }

    static Vec3ToUint8String(v : Vector3) : string
    {
        const buff = this.Vec3ToArrayBuffer(v);
        const uint8s = new Uint8Array(buff);
        return this.Uint8ArrayToString(uint8s);
    }

    static Uint8StringToVec3(u8str : string) : Vector3
    {
        const uint8s = this.StringToUInt8s(u8str);
        const floats = new Float32Array(uint8s.buffer);
        return Vector3.FromArray(floats, 0);
    }

    static DebugByteTo01String(n : number) : string
    {
        let str = '';
        for(let i=7; i>=0; --i)
        {
            str += ((n >>> i) & 1) === 1 ? '1' : '0';
        }
        return str;
    }

    static DebugUint8To01String(uint8Array : Uint8Array, arrayFormat ? : boolean) : string
    {
        let str = '';
        for(let i = 0; i < uint8Array.length; ++i) {
            if(!arrayFormat) {
                str += this.DebugByteTo01String(uint8Array[i]);
            } else {
                str += `${i}: [${this.DebugByteTo01String(uint8Array[i])}]`;
            }
        }
        return str;
    }

}