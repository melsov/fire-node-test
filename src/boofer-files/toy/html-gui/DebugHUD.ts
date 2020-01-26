import { NodeFriendlyDivElement } from "./NodeFriendlyElement";

export class DebugHud
{
    container : NodeFriendlyDivElement; // HTMLElement;

    constructor(divID : string)
    {
        let _container = new NodeFriendlyDivElement(document.getElementById(divID)); // <HTMLElement | null> document.getElementById(divID);
        if(_container == null)
        {
            _container = new NodeFriendlyDivElement(document.createElement("div"));
            _container.id = divID;
        }
        this.container = _container;

        //test
        this.show("hi from debug hud");
        console.log("***DBUGHUD****");
    }

    show(str : string) { this.container.innerText = str; }
    append(str : string) { this.container.innerText = `${this.container.innerText} ${str}`; }

}