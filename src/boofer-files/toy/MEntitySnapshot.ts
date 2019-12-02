import { InterpData, ImmutableInterpdata } from "./bab/NetworkEntity/MNetworkEntity";
import { MByteUtils } from "./Util/MByteUtils";
import { Vector3 } from "babylonjs";
import { FireActionType } from "./bab/NetworkEntity/transient/MTransientStateBook";

// CONSIDER: we don't need a health and ammo update
// in each update. e.g. every other would probably be 
// fine. 
// Could determine whether there is non i. data by 
// the byte string length.
// Could use a flag to toggle the type of data sent:
// health, ammo, projectile hits on me,
export class NonInterpolatedData
{
    constructor(
        readonly health : number,
        readonly ammos : [number, number], // two ammo amounts for primary and secondary weapons
        readonly wasProjectileHit : boolean,
        readonly firedWeapon : FireActionType
    ) {
    }

    toByteString() : string
    {
        let result = this.packHealthAndFlags(); // MByteUtils.ByteSizeNumberToString(this.health);
        result += MByteUtils.ByteSizeNumbersToString(this.ammos);
        return result;
    }

    static FromByteString(str : string) 
    {
        const healthAndFlags = this.GetHealthAndFlags(str.charCodeAt(0));
        return new NonInterpolatedData(
            healthAndFlags[0],
            [str.charCodeAt(1), str.charCodeAt(2)],
            healthAndFlags[1],
            healthAndFlags[2]
        );
    }

    private static GetHealthAndFlags(n : number) : [number, boolean, number]
    {
        const health = n & 0b00011111;
        const wasProjectileHit = ((n >>> 7) & 1) === 1;
        const firedWeapon = ((n >>> 5) & 3);
        return [health, wasProjectileHit, firedWeapon];
    }

    private packHealthAndFlags() : string
    {
        let p = this.health & 0b00011111;
        p |= this.wasProjectileHit ? 0b10000000 : 0;
        p |= (this.firedWeapon << 5);
        return MByteUtils.ByteSizeNumberToString(p);
    }

    static SizeBytes() : number { return 3; }
}

// TODO: handle transient state changes
// optionally include e.g. projectile-hits-on-me
export class MEntitySnapshot
{
    constructor(
        readonly netId : string,
        private readonly _interpData : InterpData,
        readonly nonInterpData : NonInterpolatedData
    ) {}

    get interpData() : ImmutableInterpdata { return this._interpData; }

    getMutableInterpData() : InterpData { return this._interpData; }

    static SizeBytes() : number { return 2 + InterpData.SizeFloatBytes() + NonInterpolatedData.SizeBytes(); }

    toByteString() : string
    {
        const netidstr = `${this.netId}`;
        const idstr = this._interpData.toByteString();
        const nonintdstr = this.nonInterpData.toByteString();
        return `${netidstr}${idstr}${nonintdstr}`;
    }

    static FromByteString(str : string) : MEntitySnapshot
    {
        const netidstr = str.substr(0, 2);
        const intdstr = str.substr(2, InterpData.SizeFloatBytes());
        const nonintdstr = str.substr(2 + InterpData.SizeFloatBytes(), NonInterpolatedData.SizeBytes());
        return new MEntitySnapshot(
            netidstr,
            InterpData.FromByteString(intdstr),
            NonInterpolatedData.FromByteString(nonintdstr)
        );
    }
}