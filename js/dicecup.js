class DiceCup{
    constructor(diceOutput, player=new Player(), dice=5, sides=6, threes=true){
        if (typeof dice !== "number" || dice < 1){
            throw new Error("Dice must be a number greater than 1.");
        }

        if (typeof threes !== "boolean"){
            throw new Error("threes parameter must be a boolean.");
        }

        if (typeof diceOutput !== "object" || diceOutput.length != dice){
            throw new Error("diceOutput must be an object of length equal to the number of dice.");
            console.log(Array.isArray(diceOutput))
        }

        if (!(player instanceof Player)){
            throw new Error("player argument must be a reference to an instance of the Player class.");
        }

        this.dice       = [];
        this.diceOutput = diceOutput;
        this.lockedDice = 0;
        this.player     = player;
        this.threes     = threes;

        for (let i = 0; i < dice; i++){
            this.dice.push(new Die(sides));
        }

        this.updateAllDiceOutput();
    }

    checkDiceIndex(index){
        if (typeof index !== "number" || index < 0 || index > this.dice.length-1){
            throw new Error("Invalid dice index for the diceCup.");
        }
    }

    diceTotal(lockedOnly=false){
        let total = 0;
        let threes = this.threes;

        this.dice.forEach(function(die){
            if (!threes || die.value != 3) {
                if (!lockedOnly || die.isLocked()) {
                   total += die.value;
                }
            }
        });

        return total;
    }

    lockedDiceTotal(){
        return this.diceTotal(true);
    }

    diceRemaining(){
        return this.dice.length - this.lockedDice;
    }

    lockDie(index){
        this.checkDiceIndex(index);

        if (!this.dice[index].isLocked()) {
            this.dice[index].lock();
            this.lockedDice++;
        }
    }

    lockAllDice(){
        for (let index = 0; index < this.dice.length; index++){
            this.lockDie(index);
        }
    }

    unlockDie(index){
        this.checkDiceIndex(index);

        if(this.dice[index].locked){
            this.dice[index].unlock();
            this.lockedDice--;
        }
    }

    rollDie(index){
        this.checkDiceIndex(index);

        if (!this.dice[index].isLocked()){
            this.dice[index].roll();
        }
    }

    rollDice(){
        for (let index = 0; index < this.dice.length; index++){
            this.rollDie(index);
            this.updateDiceOutput(index);
        }
    }

    showSpinAnimation(index){
        if (index >= 0 && index < this.diceOutput.length){
            if (!this.diceOutput[index].classList.contains("locked") ||
                !this.diceOutput[index].classList.contains("final-lock")) {
                this.diceOutput[index].classList.remove("d1", "d2", "d3", "d4", "d5", "d6");
                this.diceOutput[index].classList.add("spin");
            }
        }
    }

    showAllSpinAnimation(){
        for (let index = 0; index < this.diceOutput.length; index++){
            this.showSpinAnimation(index);
        }
    }

    updateDiceOutput(index){
        if (index >= 0 && index < this.diceOutput.length){
            this.diceOutput[index].classList.remove("d1","d2","d3","d4","d5","d6", "spin");
            this.diceOutput[index].classList.remove("d-human","d-cpu");

            this.diceOutput[index].classList.add(`d${this.dice[index].value}`);
            this.diceOutput[index].classList.add(this.player.human? "d-human" : "d-cpu");

            // this might break stuff
            if (this.dice[index].isLocked()){
                this.diceOutput[index].classList.add("locked");

                if (!this.player.human){
                    this.diceOutput[index].classList.add("final-lock");
                }
            }
        }
    }

    updateAllDiceOutput(){
        for (let index = 0; index < this.diceOutput.length; index++){
            this.updateDiceOutput(index)
        }
    }

    displayUnlockedDice(){
        return this.displayDiceSet();
    }

    displayLockedDice(){
        return this.displayDiceSet(true);
    }

    displayDiceSet(locked=false){
        let diceArray = [];

        this.dice.forEach(function(die){
            if (die.isLocked() == locked){
                diceArray.push(die.value);
            }
        });

        return diceArray.toString().replaceAll(",", ", ");
    }


    toString(){
        return `DiceCup holding ${this.dice.length} dice - ${this.lockedDice} locked`;
    }
}