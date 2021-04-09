class Die{
    constructor(sides=6){
        if (typeof sides !== "number" || sides < 2){
            throw new Error("Die must have more than 1 side.");
        }

        this.locked = false;
        this.sides  = sides;
        this.roll();
    }

    roll() {
        if (!this.isLocked()) {
            this.value = getRandomInt(this.sides) + 1;
            return this.value;
        }
    }

    isLocked(){
        return this.locked;
    }

    lock(){
        this.locked = true;
    }

    unlock(){
        this.locked = false;
    }
}