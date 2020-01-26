import { ClientControlledPlayerEntity } from "../bab/NetworkEntity/ClientControlledPlayerEntity";
import { NodeFriendlyDivElement } from "./NodeFriendlyElement";
import * as ProgressBar from "progressbar.js";
import { MAX_HEALTH } from "../bab/MPlayerAvatar";
import { MUtils } from "../Util/MUtils";
import { MDetectNode } from "../../../MDetectRunningInNode";

export class MStatusHUD
{
    // private container = new NodeFriendlyDivElement( document.getElementById('status'));
    private ammoDiv = new NodeFriendlyDivElement(document.getElementById("ammo"));
    private healthDiv = new NodeFriendlyDivElement(document.getElementById("health"));
    private health : any;

    constructor(
        private readonly player : ClientControlledPlayerEntity
    ) {
        if(MDetectNode.IsRunningInNode())
        {
            this.health = undefined;
            return;
        }
        const stroke = 22;
        this.health = new ProgressBar.Circle(health, {
            color: '#FFEA82',
            trailColor: '#eee',
            trailWidth: stroke,
            duration: 100,
            // easing: 'easeInOut',
            strokeWidth: stroke + 1,
            from: {color: '#fc4e03', a:0},
            to: {color: '#d0de73', a:1},
            // Set default step function for all animate calls
            step: function(state, circle) {
              circle.path.setAttribute('stroke', state.color);
              var value = Math.round(circle.value() * 100);
              circle.setText(value);
            }
          });
    }

    public update() : void
    {
        if(MDetectNode.IsRunningInNode()) { return; }

        this.ammoDiv.innerText = 
        `HEALTH: ${this.player.health.val}  ${this.player.playerPuppet.arsenal.equipped().clipAmmo} / ${this.player.playerPuppet.arsenal.equipped().getUIAmmo()}`;
        // this.healthDiv.innerText = `${this.player.health.val}`;
        this.health.set(MUtils.Clamp01(this.player.health.val / MAX_HEALTH));
    }
}