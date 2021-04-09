// DOM element constants
const bestScoreOutput           = document.getElementById("current-best-score");
const cpuPlayersInput           = document.getElementById("cpu-count-input");
const diceGameContainer         = document.getElementById("dice-cup");
const diceOutput                = document.getElementsByClassName("dice");
const diceTotal                 = document.getElementById("dice-total");
const forfeitButton             = document.getElementById("forfeit-button");
const gameOverContainer         = document.getElementById("game-over-container");
const gameWrapper               = document.getElementById("game-wrapper");
const newGameButton             = document.getElementById("new-game");
const outputContainer           = document.getElementById("output-container");
const outputScrollCheckbox      = document.getElementById("output-scroll");
const outputWrapper             = document.getElementById("output-wrapper");
const playerContainer           = document.getElementById("player-container");
const playerList                = document.getElementById("player-list");
const playerNameInput           = document.getElementById("player-name-input");
const playerNameOutput          = document.getElementById("player-name");
const potContainer              = document.getElementById("pot-container");
const rollButton                = document.getElementById("dice-roll");
const showInstructionsButton    = document.getElementById("show-instructions");
const thePotOutput              = document.getElementById("the-pot");
const titleScreenContainer      = document.getElementById("titlescreen-container");
const titleScreenHeader         = document.getElementById("titlescreen-header");

// state values
const ante = 1;
let playerCount = 4;
let players = [];
let finishedPlayers = [];
let retiredPlayers = [];
let diceCup;
let previousRollLockedCount;
let previousLockedDice = [];
let currentLowRoll = 31; // larger than can be rolled
let currentLeader;
let potTotal = 0;
let pushEnabled = false;
let gameOver = false;

/**
 * Main entry point for program execution
 */
window.addEventListener("load", function(){

    /*

        Hey!

        If you're looking here and trying to make sense of this, the general flow works
        as follows:

        1. When the game starts, newGame() sets up a new Game with the default values. This
        creates the human player and all of the CPU players, before calling...

        2. ...newRound(), which does some housekeeping (pays out winner if necessary,
        retires players who have lost all of their money) before determining who leads off the
        round. This is handed off to...

        3. ...newTurn(), which checks to see the result of the last player's turn and makes any
        necessary score updates. It creates a new DiceCup object to represent a new set of
        five dice associated with the next player, which goes into...

        4. ...rollDiceCup(), which makes the player's roll and handles which die or dice
        the player decides to keep. If the player isn't human, it passes the decision making
        off to...

        5. ...cpuTurnLogic(), which handles how the CPU players decide which moves to make before
        calling rollDiceCup() again.

        Both human and CPU players continue to call rollDiceCup() until their turn is over,
        which causes newTurn() to call again until all players have taken their turns, which
        causes newRound() to call until the game is over, which brings you to a screen where
        you can call newGame().

        In sum:

            newGame() -> newRound() -> newTurn() -> rollDiceCup() -> cpuTurnLogic()

        All of the other methods just handle common operations to avoid code duplication.

        Note: it's kind of anticlimactic and difficult for a game to naturally end. This dice
        game is usually played until all parties decide that they're done wasting their time
        and money rather than playing out every round until one player has everyone's last dollar.
        The forfeit button is the most sane way to end the game.

        - John
     */



    showInstructionsButton.addEventListener("click", function(){
        let instructions = document.getElementById("instructions");
        if (instructions.classList.contains("hidden-container")){
            instructions.classList.remove("hidden-container");
        } else {
            instructions.classList.add("hidden-container");
        }
    });

    playerNameInput.addEventListener("keyup", function(event){
        newGameButton.disabled = playerNameInput.value.length < 1;

        if (event.key == "Enter") {
            event.preventDefault();
            newGameEventListener();
        }
    });

    newGameButton.addEventListener("click", newGameEventListener);
});

