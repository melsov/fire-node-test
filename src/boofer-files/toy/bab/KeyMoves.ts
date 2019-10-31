export enum DownUpHold
{
    Down = 1, Hold = 2, WentUp = 3, StillUp = 4
}

export function IsDown(duh : DownUpHold) : boolean
{
    return duh <= DownUpHold.Hold;
}

export function TransitionWithInput(current : DownUpHold, next : boolean) : DownUpHold
{
    let result = next ? 
    (current <= DownUpHold.Hold ? DownUpHold.Hold : DownUpHold.Down) : 
    (current <= DownUpHold.Hold ? DownUpHold.WentUp : DownUpHold.StillUp);
    
    if(current <= DownUpHold.WentUp) {
        console.log(`curr: ${current} isDown: ${next} result ${result}`);
    }

    return result;
}

export function Transition(current : DownUpHold) : DownUpHold
{
    return current <= DownUpHold.Hold ? DownUpHold.Hold : DownUpHold.StillUp;
}