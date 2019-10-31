
export class NFStyle 
{
    color : string = "";
    fontSize : string = "";
    sourceElement : any | undefined;

    private _display : string = "";

    set display(dstr : string) {
        this._display = dstr;
        if(this.sourceElement && this.sourceElement.style) {
            this.sourceElement.style.display = dstr;
        }
    }


    
}

export class NodeFriendlyElement
{
    disabled : boolean = false;
    id : string = "";
    style : NFStyle = new NFStyle();

    protected set sourceElement(sE : any) {
        this.style.sourceElement = sE;
    }

    protected get sourceElement() : any | undefined { return this.style.sourceElement; }
    
}

export class NodeFriendlyCheckboxElement extends NodeFriendlyElement
{
    private _checked : boolean = false;
    constructor(
        _sourceElement ? : any
    ) {
        super();
        if(_sourceElement && _sourceElement.checked !== undefined) {
            this.sourceElement = _sourceElement;
        }
    }

    get checked() : boolean { 
        if(this.sourceElement) { return this.sourceElement.checked; }
        return this._checked; 
    }

    set checked(b : boolean) {
        if(this.sourceElement) {
            this.sourceElement.checked = b;
            return;
        }
        this._checked = b;
    }
}

export class NodeFriendlyInputElement extends NodeFriendlyElement
{
    value : string = '';
    constructor(elem ? : any) {
        super();
        if(elem && elem.value !== undefined){
            this.sourceElement = elem;
        }
    }

    addEventListener(name : string, callback : () => void) {

    }
}

export class NodeFriendlyDivElement extends NodeFriendlyElement
{
    private inner : string = '';
    private _children : any[] = [];

    constructor(_sourceElement ? : any) {
        super();
        if(_sourceElement && _sourceElement.innerHTML !== undefined) {
            this.sourceElement = _sourceElement;
        }
    }

    set innerHTML(s : string) {
        if(this.sourceElement) {
            this.sourceElement.innerHTML = s;
        }
    }
    
    set innerText(s : string) {
        if(this.sourceElement) {
            this.sourceElement.innerText = s;
        }
        this.inner = s;
    }

    get innerHTML() : string { return this.inner; }
    get innerText() : string { return this.inner; }

    appendChild(c : any) {
        this._children.push(c);
    }
}

export class NodeFriendlyButtonElement extends NodeFriendlyElement
{
    constructor(
        _sourceElement : any
    ){
        super();
        if(_sourceElement && _sourceElement.onclick !== 'undefined') {
            this.sourceElement = _sourceElement;
        }
    }

    set onclick(callback : (ev : any) => void) {
        if(this.sourceElement) {
            this.sourceElement.onclick = callback;
        }
    }
}