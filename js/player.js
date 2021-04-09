let namesInUse    = [];
let colorsInUse   = [];

class Player{
    constructor(human=false, name, color, cash=5){
        if (typeof cash !== "number" || cash < 0){
            throw new Error("Starting cash must be a number greater than zero.")
        }

        if (typeof human !== "boolean"){
            throw new Error("Human parameter must be boolean.");
        }

        if (name === undefined || typeof name !== "string" ||  name.length == 0){
            name = randomNameNotInArray(namesInUse);
        }
        if (color === undefined || typeof color !== "string" || !isHexColorString(color)){
            color = randomColorNotInArray(colorsInUse);
        }

        namesInUse.push(name);
        colorsInUse.push(color);
        this.cash       = cash;
        this.color      = color;
        this.current    = false;
        this.leader     = false;
        this.name       = name;
        this.human      = human;
        this.retired    = false;
    }

    addCash(winnings) {
        this.cash += winnings;
    }

    makeCurrent(){
        this.current = true;
    }

    removeCurrent(){
        this.current = false;
    }

    makeLeader(){
        this.leader = true;
    }

    removeLeader(){
        this.leader = false;
    }

    anteUp(ante){
        if (this.cash >= ante){
            this.cash -= ante;
            return true;
        }

        return false;
    }

    retire(){
        this.retired = true;
    }

    toString(){
        let returnString = `<span class="player-string`;
        returnString += this.retired ? ` retired` : ``;
        returnString += this.current ? ` current` : ``;
        returnString += this.leader ? ` leader` : ``;
        returnString += `" style="border-left-color: ${this.color}">`;
        returnString += this.leader ? `&#128081; ` : ``;
        returnString += this.current ? `&#127922; ` : ``;
        returnString += `${this.name} `;
        returnString += this.retired ? `&#9760; ` : this.human? `&#128528; ` : `&#129302; `;
        returnString += ` - <span class="player-cash">$${this.cash}</span></span>`;

        return returnString;
    }
}