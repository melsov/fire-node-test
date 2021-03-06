import { MAbstractWeapon, MShotgun } from "./MWeapon";
import { MUtils } from "../../../Util/MUtils";
import * as MLoader from "../../MAssetBook";

export class MArsenal
{
    public readonly weapons : MAbstractWeapon[];
    private index : number = 0;
    
    constructor(
        _weapons : MAbstractWeapon[]
    ) 
    {
        MUtils.Assert(_weapons.length > 0, "need at least one weapon");
        this.weapons = _weapons.slice(0);
    }
 
    public unshift(mw : MAbstractWeapon) 
    {
        this.weapons.unshift(mw);
    }

    public equipped() : MAbstractWeapon { return this.weapons[this.index]; }

    public setEquipped(idx : number) : void 
    {
        if(idx < 0) return;
        this.index = idx % this.weapons.length;
    }

    getAmmos() : [number,number] {
        const ammos = new Array<number>();
        for(let i=0; i<this.weapons.length; ++i) {
            ammos.push(this.weapons[i].totalAmmo);
        }
        return [ammos[0], ammos.length > 1 ? ammos[1] : 0];
    }

    public setAmmos(ammos : number[]) {
        // this will happen (TODO: add a secondary weapon)
        // if(ammos.length !== this.weapons.length) throw new Error(`bad ammo update. update array len: ${ammos.length}`);
        for(let i=0; i<ammos.length; ++i) {
            if(i < this.weapons.length)
                this.weapons[i].setTotalAmmo(ammos[i]);
        }
    }

    // TODO: rethink relationship btwn weapon and ammo?
    getTotalAmmo() : number {
        return this.equipped().totalAmmo;
    }

    addAmmo() {
        this.equipped().addAmmo();
    }

    next() : void 
    {
        this.index = (this.index + 1) % this.weapons.length;
    }

    previous() : void
    {
        this.index = this.index === 0 ? this.weapons.length - 1 : this.index - 1;
    }

    static MakeDefault(mapPackage : MLoader.MapPackage) : MArsenal
    {
        //TODO : make a weapon mesh set using asset book

        return new MArsenal([
            MShotgun.CreateShotgun(mapPackage),
        ]);
    }


}