function newGameEventListener() {
    if (playerNameInput.value.length > 0){
        let humanName = playerNameInput.value;
        titleScreenContainer.classList.add("hidden-container");
        titleScreenHeader.classList.add("hidden-container");
        gameWrapper.classList.remove("hidden-container");
        outputWrapper.classList.remove("hidden-container");

        playerCount = parseInt(cpuPlayersInput.value) + 1;

        newGame(humanName);
    }
}

/**
 * Shows and hides the appropriate elements for the Game Over Screen.
 */
function gameOverDisplay(){
    gameWrapper.classList.add("hidden-container");
    outputWrapper.classList.add("hidden-container");
    gameOverContainer.classList.remove("hidden-container");
    titleScreenContainer.classList.remove("hidden-container");

    rollButton.removeEventListener("click", rollDiceCup);
}

/**
 * Starts a new game.
 */
function newGame(humanName="Player"){
    gameOver = false;
    players = [];
    retiredPlayers = [];
    finishedPlayers = [];
    namesInUse = [];
    colorsInUse = [];
    currentLowRoll = 31;
    previousRollLockedCount = 0;
    currentLeader = null;
    pushEnabled = false;
    potTotal = 0;


    players.push(new Player(true, humanName));
    createPlayers(playerCount-1);

    println(`<strong>New game with ${players.length} players!</strong>`);
    println(`First up will be ${printPrettyPlayerName(players[0])}`);

    newRound();
    bindEventListeners();
}

/**
 * Binds relevant event listeners for DOM elements
 */
function bindEventListeners(){
    rollButton.addEventListener("click", rollDiceCup);

    forfeitButton.addEventListener("click", function(){
        gameOver = true;
        gameOverDisplay();
    });
}

/**
 * Bind the lockListener function to each of the dice DOM elements, to be fired
 * on a click event.
 */
function bindDiceLocks(){
    Array.from(diceOutput).forEach(function(dieOutput){
        if (!dieOutput.classList.contains("locked") ||
            !dieOutput.classList.contains("final-lock")) {
            dieOutput.addEventListener("click", lockListener);
        }
    });
}

/**
 * Event listener for toggling the locked state of rolled dice, meant to be
 * fired on a click event.
 *
 * @param event     Reference to the click event
 */
function lockListener(event){
    if (!event.target.classList.contains("spin")) {
        let index = parseInt(event.target.id.split("-")[1]) - 1;
        let die = diceCup.dice[index];

        if (die.isLocked()) {
            diceCup.unlockDie(index);
            event.target.classList.remove("locked");
        } else {
            diceCup.lockDie(index);
            event.target.classList.add("locked");
        }

        updateScore();
        updateRollButton();
    }
}

/**
 * Animates each non-locked die for a set period of time. Called after the diceCup
 * is rolled in rollDiceCup(). lockListeners won't register during animation.
 *
 * @param baseDuration      Base animation duration in ms
 */
async function animateDiceRoll(baseDuration=500){
    diceCup.showAllSpinAnimation();
    await sleep(baseDuration + getRandomInt(250));
    diceCup.updateAllDiceOutput();
}

/**
 * Starts a new round beginning with the given player and with the given buy-in.
 *
 * @param startingPlayer    The player starting the round.
 * @param ante              The buy-in for the round.
 */
function newRound(startingPlayer=players[0], ante=1){
    if (retiredPlayers.length < playerCount - 1) {
        resetCurrentLowScore();

        // cash out previous winner winner
        if ((typeof currentLeader !== "undefined" && currentLeader !== null) && !pushEnabled) {
            currentLeader.addCash(potTotal);
            currentLeader = null;
        }

        potTotal = pushEnabled ? potTotal : 0;

        if (players.length === 0 && finishedPlayers.length > 0) {
            players = finishedPlayers;
        }

        finishedPlayers = [];

        rotate(players, startingPlayer);

        players.forEach(function (player) {
            let playerAnte = player.anteUp(ante);
            if (!playerAnte && !pushEnabled) {
                player.retire();
                println(`${printPrettyPlayerName(player)} is retired!`);
                retiredPlayers.push(player);

                // end game if this is the human player
                if (player.human) {
                    gameOver = true;
                    gameOverDisplay();
                }
            } else if (playerAnte) {
                potTotal += ante;
                if (player.cash == 0) {
                    println(`<strong>Warning!</strong> ${printPrettyPlayerName(player)} just anted their last dollar!`);
                }
            }
        });

        // check to see if any players need to retire
        retiredPlayers.forEach(function (player) {
            if (players.includes(player)) {
                let index = players.indexOf(player);
                players.splice(index, 1);
            }
        });

        if (gameOver){
            gameOverDisplay();
        } else {
            newTurn(startingPlayer);
        }
    }
    else {
        println(`WINNER!`);
    }
}

