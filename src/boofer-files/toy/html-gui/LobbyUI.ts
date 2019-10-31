import { NodeFriendlyDivElement, NodeFriendlyButtonElement } from "./NodeFriendlyElement";


    export class LobbyUI
    {
        private respawnCountdownDisplay  = new NodeFriendlyDivElement(document.getElementById('respawnCountdown'))
        private enterGameButton  = new NodeFriendlyButtonElement(document.getElementById('button-enter-game'));
        private lobbyContainer = new NodeFriendlyDivElement( document.getElementById('lobby-container'));
        public handleEnterGamePressed : (ev : any) => void = () => {};

        constructor()
        {
            this.enterGameButton.onclick = (ev : any) => {
                this.handleEnterGamePressed(ev);
            };
        }
        
        showHide(show : boolean) : void
        {
            this.lobbyContainer.style.display = show ? 'inline' : 'none';
        }
        
        showCountDown(remainingSeconds : number) : void
        {
            this.toggleEnterOrCountdownVisible(false);
            this.respawnCountdownDisplay.innerText = `${remainingSeconds}`;
        }
        
        showEnterButton() : void
        {
            this.toggleEnterOrCountdownVisible(true);
        }

        private toggleEnterOrCountdownVisible(wantEnter : boolean) 
        {
            this.enterGameButton.style.display = wantEnter ? 'inline' : 'none';
            this.respawnCountdownDisplay.style.display = wantEnter ? 'none' : 'inline';
        }


    }
// }