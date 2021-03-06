// *************************************
// Copied to the fire-node-test project
// DONT edit in that project; only edit if you're
// in abfrab-func5
//
export enum HostRequestType
{
    NoPreference, HostListenServer, HostServerOnly, DebugHostOnlyIfNeedHost, ClientOnly
}

export class Newcomer
{
    static hi() { return "hello"; }

    static get dbRoot() : string { return "newcomers"; }

    constructor(
        public name : string,
        public slogan : string = "be strong in stealth",
        public hostRequest : HostRequestType = HostRequestType.NoPreference
    ) 
    {}

    toString() { return `Newcomer ${this.name}. slogan: ${this.slogan}`; }
}

export class RoomAssignment
{
    static get dbRoot() : string { return "room-assignment"; }

    constructor(
        public roomName : string,
        public shouldBeLS : boolean,
        public serverOnly : boolean
    ) 
    {}

    toString() { return `RoomAssignment: ${this.roomName} should be LS: ${this.shouldBeLS}`; }
}