async function newTurn(currentPlayer=new Player()){
    if (!gameOver) {
        println("Starting next turn...");
        finishedPlayers.push(players.shift());

        if (typeof diceCup !== "undefined" && diceCup !== null) {
            diceCup.player.removeCurrent();

        }
        diceCup = new DiceCup(diceOutput, currentPlayer);

        previousRollLockedCount = diceCup.lockedDice;

        currentPlayer.makeCurrent();
        unlockDiceOutput();
        updateAllStatuses();
        updateRollButton();

        if (currentPlayer.human) {
            bindDiceLocks();
            println(`${printPrettyPlayerName(diceCup.player)} rolls <strong>${diceCup.diceRemaining()}</strong> dice...`);
            await animateDiceRoll();
            println(`${printPrettyPlayerName(diceCup.player)} rolled <strong>${diceCup.displayUnlockedDice()}</strong>`);
        } else {
            await sleep(1000);
            await rollDiceCup();
        }
    } else {
        // game over man, game over!
        println("<br><strong>Game over man, game over!</strong><br>");
    }
}

/**
 * Removes all CSS classes for locking from the dice DOM elements.
 */
function unlockDiceOutput(){
    Array.from(diceOutput).forEach(function(die){
        die.classList.remove("locked", "final-lock");
    });
}

async function rollDiceCup(){
    // turn or round is over
    if (diceCup.diceRemaining() < 1){
        // round is over
        if (players.length === 0) {
            updateCurrentLowScore();
            if (pushEnabled){
                println(`<em>BAH GOD!</em> ${printPrettyPlayerName(currentLeader)} has started a push round! I'm freaking out here, man!</strong>`);
            } else {
                println(`${printPrettyPlayerName(currentLeader)} wins the pot of <strong>$${potTotal}!</strong>`);
            }
            newRound(currentLeader);
        }
        // turn is over
        else {
            let nextRoundPlayer = players[0];
            updateCurrentLowScore();
            println(`Next player will be ${printPrettyPlayerName(nextRoundPlayer)}`);
            await newTurn(nextRoundPlayer);
        }
    }
    // handle the next player or CPU roll
    else if (previousRollLockedCount < diceCup.lockedDice || !diceCup.player.human) {
        // handle human player's choices from last roll
        if (diceCup.player.human) {
            // finalize last roll's locked dice
            let lockedDiceArray = Array.from(document.getElementsByClassName("locked"));
            let newlyLockedArray = [];

            lockedDiceArray.forEach(function (die) {
                if (die.classList.contains("locked") && !die.classList.contains("final-lock")) {
                    newlyLockedArray.push(die.classList.toString().match(/d\d/)[0][1]);
                }
                die.removeEventListener("click", lockListener);
                die.classList.add("final-lock");
            });

            // output keepers
            if (newlyLockedArray.length > 0) {
                println(`${printPrettyPlayerName(diceCup.player)} keeps 
                    <strong>${newlyLockedArray.toString().replaceAll(",", ", ")}</strong>`);
            }
        }

        // roll, animate, and echo results.
        diceCup.rollDice();
        println(`${printPrettyPlayerName(diceCup.player)} rolls <strong>${diceCup.diceRemaining()}</strong> dice...`);
        await animateDiceRoll();
        println(`${printPrettyPlayerName(diceCup.player)} rolled <strong>${diceCup.displayUnlockedDice()}</strong>`);

        // update state going into next roll, and lock final die if there is only one move.
        previousRollLockedCount = diceCup.lockedDice;
        if (previousRollLockedCount === diceCup.dice.length - 1){
            Array.from(diceOutput).forEach(function(die){
                die.classList.add("locked", "final-lock");
                die.removeEventListener("click", lockListener);
            });
            previousRollLockedCount = diceCup.dice.length;
            diceCup.lockedDice = diceCup.dice.length;
        }

        updateScore();
        updateRollButton();

        // if CPU, decide which moves to make and advance to next roll
        if (!diceCup.player.human){
            await cpuTurnLogic();
            await rollDiceCup();
        }
    }
}

