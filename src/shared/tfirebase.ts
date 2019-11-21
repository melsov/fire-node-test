// *************************************
// Copied to the fire-node-test project
// DONT edit in that project; only edit if you're
// in abfrab-func5
//

// Test user class: stand-in for 
// the actual firebase.User class.
// because firebase auth gives the 
// same user between browser tabs;
// and we want to test different users 
// without having to use multiple browsers

export function StringForUser(user : FBUser) { return user.UID; }

export class FBUser 
{

    public isServer : boolean = false;
    constructor(
        public UID : string,
        public displayName : string,
        public color : number
    )
    {}

    public debug() {
        return `tF.User: ${this.UID}, name: ${this.displayName}, color: ${this.color}`;
    }

    public clone() : FBUser 
    {
        let c = new FBUser(this.UID, this.displayName, this.color);
        c.isServer = this.isServer;
        return c;
    }

}