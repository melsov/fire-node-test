import { ClientControlledPlayerEntity } from "../bab/NetworkEntity/ClientControlledPlayerEntity";
import { NodeFriendlyDivElement } from "./NodeFriendlyElement";

export class MStatusHUD
{
    private container = new NodeFriendlyDivElement( document.getElementById('status'));

    constructor(
        public player : ClientControlledPlayerEntity
    ) {

    }

    public update() : void
    {
        this.container.innerText = `health: ${this.player.health.val}`;
    }
}