/**
 * Handles the CPU player turn logic. Called by rollDiceCup() when the current player is
 * a CPU.
 *
 * Very simple base logic - picks all threes. In the event of no threes, pick the smallest die.
 *
 * For additional behaviors, CPU players have a chance to play it safe (finalizing their hand as soon as it meets
 * or exceeds the target score), conservatively take extra ones (not the best outcome, but safer than
 * the alternative), or stupidly take a random die without thinking of the outcome.
 *
 * @param feelingSafe       Whether or not the player will settle for any score that beats or ties
 * @param takingOnes        Whether or not the player aggressively takes ones
 * @param stupidBounds      Random 1 in x chance the player makes a stupid move (taking without thinking)
 * @param stupidity         Magic stupid number to match that makes a move stupid
 */
async function cpuTurnLogic(feelingSafe=(getRandomInt(2) == 1),
                            takingOnes=(getRandomInt(3) == 1),
                            stupidBounds=20+getRandomInt(15),
                            stupidity=(getRandomInt(stupidBounds))){
    let newlyLockedDice = [];

    if (diceCup.diceRemaining() > 0) {
        let lowestRoll = 7;
        let lowestRollIndex;
        let canRoll = false;

        // check for threes. If none, pick lowest die.
        for (let index = 0; index < diceCup.dice.length; index++) {
            let die = diceCup.dice[index];

            if (!die.isLocked()) {
                if (die.value < lowestRoll) {
                    lowestRoll = die.value;
                    lowestRollIndex = index;
                }

                let stupidChance = getRandomInt(stupidBounds);

                if (die.value == 3 || (takingOnes && die.value == 1) || stupidity == stupidChance) {
                    if (stupidity == stupidChance) {
                        println(`${printPrettyPlayerName(diceCup.player)} thinks they might be about to do something stupid,
                                 but misinterprets that warning as a sign of weakness.`);
                    } else if (takingOnes && die.value == 1) {
                        println(`${printPrettyPlayerName(diceCup.player)} prudently decides to take a one.`);
                    }
                    diceCup.lockDie(index);
                    newlyLockedDice.push(die.value);
                    canRoll = true;
                }
            }

            diceCup.updateAllDiceOutput();
            await sleep(200);
        }

        if (!canRoll) {
            diceCup.lockDie(lowestRollIndex);
            newlyLockedDice.push(diceCup.dice[lowestRollIndex].value);
            diceCup.updateAllDiceOutput();
        }
    }

    // keep specific dice if the cpu still has valid moves, otherwise finish turn
    if (diceCup.lockedDiceTotal() > currentLowRoll){
        println(`${printPrettyPlayerName(diceCup.player)} can't match or beat the lowest roll!`);
        diceCup.lockAllDice();
        diceCup.updateAllDiceOutput();
    } else if ((players.length === 0 || feelingSafe) && finishedPlayers.length !== 1
                && diceCup.diceTotal() <= currentLowRoll) {
        println(`${printPrettyPlayerName(diceCup.player)} plays it safe and takes all remaining dice.`);
        diceCup.lockAllDice();
        diceCup.updateAllDiceOutput();
    } else {
        if (newlyLockedDice.length > 0) {
            println(`${printPrettyPlayerName(diceCup.player)} keeps <strong>
                ${newlyLockedDice.toString().replaceAll(",", ", ")}</strong>`);
        }
    }

    await sleep(500);
}

