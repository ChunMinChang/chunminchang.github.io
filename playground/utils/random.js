/**
 * Returns a random number between min (inclusive) and max (exclusive)
 */
function GetRandomArbitrary(min, max) {
  return Math.random() * (max - min) + min;
}

/**
* Returns a random integer between min (inclusive) and max (inclusive)
* Using Math.round() will give you a non-uniform distribution!
*/
function GetRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
* Returns a random boolean value
*/
function GetRandomBool() {
return GetRandomInt(0, 1);
}