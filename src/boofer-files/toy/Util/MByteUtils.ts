
export class MByteUtils
{

    static ByteSizeNumberToString(n:number) : string 
    {
        let buff = new Uint8Array(1);
        buff[0]=n;
        return MByteUtils.Uint8ArrayToString(buff);    
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

}