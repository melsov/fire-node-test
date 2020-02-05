export enum DownUpHold
{
    Down = 1, Hold = 2, WentUp = 3, StillUp = 4
}

export function IsDown(duh : DownUpHold) : boolean
{
    return duh <= DownUpHold.Hold;
}

export function TransitionWithInput(current : DownUpHold, nextIsDown : boolean) : DownUpHold
{
    let result = nextIsDown ? 
    (current <= DownUpHold.Hold ? DownUpHold.Hold : DownUpHold.Down) : 
    (current <= DownUpHold.Hold ? DownUpHold.WentUp : DownUpHold.StillUp);
    
    if(current <= DownUpHold.WentUp) {
        console.log(`curr: ${current} isDown: ${nextIsDown} result ${result}`);
    }

    return result;
}

export function Transition(current : DownUpHold) : DownUpHold
{
    return current <= DownUpHold.Hold ? DownUpHold.Hold : DownUpHold.StillUp;
}

// 
// Capture a button state
// but remember down presses until the next frame
export class FloppableDownUpHold
{
    private anyDownStateThisFrame = DownUpHold.StillUp;
    private _state = DownUpHold.StillUp;

    update(nextIsDown : boolean) : void
    {
        this._state = TransitionWithInput(this._state, nextIsDown);
        // for a click: state goes from down to wentup (skips hold)
        switch(this._state)
        {
            case DownUpHold.Down:
                this.anyDownStateThisFrame = DownUpHold.Down;
                break;
            case DownUpHold.Hold:
                this.anyDownStateThisFrame = DownUpHold.Hold;
                break;
            default:
                break;
        }
        // this.anyDownStateThisFrame = this.anyDownStateThisFrame <= DownUpHold.Hold ?
        //     this._state : 
        //     DownUpHold.Hold;
    }

    stateThisFrame() : number
    {
        return this.anyDownStateThisFrame;
    }

    reset() : void
    {
        this.anyDownStateThisFrame = this.anyDownStateThisFrame === DownUpHold.Down ? 
            DownUpHold.WentUp : 
            DownUpHold.StillUp;
    }

}

export class KeyDownEdgeTrigger
{
    private prev = DownUpHold.StillUp;
    get canTrigger() : boolean { return this.prev > DownUpHold.Hold; }

    update(next : DownUpHold) : boolean
    {
        const result = this.prev > DownUpHold.Hold && next <= DownUpHold.Hold;
        this.prev = next;
        return result;
    }

    reset() : void
    {
        this.prev = DownUpHold.StillUp;
    }


}