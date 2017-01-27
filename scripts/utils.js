/**
 * File with all kinds of useful methods for the project.
 */

/**
 * converts hexadecimal to bytes
 *
 * @return Blob
 */
function hexToBytes(hex) {
    // conversion to a binary array:
    let byteArray = new Uint8Array(hex.length / 2);
    for (let i = 0; i < byteArray.length; i++) {
        // conversion du string en bits avec parseInt:
        byteArray[i] = parseInt(hex.substr(i * 2, 2), 16);
    }
    // create a blob used to send the data:
    return new Blob([byteArray], {type: "application/octet-stream"});
}

/**
 * converts bytes to hexadecimal
 *
 * @return Uint8Array
 */
function bytesToHex(byteArray) {
    // conversion to a binary b:
    let ua = new Uint8Array(byteArray);
    let h = '0x';
    for (let i = 0; i < ua.length; i++) {
        h += ("0"+ ua[i].toString(16)).slice(-2)+ " ";
    }
    return h;
}

/**
 * Compare two Uint8Array, if they are the same return true, otherwise false.
 *
 * @param first
 * @param second
 * @returns {boolean}
 */
function isEqualTo(first, second) {
    if (first.length != second.length) {
        return false;
    } else {
        for (let i = 0; i < first.length; i++) {
            if (first[i] != second[i]) {
                return false;
            }
        }
        return true;
    }
}

/**
 * Translate a file in base64 to a file in Uint8Array
 *
 * @param base64
 * @returns {Uint8Array}
 */
function fromBase64toUint8Array(base64) {
    return new Uint8Array(atob(base64).split("").map(function(c) {
        return c.charCodeAt(0); }));
}

/**
 * Transform in a 'pretty' string the uptime of a server
 *
 * @param dateToParse     string representing the uptime of a server
 * @returns {string}      'pretty' string
 */
function displayPrettyDate(dateToParse) {
	let t = dateToSeconds(dateToParse);
	let hour = Math.floor(t / 3600);
	let date = "" + intPad0( hour % 24 ) + ":" + intPad0(t / 60 % 60) + ":" +
		intPad0(t % 60);
	let days = Math.floor( hour / 24 );
	if ( days > 0 ){
		date = "" + days % 7 + "d " + date;
	}
	let weeks = Math.floor( days / 7 );
	if ( weeks > 0 ){
		date = "" + weeks + "w " + date;
	}
    return date;
}

/**
 * Takes a date from golang-format "xxhxxmxx.xxxxs" and returns integer-seconds
 */
function dateToSeconds(date){
	let t = date.split(/[hm\.]/);
	// remove milliseconds
	t.pop();
	let sec = t.pop() || 0;
	let min = t.pop() || 0;
	let hour = t.pop() || 0;
	return hour * 3600 + min * 60 + sec * 1;
}

/**
 * Takes the integer of i, then zero-pads on the left to make 2-digit number
 */
function intPad0(i){
	let j = Math.floor(i);
	if ( j < 10 ){
		return "0" + j;
	}
	return j;
}

/**
 * Returns the traffic per hour in bytes
 */
function trafficSec(node){
	let traffic = (parseInt(node.rx_bytes) + parseInt(node.tx_bytes));
	traffic = Math.floor(traffic / ( dateToSeconds(node.uptime)) );
	return traffic;
}