/**
 * Creates multiple CPU players.
 *
 * @param playerCount       number of CPU players to generate
 */
function createPlayers(playerCount){
    for (let i = 0; i < playerCount; i++){
        players.push(new Player());
    }

    updatePlayerList();
}

/**
 * Updates the displayed status of all of the game's players.
 */
function updatePlayerList(){
    playerList.innerHTML = "";

    finishedPlayers.concat(players).concat(retiredPlayers).forEach(function(player) {
        playerList.innerHTML += `${player.toString()}<br>`;
    });
}

/**
 * Update the roll button state to display the proper message and disable if player
 * isn't able to roll. Hides Roll button for CPU players.
 */
function updateRollButton(){
    if (diceCup.player.human){
        rollButton.classList.remove("cpu");
    } else {
        rollButton.classList.add("cpu");
    }

    if (diceCup.diceRemaining() === 0){
        rollButton.innerText = "Finalize Round";
    } else {
        rollButton.innerText = "Roll Dice";
    }

    rollButton.disabled = (previousRollLockedCount === diceCup.lockedDice
        && diceCup.diceRemaining() !== 0);
}

/**
 * Updates current score, current pot total, and current low roll simultaneously.
 */
function updateAllStatuses(){
    updateCurrentLowScore();
    updatePot();
    updatePlayerList();
    updatePlayerName();
    updateScore();
}

function updateScore(){
    diceTotal.innerHTML = `&#127922; ${diceCup.lockedDiceTotal()}`;
}

function updatePot(){
    thePotOutput.innerHTML = `&#128176; ${potTotal.toString()}`;
}

function updatePlayerName(){
    //playerNameOutput.innerHTML = `${diceCup.player.name}`;
    playerNameOutput.innerHTML = `${printPrettyPlayerName(diceCup.player)}`;
}

function updateCurrentLowScore(){
    if (diceCup.lockedDice === diceCup.dice.length){
        if (diceCup.diceTotal() <= currentLowRoll) {
            if (typeof currentLeader !== "undefined" && currentLeader !== null) {
                currentLeader.removeLeader();
            }

            pushEnabled = (diceCup.diceTotal() === currentLowRoll);
            currentLowRoll = diceCup.diceTotal();
            currentLeader = diceCup.player;

            currentLeader.makeLeader();

            if (!pushEnabled) {
                println(`<strong>New Low Roll!</strong> - <span class="output" style="color: ${currentLeader.color}">
                        ${currentLeader.name}</span> with a roll of <strong>${currentLowRoll}</strong>`);
            }
            else {
                println(`<strong>PUSH!</strong> <span class="output" style="color: ${currentLeader.color}">
                        ${currentLeader.name}</span> ties the low roll!`);
            }
        }
    }

    if (currentLowRoll < 31) {
        bestScoreOutput.innerHTML = pushEnabled? `&#129474; ` : `&#128081; `;
        bestScoreOutput.innerHTML += `${currentLowRoll.toString()}`;
    }
}

/**
 * Resets the lowest score to one plus the maximum value for a hand of threes.
 */
function resetCurrentLowScore(){
    currentLowRoll = 31;
    bestScoreOutput.innerHTML = "-";
}

/**
 * Shortcut for printing out a player's name with its specific color
 *
 * @param player        The player
 * @returns {string}    Formatted player name as a string
 */
function printPrettyPlayerName(player){
    if (player instanceof Player){
        return `<span class="output" style="color: ${player.color}">${player.name}</span>`;
    }
}

/**
 * Scrolls the output container to follow the new output.
 */
function updateScroll(){
    if (outputScrollCheckbox.checked) {
        outputContainer.scrollTop = outputContainer.scrollHeight;
    }
}

/**
 * Shortcut to output a given message to the outputContainer.
 *
 * @param message   Message to be printed to the outputContainer
 */
function println(message){
    outputContainer.innerHTML += `${message} <br>`;
    updateScroll();
}