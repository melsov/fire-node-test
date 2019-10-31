import * as GUIUtil from "./GUIUtil";
import { NodeFriendlyDivElement, NodeFriendlyInputElement } from "./NodeFriendlyElement";



export class UINumberSet
{
    readonly container : NodeFriendlyDivElement; // HTMLElement;
    readonly inputs = new Array<NodeFriendlyInputElement>(); // HTMLInputElement>();

    onInputChanged : (v : number[]) => void = (v : number[]) => {};

    constructor(
        public readonly containerId : string,
        length : number,
        labels ? : string[],
        initialValues ? : number[],
        onInputChanged ? : (ns : number[]) => void
    ) 
    {
        this.container = GUIUtil.FindOrCreateDiv(containerId);

        if(onInputChanged) { this.onInputChanged = onInputChanged; }

        for(let i=0; i < length; ++i) 
        {
            let label = new NodeFriendlyDivElement( document.createElement("span"));
            label.innerText = labels && labels.length > i ? labels[i] : "";
            this.container.appendChild(label);

            let inp = new NodeFriendlyInputElement( document.createElement("input"));
            inp.value = initialValues && initialValues.length > i ? `${initialValues[i]}` : '0';
            this.inputs.push(inp);
            inp.addEventListener("change", () => {
                this.onEdit();
            });
            label.appendChild(inp);
        }
    }

    getValueAt(i : number) : number {
        return parseFloat(this.inputs[i].value);
    }

    setValueAt(i : number, val : number) : void 
    {
        this.inputs[i].value = `${val}`;
    }

    setValues(ns : number[]) : void 
    {
        ns.forEach((n,idx) => {
            this.setValueAt(idx,n);
        });
    }


    get Vals() : number[] { 
        let v  : number[] = [];
        for(let i=0; i<this.inputs.length; ++i){
            v.push(this.getValueAt(i));
        }
        return v;
    }

    private onEdit() : void {
        this.onInputChanged(this.Vals);
    }
}