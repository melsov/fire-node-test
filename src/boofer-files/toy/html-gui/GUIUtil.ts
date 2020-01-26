import { NodeFriendlyDivElement } from "./NodeFriendlyElement";
import { MDetectNode } from "../../../MDetectRunningInNode";

const AppendDefualtDivId = "buttons";

// export namespace GUIUtil
// {

    export function FindOrCreateDiv(id : string, container ? : Node) : NodeFriendlyDivElement//  HTMLDivElement
    {
        let result = document.getElementById(id);
        if(result) return new NodeFriendlyDivElement(result); // <HTMLDivElement>result;
        return CreateDivAppendTo(container, id);
    }

    export function CreateDivAppendToDefault(newDivID ? : string) : NodeFriendlyDivElement // HTMLDivElement
    {
        let container = <HTMLDivElement> document.getElementById(AppendDefualtDivId);
        return CreateDivAppendTo(container, newDivID);
    }

    export function CreateDivAppendTo(container ? : any, newDivID ? : string) : NodeFriendlyDivElement//  HTMLDivElement
    {
        let div = document.createElement("div");
        if(MDetectNode.IsRunningInNode()) {
            return new NodeFriendlyDivElement(div);
        }
        if(newDivID) { div.id = newDivID; }
        if(!container) { 
            container = <HTMLDivElement> document.getElementById(AppendDefualtDivId);
        }
        container.appendChild(div);
        return new NodeFriendlyDivElement(div); // div;
    }

    // Not safe for node!
    export function FindOrCreateButtonNodeUnsafe(newId : string, container ? : any) : HTMLButtonElement
    {
        let b = <HTMLButtonElement>document.getElementById(newId);
        if(!b) {
            b = CreateButtonNodeUnsafe(container, newId);
        }
        return b;
    }
    export function CreateButtonNodeUnsafe(container ? : any, newId ? : string) : HTMLButtonElement
    {
        let button = document.createElement("button");
        
        if(newId) { button.id = newId; }
        if(!container) { 
            container = <HTMLDivElement> document.getElementById(AppendDefualtDivId);
        }
        container.appendChild(button);
        return button;
    }
// }