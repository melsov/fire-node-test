import { MPlayerInput, CliCommand } from "./MPlayerInput";
import { UINumberSet } from "../html-gui/UINumberSet";
import { Vector3 } from "babylonjs";
import * as KeyMoves from './KeyMoves';

//
// Player who moves back and forth forever for testing
//
export class MMetronomeInput extends MPlayerInput
{
    private intervalMillis : number = 2200;
    private restTimeMillis : number = 500;
    private angleIncrDegrees : number = 5;

    private uiConfig = new UINumberSet('metronome-config', 3,
        ['interval', 'rest', 'angleIncrDegrees'],
        [2200, 500, 5], 
        (ns) => {
            this.intervalMillis = ns[0];
            this.restTimeMillis = ns[1];
            this.angleIncrDegrees = ns[2];
        });

    nextInputAxes() : CliCommand
    {
        let cmd = super.nextInputAxes();
        cmd.horizontal = 0;
        cmd.jump = Math.random() > .99;
        cmd.fire = Math.random() < .01 ? KeyMoves.DownUpHold.Down : KeyMoves.DownUpHold.StillUp;
        let totalInterval = (this.intervalMillis + this.restTimeMillis);
        let tpos = cmd.timestamp % totalInterval;
        let dir = (cmd.timestamp % (totalInterval * 2)) > totalInterval ? -1 : 1;
        cmd.vertical = (tpos > this.intervalMillis ? 0 : 1) * dir;
        return cmd;
    }
}