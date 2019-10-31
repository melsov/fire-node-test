// Test user class: stand-in for 
// the actual firebase.User class.
// because firebase auth gives the 
// same user between browser tabs;
// and we want to test different users 
// without having to use multiple browsers

export function StringForUser(user : User) { return user.UID; }

export class User 
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

    public clone() : User 
    {
        let c = new User(this.UID, this.displayName, this.color);
        c.isServer = this.isServer;
        return c;
    }

}
