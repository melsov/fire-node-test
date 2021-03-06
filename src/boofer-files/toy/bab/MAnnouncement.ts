import { Nullable } from "babylonjs";
import { MAnnouncement, MAbstractConfirmableMessage } from "../helpers/MConfirmableMessage";
import { NodeFriendlyDivElement } from "../html-gui/NodeFriendlyElement";

// export class MAnnouncement
// {

//     constructor(
//         public content : string
//     ){}

// }

export class MAnnounce
{
    static FromServerUpdate(su : any) : Nullable<Array<MAbstractConfirmableMessage>>
    {
        if(su.confirmableMessages === undefined) {
            return null;
        }
        let result : Array<MAbstractConfirmableMessage> = su.confirmableMessages;

        return result;
    }

    // export function AddToServerUpdate(anns: Nullable<Array<MAnnouncement>>, su : any) : void
    // {
    //     if(!anns || anns.length === 0) { return; }
    //     su.a = anns;
    // }
}

export class MMessageBoard
{
    private scroller = new NodeFriendlyDivElement( document.getElementById('scroller'));

    maxMessages : number = 8;

    mergeDuplicates : boolean = true;

    private readonly messages : Array<MAnnouncement> = new Array<MAnnouncement>();

    add(ann : MAnnouncement, dontUpdateDisplay ? : boolean) {

        if(this.mergeDuplicates && this.messages.length > 0) {
            if(this.messages[this.messages.length - 1].id === ann.id &&
                 this.messages[this.messages.length - 1].announcementText === ann.announcementText) {
                return;
            }
        }
        this.messages.push(ann);
        if(this.messages.length >= this.maxMessages) this.messages.shift();

        if(dontUpdateDisplay === undefined || dontUpdateDisplay === false) {
            this.rescroll();
        }
    }

    push(anns : Array<MAnnouncement> | undefined) : void
    {
        if(anns === undefined) { return; }
        
        for(let i=0; i<anns.length; ++i) { 
            this.add(anns[i], true);
        }

        this.rescroll();
    }

    private rescroll() : void 
    {
        let strs = [];
        for(let i=0; i< this.messages.length; ++i) { 
            strs.push(`${this.messages[i].announcementText} <br />`);
        }
        this.scroller.innerHTML = strs.join('');
    }

}