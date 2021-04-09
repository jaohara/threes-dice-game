/**
 * Returns whether or not a string represents a RGB color in hex.
 *
 * @param colorString   string representation of the color, with or without #
 * @returns {boolean}   whether or not the string is a a hex color
 */
function isHexColorString(colorString){
    if (typeof colorString !== "string"){
        return false;
    }

    colorString = colorString.replace("#", "");

    if (colorString.length !== 3 && colorString.length !== 6){
        return false;
    }

    let colorInDecimal = parseInt(colorString, 16);

    return (colorInDecimal >= 0 && colorInDecimal <= 16777215);
}

/**
 * Returns a random name from a set of defaults.
 *
 * @returns {string}    Random name from the set.
 */
function randomName(){
    // I might want to make these a file that I read so I can modify it externally
    let defaultNames = ["Max Rockatansky","Buckaroo Banzai","Ash Williams","Ivan Drago",
        "Imperator Furiosa","Korben Dallas","Salacious Crumb","Norma Desmond",
        "Sugar Kane","Sarah Connor","Johnny Utah","Leeloo","Ellen Ripley",
        "James Cole","Kathryn Railly","Jeffrey Goines","Clarice Starling",
        "Jackie Brown","James Bond","Honey Ryder","Martin Riggs","Roger Murtaugh",
        "Mark Renton","Francis Begbie","Steve Zissou","Alistair Hennessey",
        "Pinky Carruthers"];

    defaultNames.sort(()=>Math.random()-0.5);
    return defaultNames.pop();
}

/**
 * Returns a random color from a set of defaults.
 *
 * @returns {string}    Random color from the set as a hex value.
 */
function randomColor(){
    let defaultColors = ["#C01C28",
        "#F66151",
        "#CB4B16",
        "#E9AD0C",
        "#859900",
        "#26A269",
        "#33C7DE",
        "#2A7BDE",
        "#12488B",
        "#6C71C4",
        "#A347BA"];

    defaultColors.sort(()=>Math.random()-0.5);
    return defaultColors.pop();
}


/**
 * Returns a random name not already in a given array of names by calling
 * randomElementNotInArray(array, "name").
 *
 * @param array         The array containing existing names
 * @returns {string}    Random unique name not already in array
 */
function randomNameNotInArray(array){
    return randomElementNotInArray(array, "name");
}

/**
 * Returns a random color not already in a given array of names by calling
 * randomElementNotInArray(array, "color").
 *
 * @param array         The array containing existing colors
 * @returns {string}    Random unique color not already in array.
 */
function randomColorNotInArray(array){
    return randomElementNotInArray(array, "color");
}

/**
 * Returns a random element not already in a given array of elements. Makes the assumption
 * that the array doesn't already contain every possible element; will loop indefinitely
 * if that is the case.
 *
 * @param array         The array containing the elements
 * @param elementType   Type of element as a string, either "name" or "color"
 * @returns {string}    Random unique element not already in array.
 */
function randomElementNotInArray(array, elementType){
    if (!Array.isArray(array)){
        throw new Error("Provided argument isn't an array.");
    } else if (!["name","color"].includes(elementType)){
        throw new Error("Checked element is neither a name nor color.");
    }

    let element = "";

    do {
        element = (elementType === "name") ? randomName() : randomColor();
    } while (array.includes(element))

    return element;
}

/**
 * A prettier way to get a random int between 0 and max (non-inclusive)
 *
 * @param max           non-inclusive bound of random int
 * @returns {number}    the random integer
 */
function getRandomInt(max=6){
    return Math.floor(Math.random() * Math.floor(max));
}

/**
 * Function to rotate an array so that it starts at the index of newFront while preserving
 * the original order. rotate([1,2,3,4,5], 3) will return [3,4,5,1,2].
 *
 * @param array     Array object to rotate
 * @param newFront  element that will be
 * @returns {*}     rotated array
 */
function rotate(array, newFront){
    if (!Array.isArray(array)){
        throw new Error("Provided object must be an array.");
    }
    //console.log(`New Front received: ${newFront}`);
    //console.log(`Looking in this array: ${array}`);

    let newFrontIndex = array.indexOf(newFront);
    //console.log(newFrontIndex);

    // array contains
    if (newFrontIndex >= 1){
        for (let i = 0; i < newFrontIndex; i++) {
            array.push(array.shift());
        }
    }

    return array;
}

function sleep(delay){
    return new Promise(resolve => setTimeout(resolve, delay));
}